# Security overview

This document describes the security posture of the template: who we're
defending against, the controls that ship in the box, and the gaps that
adopters need to fill in themselves.

For vulnerability disclosure, see [SECURITY.md](../SECURITY.md) at the
repo root.

## Threat model

We defend against casual abusers, compromised browser sessions,
mass-scrape bots, and malicious user-supplied prompts that try to coax
the app or an upstream LLM into doing something it shouldn't. We do
**not** try to defend against a nation-state attacker, a determined
insider with valid credentials, or an authorised user who chooses to
misuse data they have legitimate access to. Adopters who need that level
of assurance must layer their own controls on top.

## Controls in the box

Everything below is active code, not aspiration. File paths point at
where the control lives.

### Authentication and route protection

- **NextAuth v5 (beta)** with JWT sessions configured in
  [`apps/web/lib/auth.ts`](../apps/web/lib/auth.ts). No database is
  required for session storage.
- **`requireAuth()` server helper** in
  [`apps/web/lib/auth-guard.ts`](../apps/web/lib/auth-guard.ts) — call
  at the top of every protected Server Component.
- **Edge middleware** at
  [`apps/web/middleware.ts`](../apps/web/middleware.ts) gates every
  route except NextAuth endpoints, Next.js static assets, and the public
  metadata files (`/favicon.ico`, `/sitemap.xml`, `/robots.txt`).

### Setup wizard hardening

- **One-time setup token** in
  [`apps/web/lib/setup-token.ts`](../apps/web/lib/setup-token.ts) — the
  setup wizard requires this token until the first provider is
  configured, then locks itself permanently.
- The wizard never echoes secrets back to the browser after they're
  saved; values land in `/app/data/.env` and are only re-read
  server-side.

### Security response headers

Set in [`apps/web/middleware.ts`](../apps/web/middleware.ts):

- `Content-Security-Policy` (strict; allows only first-party scripts and
  the configured AI providers)
- `Strict-Transport-Security` (`max-age=31536000; includeSubDomains`)
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` (camera, microphone, geolocation, payment off by
  default)

### AI safety middleware

The [`packages/ai-safety/`](../packages/ai-safety/) package wraps every
AI handler with:

- **Rate limiter** (`guardrails/rate-limiter.ts`) — per-user request
  ceiling with sliding window.
- **Input sanitizer** (`guardrails/input-sanitizer.ts`) — strips control
  characters, normalises whitespace, blocks obvious prompt-injection
  markers.
- **Content safety** (`moderation/content-safety.ts`) — keyword + regex
  filter. Pluggable `externalModerator` for real moderation APIs.
- **Token budget** (`guardrails/token-budget.ts`) — per-request and
  per-user token caps.
- **Output filter** (`guardrails/output-filter.ts`) — strips
  model-leaked system prompts and obvious PII before responding.
- **PII redactor** (`moderation/pii-redactor.ts`) — runs on both inputs
  and outputs.

Compose them with `createAiSafetyMiddleware()` from
[`packages/ai-safety/src/middleware/ai-safety-middleware.ts`](../packages/ai-safety/src/middleware/ai-safety-middleware.ts).

### Persistent guardrail state

Rate-limit counters, token budgets, and audit trails persist to a
libSQL-backed store in
[`packages/ai-safety/src/storage/libsql-stores.ts`](../packages/ai-safety/src/storage/libsql-stores.ts).
This means a process restart doesn't reset the rate limit and let an
abuser through.

### Audit log

Security-sensitive events (login success/failure, setup wizard changes,
rate-limit trips, content-safety blocks, admin actions) are written via
[`apps/web/lib/audit-log.ts`](../apps/web/lib/audit-log.ts). Output is
structured JSON on stdout so any platform's log collector can ingest it.

### Health endpoint

`GET /api/health` returns liveness plus a database reachability check.
Wire it into your platform's uptime monitor.

### Build-time hardening

- **Secret scan** — `secretlint` runs in the Husky pre-commit hook so a
  forgotten API key can't make it into a commit.
- **Weekly `pnpm audit`** in `.github/workflows/` blocks merges if a
  new high-severity vulnerability appears in the dependency tree.
- **Dependabot** opens PRs for both npm deps and GitHub Actions.
- **Lockfile freshness check** in CI fails if `package.json` changed
  without a matching lockfile update.
- **`sort-package-json`** check keeps manifests reviewable.
- **markdownlint-cli2** keeps docs consistent and link-checkable.

### Accessibility at the boundary

APCA AAA 3.0 contrast is enforced at the framework level via the
[`packages/accessibility/`](../packages/accessibility/) package. Body
text Lc >= 90, large text Lc >= 75, non-text Lc >= 60. This isn't
security in the breach-prevention sense, but it does reduce the risk of
users being unable to read a critical warning.

## Secret handling

- `AUTH_SECRET` is **auto-generated** on first container boot if not
  supplied — no shipped default.
- Provider secrets (OpenAI key, Anthropic key, SMTP credentials, etc.)
  live in `/app/data/.env` inside the Docker volume, written with mode
  `600`.
- No secrets are baked into image layers. The `Dockerfile` reads them
  only at runtime via the entrypoint.
- The setup wizard **locks** once any provider is configured. Further
  changes require shell access to the volume.

## Data residency

All application data lives in a single SQLite file inside the Docker
volume. Nothing leaves the machine unless an adopter explicitly wires in
an external AI provider, SMTP server, or telemetry sink. There is no
phone-home, no anonymous analytics, no remote update channel.

## Network surface

The container exposes **one HTTP port** (default `11000`). There are no
outbound calls unless your AI feature initiates them. If you don't
configure an AI provider, the container is fully offline-capable.

## What's NOT in the box

We try to be honest about gaps:

- **No WAF / DDoS protection.** Front the app with a reverse proxy
  (nginx, Caddy, Cloudflare) or a hosted platform if you need this.
- **No anomaly detection.** The audit log is JSON on stdout; pipe it to
  your SIEM (Datadog, Splunk, Loki, etc.) and build alerts there.
- **No multi-tenant isolation.** Run one container per organisation;
  there's no row-level tenancy in the schema.
- **Content safety is keyword-based.** It catches the obvious cases.
  Serious deployments should wire `externalModerator` to a real
  moderation API (OpenAI moderation, Perspective, Azure Content Safety).
- **No backup automation.** Snapshot the Docker volume on a schedule
  your ops team is comfortable with.
- **No formal pen-test.** The template hasn't been independently
  audited. Adopters in regulated environments should commission one.

## Per-platform notes

### Docker (recommended)

The setup wizard works end-to-end because `process.exit(0)` triggers a
container restart and Docker's restart policy brings it back with the
new config. Everything (app, SQLite, secrets) lives in one container
plus one volume.

### Vercel / Netlify / Cloudflare Pages

Environment variables must be set in the platform UI **before** the
first request, because the setup wizard's `process.exit(0)` pattern
doesn't restart a serverless function — it just kills the current
invocation. The wizard UI is still useful for validation, but the
actual env vars need to come from the platform.

### Google Apps Script (`apps/sheets/`)

Authentication is Google-only (the script runs as the user's Google
identity). The AI safety package is not available here — it's Node-only
and Apps Script runs on V8 with a different surface. Adopters wiring AI
features into Apps Script must implement their own rate limiting and
content filtering, or call back into the Next.js app's safe endpoints.

## Reporting

For vulnerability disclosure, see [SECURITY.md](../SECURITY.md) at the
repo root. Email [security@nyuchi.com](mailto:security@nyuchi.com) and
please don't open a public issue.
