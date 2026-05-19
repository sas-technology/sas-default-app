# Deployment

The app is designed to run anywhere a Node.js 22+ runtime is available. Pick the target that best matches your team:

| Target                 | Best for                                              | Persistence            | Guide                                               |
| ---------------------- | ----------------------------------------------------- | ---------------------- | --------------------------------------------------- |
| **Vercel**             | Zero-ops, preview deploys, custom domains, edge cache | Turso (managed libSQL) | [vercel.md](./vercel.md)                            |
| **Netlify**            | Vercel alternative with similar DX                    | Turso (managed libSQL) | _Planned_                                           |
| **Cloudflare**         | Edge runtime, low latency, generous free tier         | Turso or D1            | _Planned_                                           |
| **Docker**             | Self-hosted, VPS, on-prem; full control               | Local SQLite volume    | See repo root `Dockerfile` and `docker-compose.yml` |
| **Google Apps Script** | Embedding into a Google Workspace tenant              | Sheets / Drive         | _Planned_                                           |

## Choosing a target

- **Want it deployed in 10 minutes with previews on every PR?** → [Vercel](./vercel.md).
- **Need full control over the host, or running in an air-gapped environment?** → Docker.
- **Embedding into Google Workspace for a school or org?** → Apps Script (coming soon).

## What all targets share

- **Auth:** NextAuth v5 with JWT sessions (no database row needed for sessions).
- **Database:** libSQL via Drizzle ORM — the same schema works against a local SQLite file or a managed Turso instance.
- **Accessibility:** APCA AAA 3.0 contrast and a11y components run server-side.
- **AI safety:** `@workspace/ai-safety` middleware composes rate limiting, sanitization, and PII redaction around every AI endpoint.
- **Audit logging:** Written to the same database; durable across deployments.

## Environment variables

Every target needs the same core set of environment variables. See each target's guide for how to set them on that platform. The canonical list lives in `apps/web/.env.local.example`.
