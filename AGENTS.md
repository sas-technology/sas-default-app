# AGENTS.md

Orientation for AI coding agents (Claude Code, Cursor, Aider, Copilot Workspace,
etc.) working in this repository. Read this file end-to-end before touching code
— it is the agent-facing counterpart to `CLAUDE.md` and supersedes anything
contradictory in older docs.

## 1. What this repo is

This is a production-ready **Next.js 16 monorepo template** with batteries
included: authentication (Google OAuth + email OTP), AI safety guardrails,
APCA AAA 3.0 accessibility utilities, error boundaries, Docker packaging, and
deploy-anywhere configuration. It is designed for schools, small teams, and
anyone who needs a safe, auditable foundation for a small web app. The setup
flow is intentionally non-technical: users run `./start.sh`, fill in a
credentials modal at `/login`, and the container restarts with authentication
live. Anything you build on top of the template must preserve that experience.

## 2. Monorepo structure

```text
apps/
  web/             Next.js 16 app (App Router, RSC, Turbopack) — package name: sas-default-app-web
packages/
  ui/                shadcn/ui components, transpiled by Next.js via transpilePackages
  ai-safety/         Rate limiter, input sanitizer, output filter, content safety,
                     PII redactor, token budget, composed middleware pipeline
  accessibility/     APCA AAA 3.0 contrast utilities + SkipLink, LiveRegion, focus hooks
  eslint-config/     Shared ESLint configs (base, next-js, react-internal)
  typescript-config/ Shared TS configs (base, nextjs, react-library)
docs/
  architecture.md          Workspace deps, build pipeline, auth flow, error hierarchy
  coding-conventions.md    File naming, imports, TS rules, contrast targets
  getting-started.md       First-time setup for contributors
  superpowers/             Internal specs + plans used by Claude Code's superpowers
                           skills. NOT product documentation — these are AI workflow
                           artefacts you can safely ignore unless executing a plan.
.github/
  workflows/ci.yml       Single CI workflow (typecheck, lint, format:check, build, test)
  ISSUE_TEMPLATE/        Bug + feature templates
  DISCUSSION_TEMPLATE/   Community discussion templates
  PULL_REQUEST_TEMPLATE.md
.husky/                  Git hooks (pre-commit runs lint-staged)
docker-compose.yml       Single-service compose: app container + persistent volume
Dockerfile               Multi-stage build (install -> build -> standalone runner)
docker-entrypoint.sh     Sources /app/data/.env then starts the server
start.sh                 Detects/installs Docker, builds, and opens the browser
turbo.json               Turborepo pipeline
pnpm-workspace.yaml      Workspace definition
```

A few directories referenced in older drafts are **not currently present**:
`apps/sheets`, `docs/overview.md`, `docs/ai-safety.md`, `docs/deployment/`,
`.claude/skills/`, `.github/workflows/security-audit.yml`, and
`.github/dependabot.yml`. If a task asks you to edit those, treat it as a
request to create them and confirm in the PR description.

## 3. Commands you'll use most

| Command                       | What it does                                            |
| ----------------------------- | ------------------------------------------------------- |
| `pnpm dev`                    | Start the dev server (Turbopack) on `localhost:11000`   |
| `pnpm build`                  | Build every workspace through Turborepo                 |
| `pnpm typecheck`              | Run `tsc --noEmit` across the monorepo                  |
| `pnpm lint`                   | ESLint across all workspaces                            |
| `pnpm lint:md`                | `markdownlint-cli2` across all Markdown                 |
| `pnpm format`                 | Prettier write across all workspaces                    |
| `pnpm format:check`           | Prettier check (no writes) — CI-equivalent              |
| `pnpm test`                   | Vitest in every workspace that has tests                |
| `pnpm --filter <name> <cmd>`  | Scope a command to one workspace                        |
| `./start.sh`                  | One-shot user-facing launcher (Docker)                  |

**Gotcha:** the web app's package name is **`sas-default-app-web`**, not
`web`. `pnpm --filter web ...` matches nothing. Use
`pnpm --filter sas-default-app-web test` (or `--filter ./apps/web`).

There is no `pnpm test:coverage` script in this repo yet — coverage runs are
not part of the current pipeline. If you need coverage, invoke
`vitest run --coverage` inside `apps/web` directly.

## 4. Key architectural decisions

- **Monorepo:** pnpm 9 workspaces + Turborepo. Internal deps use the
  `workspace:*` protocol.
- **App framework:** Next.js 16 App Router. Server Components by default;
  only opt into `"use client"` for hooks, browser APIs, or event handlers.
- **Auth:** NextAuth v5 beta (`5.0.0-beta.30`) with Google OAuth + Resend email
  OTP. JWT sessions — no database is required to store sessions.
  Providers register **conditionally** based on env vars, so a fresh fork has
  no providers until the setup wizard runs.
- **Database:** SQLite via libSQL (`@libsql/client`) + Drizzle ORM. Schema in
  `apps/web/lib/db/schema.ts`. Compatible with Turso for hosted SQLite.
- **Styling:** Tailwind CSS v4 with CSS-first config and OKLCH design tokens
  in `packages/ui/src/styles/globals.css`. Class merging via `cn()` from
  `@workspace/ui/lib/utils`.
- **Components:** shadcn/ui lives in `packages/ui/src/components/`, consumed
  as source via Next.js `transpilePackages`.
- **Accessibility target:** APCA AAA 3.0 (not WCAG 2.x). Body text Lc ≥ 90,
  large text Lc ≥ 75, non-text Lc ≥ 60.
- **AI safety:** A composable middleware pipeline lives in
  `@workspace/ai-safety`. Every AI-touching route should call
  `createAiSafetyMiddleware(...)`.
- **TypeScript:** strict mode with `noUncheckedIndexedAccess`. Imports are
  extensionless (`moduleResolution: "Bundler"`).

## 5. AI safety guardrails (high level)

`@workspace/ai-safety` exposes six guardrails plus a composer:

- **Rate limiter** (`guardrails/rate-limiter.ts`) — per-user request budgets.
- **Input sanitizer** (`guardrails/input-sanitizer.ts`) — prompt-injection and
  jailbreak heuristics.
- **Output filter** (`guardrails/output-filter.ts`) — strips disallowed
  patterns from model output.
- **Token budget** (`guardrails/token-budget.ts`) — caps per-call and per-user
  token spend.
- **Content safety** (`moderation/content-safety.ts`) — baseline regex/keyword
  safety classifier.
- **PII redactor** (`moderation/pii-redactor.ts`) — masks emails, phone
  numbers, government IDs, etc.

All six compose via `createAiSafetyMiddleware()` in
`packages/ai-safety/src/middleware/`. Always wrap AI calls with it — never
call a model API directly from a route handler. See section 9 for a usage
snippet.

## 6. Security model

- **Auth gating** — `apps/web/middleware.ts` re-exports NextAuth's `auth()`
  middleware. Every route is protected except `/api/auth/*`, Next.js
  internals, and metadata files (`favicon.ico`, `sitemap.xml`, `robots.txt`).
- **Setup wizard lock** — `apps/web/app/api/setup/route.ts` is a one-shot
  endpoint that writes credentials to `/app/data/.env` (Docker) or
  `.env.local` (dev) and then locks itself the moment any provider env var
  is present. There is no separate token; the lock is the presence check.
- **Generated `AUTH_SECRET`** — the setup wizard generates a 32-byte random
  secret on first save, so secrets never ship in the repo.
- **No `.env` editing required** — users with no shell skills should never
  need to touch dotfiles. New features must follow this pattern.
- **Provider isolation** — auth providers register only if their env vars are
  present. A school that only configures Google never exposes the email
  pathway.
- **Husky pre-commit** — runs lint-staged, which runs `eslint --fix`,
  `prettier --write`, `secretlint`, and `markdownlint-cli2 --fix` against
  staged files. `secretlint` also scans `.env`, `.sh`, and `Dockerfile`.

The Dependabot config, scheduled `pnpm audit` workflow, and explicit security
response headers referenced in earlier drafts are **not yet present** in the
repository. Add them in a dedicated PR if your task requires them.

## 7. Deployment options

This template is intentionally portable. The supported targets are:

- **Docker (local / self-hosted)** — `./start.sh` on the user's machine, or
  `docker compose up -d --build` directly. The app listens on port `11000`
  and stores `app.db` plus `.env` in a named volume.
- **Vercel** — set the project root to `apps/web` and override the build
  command to `cd ../.. && pnpm build --filter sas-default-app-web`. Set
  `AUTH_SECRET`, `AUTH_URL`, `DATABASE_URL`, and any provider keys in the
  Vercel dashboard.
- **Netlify, Cloudflare Workers (via OpenNext), Apps Script + Sheets
  companion** — these targets are part of the long-term roadmap but **not
  configured in the repository yet**. There is currently no `apps/sheets`
  workspace and no `docs/deployment/` directory.

The setup wizard's "write env file and `process.exit(0)`" pattern only works
in Docker, where the container restarts under `restart: unless-stopped`. On
serverless platforms you must set env vars in the platform dashboard ahead of
time.

## 8. Testing

- **Framework:** Vitest 4 + Testing Library (jsdom). Setup file at
  `apps/web/vitest.setup.ts` loads jest-dom matchers.
- **Location:** `__tests__/` directories co-located with the source they
  cover. Each package can have its own.
- **Patterns:** prefer `getByRole`, `getByLabelText`, `getByText`. Avoid
  `getByTestId`. Always call `cleanup()` in `afterEach` — jsdom reuses the
  DOM between tests and you will get false positives without it.
- **Existing coverage:** home page, error boundary, APCA contrast, input
  sanitizer, PII redactor, rate limiter.
- **Gaps to fill when you touch them:** login flow, `/api/setup`, auth-guard
  redirects, dashboard page, database schema operations.

There is no coverage threshold enforced in CI today. If a future task adds
one, document it here.

## 9. Conventions

- **File names:** kebab-case (`auth-guard.ts`, `error-boundary.tsx`).
- **Component exports:** PascalCase (`ErrorBoundary`, `SkipLink`).
- **Imports:** `@/` for app-local paths under `apps/web`, `@workspace/*` for
  shared packages, no `.js` extensions on `.ts`/`.tsx` imports.
- **TypeScript:** no `any`; use `unknown` and narrow.
- **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`,
  `test:`, `refactor:`).
- **Server vs client:** Server Components by default. Only add `"use client"`
  when you actually need hooks, browser APIs, or event handlers.
- **Contrast:** APCA Lc ≥ 90 for body text, ≥ 75 for large text, ≥ 60 for
  non-text (icons, borders).

### Minimal route example

```tsx
// apps/web/app/(dashboard)/your-feature/page.tsx
import { requireAuth } from "@/lib/auth-guard"

export default async function YourFeature() {
  const session = await requireAuth()
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-semibold">
        Hello, {session.user?.name}
      </h1>
    </div>
  )
}
```

### Minimal AI-safe API route

```ts
import { createAiSafetyMiddleware } from "@workspace/ai-safety/middleware"

const safeAi = createAiSafetyMiddleware({
  rateLimit: { maxRequests: 10, windowMs: 60_000 },
  sanitize: { sensitivity: "medium" },
})

export async function POST(req: Request) {
  const { userId, input } = await req.json()
  const result = await safeAi({ userId, input }, async (clean) => {
    // call your model here
    return { output: "...", tokensUsed: 42 }
  })
  return Response.json(result)
}
```

## 10. Quality gates

- **Pre-commit (`.husky/pre-commit` → lint-staged):**
  - `*.{ts,tsx,js,mjs,cjs}` → `eslint --fix` + `prettier --write` + `secretlint`
  - `*.{json,yaml,yml,css}` → `prettier --write` + `secretlint`
  - `*.md` → `markdownlint-cli2 --fix` + `prettier --write` + `secretlint`
  - `*.{env,sh,Dockerfile,dockerfile}` → `secretlint`
- **CI (`.github/workflows/ci.yml`):** Node from `.nvmrc`, pnpm via
  `pnpm/action-setup@v4`, then `pnpm typecheck`, `pnpm lint`,
  `pnpm format:check`, `pnpm build`, `pnpm test`. Lockfile is installed
  with `--frozen-lockfile`.

Additional gates referenced in older drafts (markdown lint in CI, secret
scanning workflow, `sort-package-json` check, weekly `pnpm audit`, lockfile
freshness, coverage thresholds) are **not yet wired up** in CI. They run
locally on commit via lint-staged for the relevant file types, but the
workflow does not invoke them.

## 11. Common gotchas

1. **Wrong workspace filter name.** The web app is published as
   `sas-default-app-web`. `pnpm --filter web` matches nothing — use
   `--filter sas-default-app-web` or `--filter ./apps/web`.
2. **NextAuth v5 type annotations.** Some exports cannot be inferred and need
   explicit `typeof nextAuth.X` annotations. See `apps/web/lib/auth.ts` for
   the established pattern; copy it when you wrap or re-export.
3. **No `.js` extensions in imports.** Packages set
   `moduleResolution: "Bundler"` and source-only consumption via
   `transpilePackages`. Use `from "./foo"`, never `from "./foo.js"`.
4. **shadcn paths.** Components live under
   `packages/ui/src/components/<name>.tsx` and are imported as
   `@workspace/ui/components/<name>`. Run `npx shadcn@latest add <name>` from
   the repo root.
5. **Setup wizard restart trick is Docker-only.** The route writes a file and
   calls `process.exit(0)` so the container relaunches with the new env. On
   Vercel, Netlify, or Cloudflare you must set env vars through the platform
   dashboard before deploying.
6. **Markdown lint rules.** `markdownlint-cli2` runs on commit and is
   configured in `.markdownlint-cli2.jsonc`. Notable opt-outs: MD013
   (line-length), MD033 (inline HTML), MD041 (first-line H1), and MD024 with
   `siblings_only`. Run `pnpm lint:md` to verify before pushing.
7. **APCA, not WCAG.** Do not chase WCAG 2.x ratios — they will disagree with
   the APCA validator. Body text Lc ≥ 90, large Lc ≥ 75, non-text Lc ≥ 60.
8. **`docs/superpowers/` is not product docs.** It contains plans and specs
   used by Claude Code's superpowers skills (writing-plans, executing-plans,
   etc.). Don't link to it from user-facing docs and don't treat it as
   reference material for the template itself.
9. **Single CI job.** There is only one workflow today (`ci.yml`). Don't
   reference `security-audit.yml` or Dependabot until you actually add them.
10. **No libSQL stores in ai-safety yet.** The in-memory implementations are
    the only stores currently shipped. Plug in your own if you need
    persistence across processes.

## 12. When making changes

1. **Read the relevant `docs/*.md` first** — `architecture.md`,
   `coding-conventions.md`, and `getting-started.md` cover most of the
   "where does this go?" questions.
2. **Use the right skill if you have one.** Claude Code's superpowers
   plugin provides `writing-plans`, `executing-plans`,
   `systematic-debugging`, `test-driven-development`, and
   `verification-before-completion` — invoke them for multi-step or
   high-risk work. Slash-command equivalents live wherever your harness
   exposes them.
3. **Practice TDD where the task is testable.** Vitest is wired up; write
   the failing test first, then the implementation.
4. **Keep commits scoped.** One logical change per commit. Use Conventional
   Commits prefixes. Never use `--no-verify` to bypass hooks.
5. **Run the quality gates locally before pushing:** `pnpm typecheck`,
   `pnpm lint`, `pnpm format:check`, `pnpm lint:md`, `pnpm test`.
6. **For brand or visual decisions,** there is currently no
   `.claude/skills/sas-brand-guidelines/` skill in this repo. If your task
   asks you to consult it, treat that as a request to create the skill
   first.

## 13. Files an agent should always check first

- `AGENTS.md` — this file.
- `CLAUDE.md` — the Claude-Code-specific counterpart; some sections are
  tuned to Claude's harness.
- `README.md` — the user-facing entry point. Useful for understanding the
  "non-technical teacher" UX the template is optimised for.
- `docs/architecture.md` — workspace dependency graph and request flows.
- `docs/coding-conventions.md` — definitive style/lint expectations.
- `docs/getting-started.md` — dev environment setup, env vars, deploy.
- `apps/web/lib/auth.ts` — auth provider registration; the canonical
  example of the conditional-provider pattern.
- `apps/web/middleware.ts` — what is and isn't protected.
- `package.json` (root) + `apps/web/package.json` — script and dependency
  truth.
- `turbo.json` — task graph and caching rules.

When in doubt, prefer the wording in this file and in `CLAUDE.md` over older
docs. If you find a discrepancy, fix it in the same PR and call it out.
