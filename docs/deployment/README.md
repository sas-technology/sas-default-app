# Deployment

This template can be deployed to a number of hosts. Pick the guide that matches your target.

| Host           | Best for                                                                       | Guide                            |
| -------------- | ------------------------------------------------------------------------------ | -------------------------------- |
| **Vercel**     | First-party Next.js platform, zero-config builds, edge network                 | [vercel.md](./vercel.md)         |
| **Netlify**    | Strong Next.js runtime via `@netlify/plugin-nextjs`, generous free tier        | [netlify.md](./netlify.md)       |
| **Cloudflare** | Workers + Pages, global edge, low cold-start latency                           | [cloudflare.md](./cloudflare.md) |
| **Docker**     | Self-hosted on any container runtime (Fly.io, Railway, Kubernetes, bare metal) | [docker.md](./docker.md)         |

## Database

The template uses libSQL (Drizzle ORM + `@libsql/client`). For local development a SQLite file works. For production on any managed host you should use a hosted libSQL — most teams use [Turso](https://turso.tech/). Each host-specific guide above includes Turso setup steps.

## Environment variables

Every host needs the same baseline:

- `AUTH_SECRET` — random 32-byte secret for NextAuth JWT signing
- `AUTH_URL` — the public origin of your deployed app
- `AUTH_TRUST_HOST` — `true` when running behind a platform proxy
- `DATABASE_URL` — libSQL connection URL (`libsql://...`)
- `DATABASE_AUTH_TOKEN` — Turso auth token

Optional, depending on which auth providers you enable:

- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — Google OAuth
- `RESEND_API_KEY`, `EMAIL_FROM` — magic-link sign-in via Resend

See each host guide for platform-specific notes.
