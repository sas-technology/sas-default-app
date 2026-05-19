# Deploying to Vercel

This guide walks you through deploying the app to [Vercel](https://vercel.com) with [Turso](https://turso.tech) as a managed libSQL database.

## Why Turso?

The app uses `libSQL` (a SQLite fork) via Drizzle ORM. Vercel runs serverless functions without persistent local disk per instance, so the default `file:./dev.db` will not work in production. Turso is a libSQL-compatible hosted database that requires zero code changes — just swap the connection URL.

## Prerequisites

- A [GitHub](https://github.com) account with this repo pushed.
- A [Vercel](https://vercel.com/signup) account (the free Hobby plan is fine).
- A [Turso](https://turso.tech) account (the free tier covers small projects).
- Local tooling: Node 22+, pnpm 9+, and the [Vercel CLI](https://vercel.com/docs/cli).

Install the Vercel CLI globally:

```bash
pnpm install -g vercel
```

Install the Turso CLI ([installation docs](https://docs.turso.tech/cli/installation)):

```bash
brew install tursodatabase/tap/turso
# or: curl -sSfL https://get.tur.so/install.sh | bash
turso auth signup
```

## Step 1 — Create the Turso database

```bash
turso db create sas-app
turso db show sas-app --url
turso db tokens create sas-app
```

Note the two values from the output — you will need them in Step 3:

- `DATABASE_URL` — looks like `libsql://sas-app-yourname.turso.io`
- `DATABASE_AUTH_TOKEN` — a long opaque token string

## Step 2 — Push the schema to Turso

Run the Drizzle migration against your fresh Turso database. From the repo root:

```bash
cd apps/web
DATABASE_URL="libsql://sas-app-yourname.turso.io" \
DATABASE_AUTH_TOKEN="your-turso-token" \
pnpm db:push
```

This creates all the tables (users, accounts, sessions, audit log, etc.). You only need to do this once per environment.

## Step 3 — Link the project to Vercel

From the repo root:

```bash
cd apps/web
vercel link
```

When prompted:

- Set up and deploy: **yes**
- Scope: pick your Vercel team or personal account
- Link to existing project: **no** (first time)
- Project name: `sas-app` (or whatever you prefer)
- **Root Directory:** when asked, accept the detected `apps/web` directory.

The `vercel.json` at the repo root configures the build for Turborepo. Vercel will run `pnpm install --frozen-lockfile` from the workspace root, then `pnpm turbo build --filter=sas-default-app-web`.

## Step 4 — Configure environment variables

Add these in the Vercel dashboard under **Project → Settings → Environment Variables**, or via the CLI (`vercel env add <NAME>`). Set them for **Production**, **Preview**, and **Development** as appropriate.

| Variable               | Required | How to obtain                                                                                                   |
| ---------------------- | -------- | --------------------------------------------------------------------------------------------------------------- |
| `AUTH_SECRET`          | yes      | Generate with `openssl rand -base64 32`                                                                         |
| `AUTH_URL`             | yes      | The full URL of your deployment, e.g. `https://sas-app.vercel.app` (or your custom domain)                      |
| `DATABASE_URL`         | yes      | Turso connection URL from Step 1 (`libsql://...turso.io`)                                                       |
| `DATABASE_AUTH_TOKEN`  | yes      | Turso auth token from Step 1                                                                                    |
| `GOOGLE_CLIENT_ID`     | yes\*    | From [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → OAuth 2.0 Client IDs           |
| `GOOGLE_CLIENT_SECRET` | yes\*    | Same place as above                                                                                             |
| `RESEND_API_KEY`       | yes\*    | From [Resend dashboard](https://resend.com/api-keys)                                                            |
| `EMAIL_FROM`           | yes\*    | A verified sender on your Resend domain, e.g. `noreply@yourdomain.com` (or `onboarding@resend.dev` for testing) |

\* At least one auth provider (Google **or** Resend email) must be configured. You can enable both.

### Configure the Google OAuth callback URL

In the Google Cloud Console, edit your OAuth client and add this authorized redirect URI:

```text
https://yourapp.vercel.app/api/auth/callback/google
```

Use your real Vercel URL (or custom domain). You may add multiple URIs to support Preview deployments — Vercel assigns each preview a unique URL pattern like `https://sas-app-git-<branch>-<team>.vercel.app`.

## Step 5 — Deploy

From `apps/web/`:

```bash
vercel deploy            # preview deployment
vercel deploy --prod     # production deployment
```

Or push to your `main` branch on GitHub — Vercel auto-deploys on every push once the GitHub integration is connected.

## Step 6 — Verify

After the build completes:

1. Visit `https://yourapp.vercel.app` — the landing page should render.
2. Sign in via Google or request an email link.
3. Confirm you land on `/dashboard` and that the session persists across reloads.
4. Optionally, hit `/api/health` (if present) and the auth callback flow end-to-end.

## Setup wizard on Vercel

The in-app setup wizard at `/api/setup` is designed for the Docker deployment, where it writes an env file and triggers a container restart via `process.exit(0)`. **On Vercel, that restart trick does not work** — serverless functions cannot restart their host.

Recommended flow on Vercel:

1. Configure all environment variables in the Vercel dashboard **before** the first request (Step 4).
2. The setup wizard's `isSetupAllowed()` returns `false` once any auth provider env var is set, so the wizard UI will not appear.
3. To rotate credentials later, update them directly in the Vercel dashboard and trigger a redeploy.

## Features that "just work" on Vercel

These ship with the template and require no extra configuration on Vercel:

- **APCA AAA 3.0 accessibility** — server-rendered, no runtime dependency on the host.
- **AI safety guardrails** — `@workspace/ai-safety` runs in serverless functions; the rate limiter uses in-memory state, which is per-instance on Vercel (consider swapping to Upstash Redis for multi-instance correctness on higher-traffic deployments).
- **Audit log** — writes to Turso via Drizzle, fully durable across deployments.
- **Error boundaries**, **theme switching**, **route protection middleware** — all work unchanged.

## Troubleshooting

- **`Module not found` for workspace packages during build.** Confirm `vercel.json` is at the repo root and that the Root Directory in the Vercel dashboard is `apps/web`. The build command `cd ../.. && pnpm turbo build --filter=sas-default-app-web` must run from the workspace root.
- **`AUTH_URL` mismatch / OAuth redirect_uri_mismatch.** Make sure `AUTH_URL` matches the deployment URL exactly (including `https://`), and that the Google OAuth client has the corresponding `/api/auth/callback/google` URI authorized.
- **Database connection errors.** Verify `DATABASE_URL` starts with `libsql://` (not `file:`) and that `DATABASE_AUTH_TOKEN` is set. Run `turso db shell sas-app` locally to confirm the DB is reachable.
- **Rate limiter inconsistency.** Vercel may run multiple instances; the in-memory rate limiter resets per cold start. For production-grade limits, plug in a shared store such as Upstash Redis (available on the [Vercel Marketplace](https://vercel.com/marketplace)).
- **`vercel.json` schema warnings.** The `$schema` reference at the top enables IDE validation — safe to ignore if your editor cannot fetch it.

## Custom domains

Add a custom domain under **Project → Settings → Domains** in the Vercel dashboard. Vercel provisions and renews a free TLS certificate automatically. After adding the domain:

1. Update `AUTH_URL` to your custom domain (e.g. `https://app.yourdomain.com`).
2. Add the matching OAuth callback URI in Google Cloud Console.
3. Trigger a redeploy so the new `AUTH_URL` takes effect.
