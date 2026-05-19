# Deployment

Pick the deployment that matches your needs. All options keep the app's AI safety guardrails and APCA AAA 3.0 accessibility features intact, with caveats noted below.

## Decision matrix

| Option                       | Best for                                                                              | Auth + DB included        | AI safety                              | Cost                              | Setup time                         |
| ---------------------------- | ------------------------------------------------------------------------------------- | ------------------------- | -------------------------------------- | --------------------------------- | ---------------------------------- |
| **Local Docker**             | Trying it out, small self-hosted deploys, classrooms with one teacher                 | Bundled (SQLite + auth)   | Yes                                    | Free (your own hardware)          | ~5 min                             |
| **Vercel**                   | Teams wanting hosted, no-ops, scalable                                                | Bring Turso (libSQL)      | Yes (libSQL-backed stores)             | Free hobby tier; pay for scale    | ~15 min (incl. Turso)              |
| **Netlify**                  | Same as Vercel; pick by preference                                                    | Bring Turso (libSQL)      | Yes                                    | Free starter; paid for usage      | ~15 min                            |
| **Cloudflare Workers**       | Edge performance, global low-latency                                                  | Bring Turso (libSQL)      | Yes — verify the `node_compat` flag    | Very low                          | ~20 min (OpenNext setup is fiddly) |
| **GitHub Pages (docs only)** | Publishing only the documentation. The full app does **not** run on Pages (static).   | N/A                       | N/A                                    | Free                              | ~5 min                             |
| **Apps Script + Sheets**     | Zero-infrastructure deploys, Google Workspace schools, very small use cases           | Google sign-in + Sheet DB | **Not available** (Node-only)          | Free                              | ~10 min                            |

## Per-option guides

- [Local Docker](../../README.md#run-it-in-3-steps) — quick start in the main README
- [Vercel](./vercel.md)
- [Netlify](./netlify.md)
- [Cloudflare Workers](./cloudflare.md)
- [GitHub Pages (docs)](./github-pages.md)
- [Apps Script + Sheets](../../apps/sheets/README.md)

## Choosing a target at a glance

- **Want it deployed in 10–15 minutes with previews on every PR?** → [Vercel](./vercel.md) or [Netlify](./netlify.md).
- **Need full control, air-gapped, or running on a school's own server?** → [Local Docker](../../README.md#run-it-in-3-steps).
- **Want global edge performance and the lowest hosting cost?** → [Cloudflare Workers](./cloudflare.md).
- **Embedding into Google Workspace with no infra?** → [Apps Script + Sheets](../../apps/sheets/README.md) (note: no AI safety pipeline).
- **Just publishing the docs site?** → [GitHub Pages](./github-pages.md).

## Common environment variables

Every hosted deploy needs the same core set of variables. The canonical list lives in [`apps/web/.env.local.example`](../../apps/web/.env.local.example).

| Variable               | Purpose                                            | How to generate / obtain                                                                       |
| ---------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `AUTH_SECRET`          | Signs NextAuth JWT session cookies                 | `openssl rand -base64 32`                                                                      |
| `AUTH_URL`             | Canonical URL NextAuth uses for callbacks          | Your deployed origin, e.g. `https://app.example.com`                                           |
| `DATABASE_URL`         | libSQL connection URL                              | Turso: `turso db show <name> --url`. Local file: `file:./dev.db`                               |
| `DATABASE_AUTH_TOKEN`  | Turso auth token (omit for local file URLs)        | `turso db tokens create <db-name>`                                                             |
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID                             | Google Cloud Console → APIs & Services → Credentials → OAuth client ID                         |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret                         | Same screen as `GOOGLE_CLIENT_ID`                                                              |
| `RESEND_API_KEY`       | Sends email OTPs                                   | [resend.com](https://resend.com) → API Keys                                                    |
| `EMAIL_FROM`           | From-address for OTP emails                        | A verified Resend sender, e.g. `onboarding@resend.dev` while testing                           |

## What all targets share

- **Auth:** NextAuth v5 with JWT sessions (no database row needed for sessions).
- **Database:** libSQL via Drizzle ORM — the same schema works against a local SQLite file or a managed Turso instance.
- **Accessibility:** APCA AAA 3.0 contrast and a11y components run server-side.
- **AI safety:** `@workspace/ai-safety` middleware composes rate limiting, sanitization, and PII redaction around every AI endpoint (Node runtime only).
- **Audit logging:** Written to the same database; durable across deployments.

## Caveats

- **Setup wizard restart.** The first-run wizard's `process.exit(0)` only restarts the process on Docker (where the container is restarted by Docker's restart policy). On Vercel, Netlify, and Cloudflare you must set the required environment variables yourself **before** the first request — the wizard cannot self-heal those environments.
- **State across serverless instances.** In-memory rate limits and token budgets persist via the libSQL stores. Configure `DATABASE_URL` to a hosted libSQL (Turso) so these counters are shared across serverless invocations rather than per-instance.
- **GitHub Pages is docs only.** Pages serves static HTML; the Next.js app, auth, and API routes do **not** run there. Use it to publish `/docs` only.
- **Apps Script companion is separate.** The code under `apps/sheets/` is a different codebase from the Next.js app. It does not include the `@workspace/ai-safety` guardrails — content moderation, rate limiting, and PII redaction must be implemented separately if you need them there.
