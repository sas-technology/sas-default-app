# CLAUDE.md

AI coding agent quick reference. For the full engineering reference, see **`AGENTS.md`** — it supersedes anything contradictory here.

## What this is

A production-ready Next.js 16 monorepo template. Ships with auth (Google OAuth + email OTP), AI safety guardrails, APCA AAA 3.0 accessibility, SQLite/Drizzle, Docker packaging, and multi-platform deploy options. Intended for schools and small teams.

## Quick commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Dev server at `http://localhost:11000` |
| `pnpm build` | Build all workspaces |
| `pnpm typecheck` | `tsc --noEmit` across the monorepo |
| `pnpm lint` | ESLint all workspaces |
| `pnpm format` | Prettier write |
| `pnpm format:check` | Prettier check (CI-equivalent) |
| `pnpm test` | Vitest in every workspace |
| `pnpm --filter sas-default-app-web dev` | Filter to web app only |
| `pnpm db:push` | Push Drizzle schema to SQLite |
| `pnpm db:studio` | Open Drizzle Studio |

## Monorepo structure

```text
apps/web/          Next.js app (package name: sas-default-app-web)
packages/
  ui/              shadcn/ui components
  ai-safety/       Guardrails: rate-limit, sanitize, output-filter, content-safety, PII, token-budget
  accessibility/   APCA utilities, SkipLink, LiveRegion, focus hooks
  eslint-config/   Shared ESLint configs
  typescript-config/ Shared TS configs
```

## Critical gotchas for AI agents

- **Filter name is `sas-default-app-web`** — `pnpm --filter web` matches nothing
- **Port 11000** — not 3000
- **APCA AAA 3.0 contrast, not WCAG 2.x** — body Lc ≥ 90, large text Lc ≥ 75, non-text Lc ≥ 60
- **No `.js` extensions** in imports — moduleResolution is `"Bundler"`
- **No `any` types** — use `unknown` and narrow
- **Server Components by default** — only `"use client"` when you need hooks/browser APIs
- **`ReturnType<typeof createAiSafetyMiddleware>`** in `apps/web/lib/ai-safety.ts` avoids TS4058 errors from unexported internal types
- The **authorize function in `lib/auth.ts` is a placeholder** — replace before deploying

## AI safety middleware

```ts
import { aiSafety } from "@/lib/ai-safety"

// In an API route:
const safe = await aiSafety({ rateLimit: { maxRequests: 10, windowMs: 60_000 } })
const result = await safe({ userId, input }, async ({ sanitized }) => {
  const response = await callModel(sanitized)
  return { output: response.text, tokensUsed: response.usage.total }
})
```

The `aiSafety()` factory wires libSQL-backed rate-limit and token-budget stores automatically. For configuration options see `docs/ai-safety.md`.

## Auth

NextAuth v5 beta. Providers register conditionally on env vars:

- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` → Google OAuth
- `RESEND_API_KEY` → Email OTP

Protected server components: `await requireAuth()` from `@/lib/auth-guard`. Protected client components: `useSession()` from `@/hooks/use-session`.

## Route protection

Middleware at `apps/web/middleware.ts` runs on all routes except `/api/auth/*`, `/_next/*`, `/favicon.ico`, and `/api/health`.

Protected routes live under `app/(dashboard)/`. Public routes under `app/(auth)/` or directly under `app/`.

## Testing

```bash
pnpm --filter sas-default-app-web test          # web tests
pnpm --filter @workspace/ai-safety test         # ai-safety tests
```

Tests live in `__tests__/` next to source. Use Testing Library role/text/label queries — avoid `getByTestId`. Always `cleanup()` in `afterEach`.

## Superpowers skills (Claude Code)

Skills available via the `Skill` tool:

- `superpowers:brainstorming` — turn ideas into specs
- `superpowers:writing-plans` — create implementation plans
- `superpowers:subagent-driven-development` — execute plans via fresh subagents
- `superpowers:executing-plans` — inline plan execution
- `superpowers:test-driven-development` — TDD workflow
- `superpowers:systematic-debugging` — structured debugging
- `superpowers:using-git-worktrees` — parallel isolated workspaces
- `superpowers:requesting-code-review` / `superpowers:receiving-code-review`
- `superpowers:finishing-a-development-branch`

## Docs

| Doc | Contents |
| --- | --- |
| `AGENTS.md` | Full engineering reference (start here) |
| `docs/architecture.md` | Monorepo layout, auth flow, tech stack |
| `docs/coding-conventions.md` | Naming, imports, TS rules, contrast |
| `docs/getting-started.md` | Local dev setup |
| `docs/ai-safety.md` | Every guardrail with config and limitations |
| `docs/overview.md` | Plain-language description for auditors |
| `docs/security.md` | Security model, threat surface, controls |
| `docs/deployment/` | Vercel, Netlify, Cloudflare, GitHub Pages guides |
| `CONTRIBUTING.md` | PR process, quality gates, pre-commit hooks |
| `SECURITY.md` | Vulnerability reporting |
