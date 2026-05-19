# Deploying to Cloudflare Workers

This guide walks through deploying the Next.js app to Cloudflare Workers using
the [OpenNext Cloudflare adapter](https://opennext.js.org/cloudflare). The
adapter packages the Next.js standalone build into a Worker that serves both
static assets and rendered routes.

The app uses Turso (libSQL) for the database, identical to the Vercel and
Netlify setups. Turso is reachable over HTTPS from Workers, so no special
binding is required.

## Prerequisites

- A Cloudflare account.
- The Wrangler CLI installed and authenticated:

  ```bash
  npm install -g wrangler
  wrangler login
  ```

- A Turso account with a database provisioned. Note the libSQL URL (looks like
  `libsql://your-db-name-org.turso.io`) and an auth token.
- Node.js 22+ locally (`.nvmrc` pins the version used in this repo).

## Install the adapter

The OpenNext Cloudflare adapter is not bundled by default. Install it as a dev
dependency in `apps/web`:

```bash
pnpm --filter sas-default-app-web add -D @opennextjs/cloudflare
```

That adds both the `opennextjs-cloudflare` CLI and the types used by
`open-next.config.ts`.

## Configuration files

Two files in `apps/web` drive the Cloudflare build:

- `apps/web/open-next.config.ts` — calls `defineCloudflareConfig()`. Extend this
  later if you want R2-backed incremental caching, Durable Object queues, or D1
  tag caching.
- `apps/web/wrangler.toml` — Worker name, entry point, asset binding, and
  observability. The defaults work for an HTTP-only deployment with Turso as
  the only data store.

If you change the Worker name in `wrangler.toml`, also update the deployment
URL references in your own infra.

## Build

From the repo root:

```bash
pnpm --filter sas-default-app-web exec opennextjs-cloudflare build
```

This produces `apps/web/.open-next/` containing the Worker bundle
(`worker.js`) and the static assets directory.

## Deploy

```bash
cd apps/web
wrangler deploy
```

Wrangler reads `wrangler.toml` in the current directory, uploads the bundle,
and prints the deployed URL. Subsequent deploys overwrite the same Worker.

## Environment variables

Workers do not have a `.env` file at runtime. Configure each variable as a
Wrangler secret:

```bash
cd apps/web
wrangler secret put AUTH_SECRET
wrangler secret put AUTH_URL
wrangler secret put DATABASE_URL
wrangler secret put DATABASE_AUTH_TOKEN
wrangler secret put RESEND_API_KEY
# Plus any OAuth provider keys you use, e.g.:
wrangler secret put AUTH_GOOGLE_ID
wrangler secret put AUTH_GOOGLE_SECRET
```

Required keys:

| Variable              | Purpose                                   |
| --------------------- | ----------------------------------------- |
| `AUTH_SECRET`         | NextAuth JWT signing key                  |
| `AUTH_URL`            | Public URL of the Worker (`https://...`)  |
| `DATABASE_URL`        | Turso libSQL URL (`libsql://...`)         |
| `DATABASE_AUTH_TOKEN` | Turso auth token                          |
| `RESEND_API_KEY`      | Resend transactional email key            |
| `AUTH_<PROVIDER>_*`   | Any OAuth provider credentials you enable |

Secrets are encrypted at rest and exposed to the Worker as `process.env.*`
(via the `nodejs_compat` flag).

### Same setup-wizard caveat as Vercel and Netlify

The first-run setup wizard (`apps/web/scripts/setup.ts` and friends) assumes a
writable local environment and calls `process.exit(0)` after writing files.
Workers reject that immediately — the runtime is request-scoped and cannot
exec processes or write to a filesystem. Configure all secrets ahead of time
with `wrangler secret put` and skip the wizard on Workers.

## Verify the deploy

After `wrangler deploy` succeeds:

1. Open the printed URL.
2. Hit `/login` and complete a credential or OAuth round-trip.
3. Stream live logs to confirm the request reached the Worker:

   ```bash
   cd apps/web
   wrangler tail
   ```

   The audit log writes to stdout, so audit events appear in `wrangler tail`
   output and in the Cloudflare dashboard under the Worker's "Logs" tab. They
   are also available via Workers Logs / Logpush if you ship them downstream.

## Worker runtime caveats

These differ from the Vercel and Netlify Functions runtimes. Read them before
shipping production traffic to Cloudflare.

- **Node.js compat is partial.** `nodejs_compat` covers the most common Node
  built-ins (`buffer`, `crypto`, `events`, `path`, `stream`, `util`), but some
  APIs are stubbed or missing. If a library you depend on tries to spawn a
  subprocess, open a TCP socket directly, or touch the filesystem, it will
  fail at runtime. Check the Cloudflare
  [Node.js compatibility docs](https://developers.cloudflare.com/workers/runtime-apis/nodejs/)
  before adding new dependencies.
- **No filesystem.** Anything that calls `fs.writeFile`, mutates a temp
  directory, or expects a build cache on disk will not work. The setup
  wizard's `process.exit(0)` definitely does not work — env vars must be
  pre-configured.
- **In-memory state does not persist between requests.** Workers may spin up a
  new isolate for any request, so any module-level `Map`, counter, or cache
  you write in middleware will be reset unpredictably. This is fine for this
  app because:
  - The rate-limit store (Phase 2) is backed by libSQL in Turso.
  - The token-budget store (Phase 2) is also libSQL-backed.
  - Sessions are JWT-based — no server-side session state.

  If you add new middleware-level state, back it with Turso, a Cloudflare KV
  namespace, or a Durable Object.

- **Request CPU time limits.** Free-tier Workers cap CPU per request at 10 ms;
  Workers Paid bumps this to 30 s. Long-running server actions that previously
  ran on Vercel Functions may need to be redesigned for Workers.
- **Streaming responses work.** Edge runtime streaming, Server Actions, and
  Suspense streaming all work as expected under OpenNext.
- **ISR/SSG without R2.** The default `open-next.config.ts` does not configure
  the R2 incremental cache. Static pages still render correctly on first hit,
  but revalidated/regenerated pages will not survive between Worker isolates.
  If you rely on ISR, add the R2 incremental cache override — see the
  [OpenNext caching guide](https://opennext.js.org/cloudflare/caching).

## Custom domains

After your first successful deploy, add a custom domain in the Cloudflare
dashboard under Workers and Pages -> your Worker -> Settings -> Triggers ->
Custom Domains. Update `AUTH_URL` to match before the next deploy so NextAuth
redirects resolve correctly.

## Troubleshooting

- **`Error: Could not resolve "node:async_hooks"`** — make sure
  `nodejs_compat` is in `compatibility_flags` in `wrangler.toml`.
- **OAuth callback redirects to `localhost`** — `AUTH_URL` is wrong or unset;
  it must match the deployed Worker URL exactly, including protocol.
- **Auth works but DB calls fail** — check `wrangler tail` for the libSQL
  error. Most often `DATABASE_URL` is missing `libsql://` or
  `DATABASE_AUTH_TOKEN` is unset.
- **`process.exit is not a function`** — the setup wizard ran on the Worker.
  Make sure the wizard is gated to local-dev only and that all required env
  vars are configured as Wrangler secrets.
