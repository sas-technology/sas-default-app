# Deployment

This directory documents the supported deployment targets for the app. All
targets use the same Turso (libSQL) database, the same NextAuth setup, and the
same environment variables — only the build and host wiring differs.

## Targets

- [Cloudflare Workers](./cloudflare.md) — OpenNext adapter, Wrangler deploys,
  secrets via `wrangler secret put`.

## Choosing a target

| Concern              | Cloudflare Workers                          |
| -------------------- | ------------------------------------------- |
| Cold start           | Very low (V8 isolates)                      |
| Global presence      | Built in across Cloudflare's edge           |
| Filesystem           | None (no `fs` writes at runtime)            |
| Long-running tasks   | CPU limits — short bursts only              |
| Pricing              | Generous free tier; Workers Paid for higher |
| State                | None in-process; back with Turso/KV/DO      |

Pick the target that fits your operational model. The same codebase deploys
to any of them without changes — the wiring lives in the per-target config
files (`wrangler.toml` for Cloudflare, plus the matching adapter configs for
other targets when they are added).
