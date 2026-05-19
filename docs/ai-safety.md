# AI Safety Guardrails

This is the canonical reference for the `@workspace/ai-safety` package. It
describes every guardrail that ships in the template, what each one protects
against, how to configure it, and where its limits lie.

## Overview

The `@workspace/ai-safety` package wraps AI-powered API routes with a layered
set of defensive guardrails. Together they protect against four broad classes
of risk:

- **Abuse and overuse** — bursts of requests from a single client, automated
  scraping, or denial-of-wallet attempts against a paid AI provider.
- **Prompt injection** — user input that tries to override the system prompt,
  reveal hidden instructions, or coerce the model into a different role.
- **Accidental data leaks** — secrets, API keys, or personally identifiable
  information that the model might echo back in responses, or that operators
  might forward to a third-party provider in logs.
- **Runaway cost** — single requests with excessive token counts, or sustained
  usage that blows past a user's hourly budget.

The package is intentionally narrow. It is **not** a substitute for a
production-grade moderation service (such as OpenAI's moderation endpoint or
Azure Content Safety), nor does it replace human review for high-stakes
content. The built-in content safety check is keyword-based and exists to
catch obvious problems and to give operators a hook for plugging in a real
moderation API. Treat these guardrails as a defense-in-depth foundation, not
as the last line of defense.

## How they compose

The package exposes individual guardrails for direct use, plus a
`createAiSafetyMiddleware` factory that chains them into a single pipeline.
The factory enforces the following order on every request:

```text
rate-limit → sanitize → content-safety (input) → token-budget → MODEL → output-filter → pii-redactor
```

The order matters. Cheap checks (rate limiting) run before expensive ones
(model calls). Input is sanitized before it is shown to the content moderator
so that obvious prompt-injection patterns are flagged separately from policy
violations. Output guardrails run after the model so that any sensitive
patterns the model emits are filtered before the response leaves the server.

Canonical usage in an API route:

```typescript
import { createAiSafetyMiddleware } from "@workspace/ai-safety"

const safeAi = createAiSafetyMiddleware({
  rateLimit: { maxRequests: 10, windowMs: 60_000 },
  sanitize: { maxLength: 4_000, sensitivity: "medium" },
  contentSafety: { categories: ["violence", "hate_speech", "self_harm"] },
  tokenBudget: { maxTokensPerRequest: 2_048, maxTokensPerUserPerHour: 50_000 },
  outputFilter: { maxLength: 20_000, blocklist: [] },
  piiRedactor: { types: ["email", "phone", "ssn", "credit_card"] },
})

export async function POST(req: Request) {
  const { userId, prompt } = await req.json()

  const result = await safeAi({ userId, input: prompt }, async (input) => {
    // Your AI call goes here. Return the model's text and the tokens it used.
    const completion = await callYourModel(input)
    return { output: completion.text, tokensUsed: completion.totalTokens }
  })

  if (!result.success) {
    return Response.json({ error: result.error }, { status: 400 })
  }

  return Response.json({ output: result.output, metadata: result.metadata })
}
```

## Each guardrail

### Rate limiter

**What it does.** Tracks how many requests a given key (typically a user ID or
IP address) has made within a rolling time window, and rejects requests that
exceed the configured maximum. Implemented as an in-memory sliding window: the
limiter remembers the timestamps of recent requests and drops any that fall
outside the window.

**What it protects against.** Brute-force abuse, runaway clients, denial-of-
wallet attacks against paid AI APIs, and accidental load from buggy
integrations.

**Default config.**

```typescript
{ maxRequests: 60, windowMs: 60_000 } // 60 requests per minute
```

**How to configure.**

```typescript
import { RateLimiter } from "@workspace/ai-safety"

const limiter = new RateLimiter({ maxRequests: 10, windowMs: 60_000 })
const result = limiter.check(userId)
// result: { allowed: boolean, remaining: number, resetAt: number }
```

**Limitations.** The limiter stores state in process memory, so it does not
share counters across replicas or survive restarts. For multi-instance
deployments, replace the implementation with a Redis-backed limiter or a
provider-managed rate limiter. The limiter also does not distinguish between
authenticated users and anonymous traffic — pick the key carefully.

**Source.** `packages/ai-safety/src/guardrails/rate-limiter.ts`

### Input sanitizer

**What it does.** Scans user input for known prompt-injection patterns
("ignore previous instructions", role-override attempts, system-prompt
exfiltration phrasing) and returns a list of flags describing what it found.
It also normalizes Unicode (NFKC) so homoglyph variants cannot bypass the
pattern checks, and truncates input that exceeds the configured length.

**What it protects against.** Common prompt-injection phrasings, role
overrides, attempts to coerce the model into revealing its system prompt, and
oversized inputs that would otherwise drive up token costs.

**Default config.**

```typescript
{ maxLength: 10_000, sensitivity: "medium" }
```

Sensitivity levels are cumulative:

- `low` — catches only the most obvious phrasings ("ignore previous
  instructions", "you are now", direct system-prompt assignments).
- `medium` — adds disregard/override phrasings, "act as", and requests to
  repeat the initial prompt. This is the default.
- `high` — adds "pretend", "roleplay", "jailbreak", "DAN", and reveal/show
  instruction phrasings. More aggressive, with more false positives.

**How to configure.**

```typescript
import { sanitizeInput } from "@workspace/ai-safety"

const result = sanitizeInput(userPrompt, {
  maxLength: 4_000,
  sensitivity: "high",
})
// result: { safe: boolean, sanitized: string, flags: string[] }
```

**Limitations.** Pattern matching is inherently a moving target. Determined
attackers can paraphrase around any blocklist, and aggressive sensitivity will
flag legitimate roleplay prompts. Treat the flags as signals to log, alert on,
and (in the middleware) reject — not as proof that input is benign when no
flag fires.

**Source.** `packages/ai-safety/src/guardrails/input-sanitizer.ts`

### Token budget

**What it does.** Enforces two limits per user: a maximum estimated token
count for any single request, and a maximum total token count per user per
hour. The `check` method estimates the tokens in an input and refuses
oversized requests up front. The `record` method logs the actual token count
returned by the model so the hourly budget reflects real usage.

**What it protects against.** Runaway cost — a single user filling a prompt
with millions of characters, or a stuck client looping requests through your
paid API.

**Default config.**

```typescript
{ maxTokensPerRequest: 4_096, maxTokensPerUserPerHour: 100_000 }
```

**How to configure.**

```typescript
import { TokenBudget } from "@workspace/ai-safety"

const budget = new TokenBudget({
  maxTokensPerRequest: 2_048,
  maxTokensPerUserPerHour: 50_000,
})

const pre = budget.check(userId, prompt)
if (!pre.allowed) {
  // Reject the request.
}

// After the model responds, record the actual tokens consumed.
budget.record(userId, completion.totalTokens)
```

**Limitations.** Token estimation is a rough heuristic of about four
characters per token of English text. Code, non-Latin scripts, and structured
JSON will skew significantly. For accurate billing, swap in a real tokenizer
(such as `tiktoken` or your provider's SDK). Usage is also stored in process
memory, so the per-user hourly counters reset on restart and do not aggregate
across replicas. A multi-instance deployment needs an external store for the
hourly counters.

**Source.** `packages/ai-safety/src/guardrails/token-budget.ts`

### Output filter

**What it does.** Scans model output for patterns that look like secrets
leaking back through the response (API key prefixes, AWS access keys,
"password ="-style assignments, generic base64 secrets). Matching patterns
are replaced with `[REDACTED]`, and output that exceeds the configured length
is truncated.

**What it protects against.** Accidental disclosure of secrets that the model
either memorized during training, picked up from a tool result, or was tricked
into echoing by the user. Also caps response size to bound downstream cost.

**Default config.**

```typescript
{
  maxLength: 50_000,
  blocklist: [
    /(?:api[_-]?key|token|secret|password)\s*[:=]\s*["']?[a-zA-Z0-9_\-]{20,}/gi,
    /AKIA[0-9A-Z]{16}/g,
    /(?:secret|private[_-]?key)\s*[:=]\s*["']?[A-Za-z0-9+/=]{32,}/gi,
  ],
}
```

**How to configure.**

```typescript
import { filterOutput } from "@workspace/ai-safety"

const result = filterOutput(modelResponse, {
  maxLength: 20_000,
  blocklist: [
    /sk-[A-Za-z0-9]{32,}/g, // OpenAI-style API keys
    /ghp_[A-Za-z0-9]{36}/g, // GitHub personal access tokens
  ],
})
// result: { filtered: string, redactedCount: number }
```

If you pass a custom `blocklist`, it **replaces** the defaults; merge them
explicitly if you want both.

**Limitations.** Regex-based detection only catches patterns you anticipated.
Novel secret formats, encoded secrets, and secrets split across multiple
tokens will pass through. The filter is also blind to semantic leaks (for
example, the model summarizing private data without quoting it verbatim).

**Source.** `packages/ai-safety/src/guardrails/output-filter.ts`

### Content safety

**What it does.** Runs the input through keyword and phrase patterns for five
high-level harm categories (violence, hate speech, sexual content, self-harm,
illegal activity) and reports which categories were flagged along with a
fixed confidence score. If an `externalModerator` callback is provided, that
callback runs instead of the built-in patterns and is treated as the source
of truth.

**What it protects against.** The most obvious policy-violating inputs, and
the wiring you need to delegate moderation to a real service.

**Default config.**

```typescript
{
  categories: [
    "violence",
    "hate_speech",
    "sexual_content",
    "self_harm",
    "illegal_activity",
  ],
  // externalModerator is unset by default.
}
```

**How to configure.**

```typescript
import { checkContentSafety } from "@workspace/ai-safety"

// Built-in keyword patterns:
const result = await checkContentSafety(userPrompt, {
  categories: ["violence", "self_harm"],
})

// Delegate to an external moderation API:
const withExternal = await checkContentSafety(userPrompt, {
  categories: ["violence", "hate_speech"],
  externalModerator: async (content) => {
    const response = await fetch("https://moderation.example/v1/check", {
      method: "POST",
      body: JSON.stringify({ content }),
    })
    const json = await response.json()
    return {
      safe: json.safe,
      flaggedCategories: json.categories,
      confidence: json.confidence,
    }
  },
})
```

**Limitations.** The built-in patterns are deliberately conservative
keyword matches; they will both miss obvious harms (paraphrased or
obfuscated) and produce false positives on benign uses of the matched words.
The confidence score is a constant placeholder (0.6 when flagged, 1.0
otherwise) — it is **not** a calibrated probability. Production deployments
should configure `externalModerator` to a real service and treat the keyword
implementation as a fallback or a smoke test.

**Source.** `packages/ai-safety/src/moderation/content-safety.ts`

### PII redactor

**What it does.** Scans text for common PII patterns (email addresses, US
phone numbers, US Social Security Numbers, credit-card-shaped digit groups,
IPv4 addresses) and replaces each match with a redaction string. Reports the
total number of matches and which categories were detected.

**What it protects against.** Accidental disclosure of PII in model responses,
in logs, or in any text that the middleware emits downstream. The redactor
runs last in the composed pipeline so that even output the model invents (or
echoes from upstream tool calls) is scrubbed before it reaches the client.

**Default config.**

```typescript
{
  types: ["email", "phone", "ssn", "credit_card"],
  replacement: "[REDACTED]",
}
```

Note that `ip_address` is a supported type but is **not** in the defaults —
opt in when relevant.

**How to configure.**

```typescript
import { redactPii } from "@workspace/ai-safety"

const result = redactPii(modelResponse, {
  types: ["email", "phone", "ssn", "credit_card", "ip_address"],
  replacement: "***",
})
// result: { redacted: string, detectedCount: number, detectedTypes: PiiType[] }
```

**Limitations.** The patterns are tuned for common US formats. International
phone numbers, non-US national IDs, IBANs, passport numbers, dates of birth,
and free-form addresses are not covered. The patterns are also greedy in
practice — anything that looks like a 16-digit number will be redacted as a
credit card. Sensitive operators should pair this with explicit
schema-aware redaction at the data layer.

**Source.** `packages/ai-safety/src/moderation/pii-redactor.ts`

## Using the composed middleware

`createAiSafetyMiddleware` returns a single async function that runs the full
pipeline. Every section of the config is optional; omit a section to skip
that guardrail entirely. A realistic API route configuration:

```typescript
import { createAiSafetyMiddleware } from "@workspace/ai-safety"

const safeAi = createAiSafetyMiddleware({
  rateLimit: {
    maxRequests: 10,
    windowMs: 60_000,
  },
  sanitize: {
    maxLength: 4_000,
    sensitivity: "medium",
  },
  contentSafety: {
    categories: ["violence", "hate_speech", "self_harm", "illegal_activity"],
    externalModerator: async (content) => callExternalModeration(content),
  },
  tokenBudget: {
    maxTokensPerRequest: 2_048,
    maxTokensPerUserPerHour: 50_000,
  },
  outputFilter: {
    maxLength: 20_000,
    blocklist: [/sk-[A-Za-z0-9]{32,}/g],
  },
  piiRedactor: {
    types: ["email", "phone", "ssn", "credit_card"],
    replacement: "[REDACTED]",
  },
})

export async function POST(req: Request) {
  const { userId, prompt } = await req.json()

  const result = await safeAi({ userId, input: prompt }, async (input) => {
    const completion = await callYourModel(input)
    return { output: completion.text, tokensUsed: completion.totalTokens }
  })

  if (!result.success) {
    return Response.json(
      { error: result.error, metadata: result.metadata },
      { status: 400 }
    )
  }

  return Response.json({ output: result.output, metadata: result.metadata })
}
```

The result object has a stable shape:

```typescript
{
  success: boolean
  output?: string
  error?: string
  metadata?: {
    rateLimitRemaining?: number
    sanitizeFlags?: string[]
    redactedCount?: number
    tokensUsed?: number
  }
}
```

Log `metadata` for observability — it tells you how many of the guardrails
fired on each request without leaking the raw prompt.

## Extending

Add a new guardrail by following the same pattern as the existing ones.

1. **Implement the guardrail.** Create a new file under
   `packages/ai-safety/src/guardrails/` (or `moderation/` for moderation-style
   checks). Define a config interface and a result interface in
   `packages/ai-safety/src/types.ts`. Export a single function or class that
   takes the input plus an optional `Partial<Config>` and returns the result.
2. **Wire it into the middleware.** Edit
   `packages/ai-safety/src/middleware/ai-safety-middleware.ts`. Add the new
   guardrail to the `AiSafetyMiddlewareConfig` interface, decide where in the
   pipeline it belongs (cheap checks before the model call, output checks
   after), and add a step that short-circuits with a sensible error if the
   guardrail fails.
3. **Add tests.** Place tests under `packages/ai-safety/src/__tests__/`. Cover
   the happy path, each rejection path, and the default-config behavior.
   Run `pnpm --filter @workspace/ai-safety test` while iterating.
4. **Export it.** Add the guardrail and its types to
   `packages/ai-safety/src/index.ts` so applications can use it directly.
5. **Document it here.** Add a new subsection under "Each guardrail" in this
   file using the same template (what it does, what it protects against,
   default config, how to configure, limitations, source).

Keep new guardrails small and composable. Each one should do one thing and be
usable on its own, even if the middleware is the recommended way to consume
them.

## Known gaps and roadmap

- Content safety is keyword-based; production deployments should wire up an
  external moderator (e.g., OpenAI moderation, Azure Content Safety) via the
  `externalModerator` config hook.
