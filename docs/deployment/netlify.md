# Deploying to Netlify

This guide walks through deploying this template to [Netlify](https://www.netlify.com/) using the official [`@netlify/plugin-nextjs`](https://github.com/opennextjs/opennextjs-netlify) runtime.

Netlify's Next.js runtime supports the full feature set of Next.js 16: the App Router, React Server Components, Route Handlers, Middleware, ISR, and Image Optimization. No code changes are required to deploy.

## Prerequisites

- A **GitHub repository** containing your fork or clone of this template.
- A **Netlify account** ([sign up](https://app.netlify.com/signup) — the free tier is sufficient for evaluation).
- A **Turso account** for managed libSQL ([sign up](https://turso.tech/)). The template uses libSQL via Drizzle ORM, and Turso provides hosted libSQL with an HTTP API that works from serverless functions.
- **Node.js 22+** and **pnpm 9+** installed locally if you intend to use the CLI.

## Step 1 — Provision your database (Turso)

Netlify serverless functions cannot read from a local SQLite file, so the runtime database must be hosted. Turso is the recommended managed libSQL host.

```bash
# Install the Turso CLI (macOS / Linux)
curl -sSfL https://get.tur.so/install.sh | bash

# Authenticate
turso auth signup   # or `turso auth login`

# Create a database
turso db create sas-app-prod

# Print the connection URL (starts with libsql://)
turso db show sas-app-prod --url

# Mint an auth token
turso db tokens create sas-app-prod
```

Hold on to the URL and token — you will set them as Netlify environment variables in [Step 4](#step-4--configure-environment-variables).

Apply the schema once from your local machine before the first deploy:

```bash
DATABASE_URL="libsql://<your-db-url>" \
DATABASE_AUTH_TOKEN="<your-token>" \
pnpm --filter web db:push
```

## Step 2 — Install the Netlify CLI

```bash
pnpm add -g netlify-cli
netlify --version
netlify login
```

The CLI is optional — you can do everything from the Netlify web UI — but it is useful for local previews via `netlify dev` and for triggering builds without pushing.

## Step 3 — Create and link the Netlify site

From the repository root:

```bash
# Interactive: walks you through creating a new site
netlify init

# Or, if you already created the site in the Netlify UI:
netlify link
```

`netlify init` will detect `netlify.toml` at the repo root and configure the site accordingly. The committed `netlify.toml` already sets:

- `base = "."` — Netlify clones at the repo root so the pnpm workspace resolves.
- `command = "pnpm install --frozen-lockfile && pnpm --filter web build"` — installs from the workspace lockfile and builds only the `web` app.
- `publish = "apps/web/.next"` — points at the Next.js build output.
- `@netlify/plugin-nextjs` — the official runtime that wires SSR, ISR, middleware, and image optimization into Netlify Functions.

If `netlify init` prompts for build settings, accept the defaults from `netlify.toml`.

## Step 4 — Configure environment variables

The app reads its configuration from environment variables. Set them on Netlify before triggering the first build — the app will fail at request time if `AUTH_SECRET` or the database vars are missing.

| Variable                  | Required              | Description                                                                                                                                  |
| ------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_SECRET`             | Yes                   | Random 32-byte secret used by NextAuth to sign JWTs. Generate with `openssl rand -base64 32`.                                                |
| `AUTH_URL`                | Yes                   | Public origin of your deployed site, e.g. `https://your-site.netlify.app` (or your custom domain). Required for OAuth callback construction. |
| `AUTH_TRUST_HOST`         | Yes                   | Set to `true`. Tells NextAuth to trust the `Host` header behind Netlify's proxy.                                                             |
| `DATABASE_URL`            | Yes                   | Turso libSQL URL, e.g. `libsql://sas-app-prod-yourorg.turso.io`.                                                                             |
| `DATABASE_AUTH_TOKEN`     | Yes                   | Turso auth token from `turso db tokens create`.                                                                                              |
| `GOOGLE_CLIENT_ID`        | If using Google OAuth | OAuth client ID from Google Cloud Console.                                                                                                   |
| `GOOGLE_CLIENT_SECRET`    | If using Google OAuth | OAuth client secret.                                                                                                                         |
| `RESEND_API_KEY`          | If using email login  | API key from [Resend](https://resend.com/).                                                                                                  |
| `EMAIL_FROM`              | If using email login  | Verified sender, e.g. `noreply@yourdomain.com`. Defaults to `onboarding@resend.dev`.                                                         |
| `NEXT_TELEMETRY_DISABLED` | No                    | Already set to `1` in `netlify.toml`.                                                                                                        |

Set them with the CLI:

```bash
netlify env:set AUTH_SECRET "$(openssl rand -base64 32)"
netlify env:set AUTH_URL "https://your-site.netlify.app"
netlify env:set AUTH_TRUST_HOST "true"
netlify env:set DATABASE_URL "libsql://..."
netlify env:set DATABASE_AUTH_TOKEN "..."
```

Or via the UI: **Site configuration → Environment variables → Add a variable**.

> **Set these before the first deploy.** This template ships a setup wizard intended for Docker / local-host scenarios where the wizard writes to a local `.env.local` and restarts the Node process. Neither operation is meaningful on Netlify — env vars must already be present on the platform before the first request hits the deployed app.

## Step 5 — Configure OAuth callbacks

If you enable Google sign-in, add the deployed callback URL to your OAuth client's **Authorized redirect URIs** in Google Cloud Console:

```text
https://your-site.netlify.app/api/auth/callback/google
```

Use your custom domain instead of `*.netlify.app` if you have configured one. Repeat for every domain you serve from (preview deploys included if you intend to test OAuth on those — though many teams limit OAuth to production).

## Step 6 — Deploy

```bash
# Preview deploy from your current branch
netlify deploy --build

# Promote to production
netlify deploy --build --prod
```

You can also push to the connected Git branch — Netlify will build and deploy automatically. Open the deploy URL printed by the CLI (or in the Netlify dashboard) and verify the landing page renders.

## Step 7 — Verify

1. **Landing page** — `https://your-site.netlify.app/` should render the public landing.
2. **Login flow** — `/login` should render and (if Resend or Google is configured) accept credentials.
3. **Protected route** — `/dashboard` should redirect to `/login` when unauthenticated and load when signed in.
4. **Database** — sign in once, then run `turso db shell sas-app-prod` and confirm a row was written to the `user` table.

## Custom domain

Add your domain via **Domain management → Add a domain** in the Netlify UI, follow the DNS instructions, then update:

- `AUTH_URL` to the new origin (e.g. `https://app.yourdomain.com`).
- The Google OAuth **Authorized redirect URIs** to include the new callback.

Redeploy after changing `AUTH_URL` so the new value is picked up.

## Template-specific caveats

A few features in this template are tuned for Docker / local hosting and do not apply on Netlify:

- **Setup wizard.** The `/setup` route writes to a local `.env.local` and triggers a process restart via `process.exit(0)`. Neither works on Netlify Functions (the filesystem is read-only and the function is not a long-lived process). Set env vars directly on Netlify via the CLI or UI instead.
- **Persisted bootstrap secret in `/app/data/`.** The Docker image persists a wizard bootstrap token to a writable volume. On Netlify there is no persistent function filesystem, so the bootstrap-token flow is not relevant.
- **Setup wizard auto-disable.** Because `AUTH_SECRET`, OAuth credentials, or Resend keys will be set in Netlify before the first request, the wizard will detect that auth is already configured and refuse to run — which is the correct behavior on Netlify.

In short: configure everything via Netlify env vars before deploying, and ignore the wizard.

## Troubleshooting

**Build fails with `ERR_PNPM_NO_LOCKFILE`** — make sure `pnpm-lock.yaml` is committed at the repo root. The build runs from the repo root and needs the workspace lockfile.

**`AUTH_SECRET` missing at runtime** — set it via `netlify env:set` and trigger a new deploy. NextAuth requires it in production.

**OAuth redirect mismatch** — the URL in `AUTH_URL` must exactly match the origin Google redirects to. Watch for `http` vs `https` and trailing slashes.

**Database connection errors on first request** — confirm `DATABASE_URL` starts with `libsql://` (not `file:`) and that `DATABASE_AUTH_TOKEN` is set. Local-file databases do not work on Netlify Functions.

**Middleware not running** — `@netlify/plugin-nextjs` supports both Edge and Node middleware automatically. If middleware appears bypassed, check the Functions logs in the Netlify dashboard for the middleware function's invocation log.
