# README rework + AI safety doc — design

**Date:** 2026-05-19
**Status:** Approved — Path B (fix code, then publish unqualified docs)
**Author:** Bryan Fawcett (with Claude)

## Problem

The current `README.md` is closer to a developer reference than a product page. It has a non-technical 3-step quick start at the top, but after that it drifts into dev-container setup, `npx shadcn` commands, and route-group examples that lose non-technical readers (teachers, school admins, evaluators).

Two specific gaps:

1. **AI guardrails are buried.** The template's most distinctive feature — a real AI-safety package with rate limiting, prompt-injection protection, PII redaction, output filtering, content moderation, and token budgeting — appears as one bullet point under "What's Inside." A non-technical reader has no way to know the substance is there.
2. **The "runs as an app" framing is implicit.** Docker turns this project into a one-command installable app, but the README reads like a dev project that happens to have a `docker compose up`.

## Goals

- README leads with the non-technical "install and run it as an app" experience.
- AI safety is promoted to a major section directly after the quick start, framed as a **promise** (what is protected), not a feature checklist.
- Developer content drops out of the README. It either already lives in `docs/getting-started.md`, `docs/architecture.md`, `docs/coding-conventions.md`, or moves there.
- A new canonical reference doc — `docs/ai-safety.md` — lists every guardrail. README links to it. Future guardrail changes update one place.

## Non-goals

- No changes to the AI safety code itself in this spec. (Improvements may follow from the parallel codebase audit; those become separate work.)
- No changes to Docker setup, `start.sh`, or the setup wizard in this spec.
- No restructuring of `docs/getting-started.md`, `docs/architecture.md`, `docs/coding-conventions.md` beyond what's needed for the README to point at them cleanly.

## Approach

Non-technical-first README, with developer content stripped out and referenced via links. AI safety promoted as the second top-level section, backed by a new canonical reference doc.

Alternatives considered:

- **Same structure, dev content collapsed in `<details>`.** Rejected — invites future bloat into the collapsed section.
- **Two equal H1 halves (Run / Build).** Rejected — H1 split is jarring for non-technical readers who don't know which half is "for them."

## Design

### README.md final outline

```
# MiniApp Template
> One-line pitch: a safe, ready-to-run app you can install on any computer.

## Run it in 3 steps
   1. Install Docker Desktop
   2. Download this project
   3. ./start.sh
   (Content mostly unchanged from current README §1.)

## 🛡️ Built-in AI safety
   Promise paragraph + 5–6 plain-language bullets + link to docs/ai-safety.md.
   No code in this section.

## Set up sign-in
   Google OAuth + Email OTP. Content mostly unchanged from current README §"Setting Up Authentication".

## What else you get
   Auth, accessibility (APCA AAA 3.0), dark mode, database — short bullets.

## Everyday commands
   start.sh / docker compose down / logs / start fresh.

## Need help?
   Troubleshooting + issue link.

## For developers
   One paragraph: stack summary + links to:
   - docs/getting-started.md
   - docs/architecture.md
   - docs/coding-conventions.md
```

Sections removed from README (live in `docs/` or are dropped):

- "Editing the Code (VS Code)" — content moves to `docs/getting-started.md` (or stays there if already covered).
- "Adding a New Page" — moves to `docs/getting-started.md` or `docs/coding-conventions.md`.
- "Adding UI Components" — moves to `docs/coding-conventions.md`.
- "For Template Maintainers" `<details>` block — content distributes into `docs/architecture.md` (Docker architecture, auth provider detection) and the new `docs/ai-safety.md` (anything AI-safety-specific).

### `🛡️ Built-in AI safety` section content (in README)

Approximately 200 words. Structure:

- **Promise (one sentence).** "Every AI feature you build on this template is protected by guardrails that run before the request reaches the model and after the response comes back."
- **What's protected (bullets, plain language).** Two versions depending on which path is chosen for the audit findings — see § "Codebase audit findings" below.

  **Path A wording (ships with current code):**
  - Per-process rate limits — slow down abusive request patterns (resets on container restart; see docs for shared-store options)
  - Prompt-injection protection — sanitizes risky user input
  - PII redaction — strips emails, phone numbers, and similar from prompts
  - Output filtering — blocks unsafe model responses before users see them
  - Content moderation — flags harmful categories
  - Per-process token budgets — cap spend per user or session within a running container (requires your handler to report token usage)

  **Path B wording (ships after C1/C3/I6 are fixed):**
  - Rate limits — stop abuse and runaway costs
  - Prompt-injection protection — sanitizes risky user input
  - PII redaction — strips emails, phone numbers, and similar from prompts
  - Output filtering — blocks unsafe model responses before users see them
  - Content moderation — flags harmful categories
  - Token budgets — caps spend per user or session
- **Why it matters.** Short paragraph: especially if your users are students or members of the public.
- **Link.** "Every guardrail, what it catches, what it doesn't catch, and how to configure it: [docs/ai-safety.md](docs/ai-safety.md)."

No code samples in this README section. All code lives in the linked doc.

### New file: `docs/ai-safety.md`

Canonical reference, single source of truth.

```
# AI Safety Guardrails

## Overview
   Threat model, design philosophy, what this package does and does not try to do.

## How they compose
   Visual flow of createAiSafetyMiddleware():
   input → sanitize → rate-limit → token-budget → MODEL → output-filter → redact → response

## Each guardrail (consistent block per guardrail)
   - What it does (plain language)
   - What it protects against
   - Default configuration
   - How to enable / configure
   - Limitations — honest list of what it does NOT catch
   - Code example

   Guardrails to document:
   1. Rate limiter        (packages/ai-safety/src/guardrails/rate-limiter.ts)
   2. Input sanitizer     (packages/ai-safety/src/guardrails/input-sanitizer.ts)
   3. Output filter       (packages/ai-safety/src/guardrails/output-filter.ts)
   4. Token budget        (packages/ai-safety/src/guardrails/token-budget.ts)
   5. Content safety      (packages/ai-safety/src/moderation/content-safety.ts)
   6. PII redactor        (packages/ai-safety/src/moderation/pii-redactor.ts)

## Using the composed middleware
   Single example showing createAiSafetyMiddleware() in an API route.
   (Existing CLAUDE.md sample is a starting point.)

## Extending
   How to add a new guardrail to the pipeline.

## Known gaps and roadmap
   Honest list of what's not yet implemented, weak defaults, or missing test coverage.
   This is where the parallel codebase audit's AI-safety findings land.
```

The "Known gaps and roadmap" section is deliberate — it keeps the doc honest, gives the audit a natural home, and signals to forks/contributors what to work on.

## Implementation steps (high level)

1. Read each source file under `packages/ai-safety/src/` to extract the actual behavior, defaults, and limitations for the doc.
2. Draft `docs/ai-safety.md` from those readings.
3. Rewrite `README.md` per the outline above.
4. Verify the three `docs/*.md` files the README links to actually contain (or absorb) the developer content the README is shedding. Update `docs/getting-started.md` / `docs/architecture.md` / `docs/coding-conventions.md` as needed.
5. Render the README locally (or read it back) and sanity-check the flow as a non-technical reader.

## Codebase audit findings (parallel work)

A codebase audit ran in parallel. Findings that affect this spec:

### Critical — block "safety promise" accuracy

- **C1. Rate limiter and token budget reset on every container restart.**
  `packages/ai-safety/src/guardrails/rate-limiter.ts:17`, `token-budget.ts:18` — both use in-memory `Map`. Docker's `restart: unless-stopped` policy plus the setup wizard's `process.exit(0)` pattern means counters wipe regularly. The README promise "Rate limits — stop abuse and runaway costs" is misleading without persistence.
- **C2. `/api/setup` POST is unauthenticated and network-accessible.**
  `apps/web/app/api/setup/route.ts:25-91`. During initial boot, anyone reaching port 11000 can supply their own Google credentials and take over auth.
- **C3. `docker-entrypoint.sh` does not run DB migrations.**
  No `drizzle-kit push`/`migrate` step before `exec node apps/web/server.js`. First boot likely throws SQL errors on auth.

### Important — affect what the doc can honestly say

- **I1.** `sanitizeInput` does not strip Unicode homoglyph / zero-width bypasses. No adversarial test coverage.
- **I2.** `content-safety.ts` and `output-filter.ts` have zero tests. Middleware pipeline has zero tests.
- **I3.** `TokenBudget` silently no-ops unless callers return `tokensUsed`. `AiHandler` type makes it optional.
- **I4.** Setup wizard hardcodes `localhost:11000` as the Google redirect URI hint — breaks any non-localhost deploy.
- **I5.** `content-safety.ts` returns hardcoded confidence (`0.6`/`1.0`) — misleading for callers using threshold logic.
- **I6.** `docker-compose.yml` does not set `AUTH_SECRET`. NextAuth needs it before the setup wizard can write the real one. Boot-order crash.

### How these fold into this spec

Two paths, user picks:

- **Path A — Honest doc, fix code later.** Ship the README rework and `docs/ai-safety.md` as designed. The "Known gaps and roadmap" section in the doc lists C1, C3, I1, I2, I3, I5 verbatim. The README's bullet on rate limits is softened (e.g., "Rate limits per process — see docs for persistence options"). C2 and I6 are treated as bugs and fixed/tracked separately. Pro: ships the documentation reorganization quickly. Con: the README's "safety promise" is qualified.
- **Path B — Fix critical first, then ship the doc.** Fix C1 (persistence), C2 (setup auth), C3 (migrations), and I6 (`AUTH_SECRET` bootstrap) before the README rework lands. The doc still calls out I1–I5 as known gaps. Pro: the safety promise is honest at full strength. Con: more work before the README rework lands; pulls in code changes that exceed this spec's original scope.

This spec's recommendation: **Path A** for the documentation work (it's the unit of work this spec is about), with C1/C2/C3/I6 captured as a separate follow-up plan so they don't get lost.

**User decision (2026-05-19):** Path B. Fix all audit findings in priority order with regular commits, then publish the README rework and `docs/ai-safety.md` with unqualified "safety promise" wording. Implementation plan to be written in a separate document via the writing-plans skill.

## Success criteria

- A non-technical reader can read the README top-to-bottom without hitting a code sample or jargon that requires a developer background.
- After the AI safety section, a non-technical reader can answer "what does this app protect me from when I add AI features?" in one sentence.
- A developer who clones the repo finds the developer content they need within one click from the README.
- The full inventory of guardrails lives in exactly one place (`docs/ai-safety.md`) — future additions update one file.
