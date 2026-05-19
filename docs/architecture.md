# Architecture

## Monorepo Structure

```text
.
├── apps/
│   └── web/                          # Next.js application
│       ├── app/                      # App Router pages and layouts
│       │   ├── (auth)/               # Auth route group (login)
│       │   ├── (dashboard)/          # Protected route group
│       │   ├── api/auth/             # NextAuth API routes
│       │   ├── error.tsx             # Root error boundary
│       │   ├── global-error.tsx      # Global error boundary
│       │   ├── not-found.tsx         # 404 page
│       │   ├── loading.tsx           # Root loading state
│       │   ├── layout.tsx            # Root layout
│       │   └── page.tsx              # Landing page
│       ├── components/               # App-level components
│       ├── hooks/                    # App-level hooks
│       ├── lib/                      # Utilities and config
│       └── middleware.ts             # Route protection
├── packages/
│   ├── ui/                           # Shared component library
│   ├── ai-safety/                    # AI guardrails and moderation
│   ├── accessibility/                # APCA AAA 3.0 contrast, a11y utilities
│   ├── eslint-config/                # Shared ESLint configs
│   └── typescript-config/            # Shared TS configs
├── turbo.json                        # Turborepo pipeline config
└── pnpm-workspace.yaml               # Workspace definition
```

## Workspace Dependencies

```text
apps/web
├── @workspace/ui              (components, styles)
├── @workspace/ai-safety       (guardrails for AI routes)
└── @workspace/accessibility   (APCA, skip links, hooks)

packages/ui
├── @workspace/eslint-config
└── @workspace/typescript-config

packages/ai-safety
└── @workspace/typescript-config

packages/accessibility
└── @workspace/typescript-config
```

## Turborepo Pipeline

Tasks defined in `turbo.json` enable parallel builds with caching:

- `build` - Depends on upstream builds, outputs `.next/`
- `typecheck` - Type checks all workspaces
- `lint` - Lints all workspaces
- `test` - Runs tests (depends on upstream builds)
- `dev` - Persistent dev server (no caching)

## Auth Flow

1. User visits a protected route under `/(dashboard)`
2. NextAuth middleware (`middleware.ts`) checks session
3. No session → redirect to `/login`
4. User submits credentials → NextAuth validates via `authorize()` in `lib/auth.ts`
5. Success → JWT issued, stored in cookie → redirect to `/dashboard`
6. Protected server components use `requireAuth()` from `lib/auth-guard.ts`

## AI Safety Middleware Pipeline

```text
Request → Rate Limit → Sanitize Input → Content Safety Check
                                                ↓
Response ← PII Redaction ← Output Filter ← [AI API Call]
```

Each step is independently configurable. Use `createAiSafetyMiddleware()` to compose the pipeline.

See [docs/ai-safety.md](./ai-safety.md) for the canonical reference: every guardrail, what it protects against, how to configure it, and where its limits lie.

## Provider Composition

```tsx
// apps/web/components/providers.tsx
<SessionProvider>
  <ThemeProvider>{children}</ThemeProvider>
</SessionProvider>
```

Add new providers by wrapping in this composition root.

## Error Boundary Hierarchy

1. **`global-error.tsx`** - Catches errors in root layout (renders its own `<html>`)
2. **`error.tsx`** - Catches errors in page content (uses layout)
3. **`<ErrorBoundary>`** component - Reusable boundary for specific sections

## Tailwind CSS v4

Uses CSS-first configuration via `packages/ui/src/styles/globals.css`:

- Design tokens as CSS custom properties (OKLCH color space)
- Dark mode via `.dark` class (toggled by next-themes)
- `cn()` utility merges Tailwind classes with conflict resolution

## Tech Stack

| Category      | Technology                                               |
| ------------- | -------------------------------------------------------- |
| Framework     | Next.js 16 (App Router, RSC, Turbopack)                  |
| UI            | shadcn/ui + Radix UI + Tailwind CSS v4 (OKLCH)           |
| Auth          | NextAuth v5, Google OAuth, Email OTP via Resend          |
| Database      | SQLite via libSQL/Drizzle (local file, Turso-compatible) |
| AI Safety     | Rate limiting, prompt injection detection, PII redaction |
| Accessibility | APCA AAA 3.0, skip links, focus management               |
| Monorepo      | Turborepo + pnpm workspaces                              |
| Testing       | Vitest + Testing Library                                 |
| CI            | GitHub Actions + Husky + lint-staged                     |

## Scripts

```bash
pnpm dev            # Dev server (localhost:11000)
pnpm build          # Build all workspaces
pnpm typecheck      # Type check
pnpm lint           # Lint
pnpm test           # Run tests
pnpm format         # Format code
pnpm db:push        # Push schema to SQLite
pnpm db:studio      # Open Drizzle Studio (DB browser)
```

## Environment Variables

| Variable               | Purpose                                             |
| ---------------------- | --------------------------------------------------- |
| `AUTH_SECRET`          | Session encryption (auto-generated by setup wizard) |
| `AUTH_URL`             | App URL (default: `http://localhost:11000`)         |
| `DATABASE_URL`         | SQLite path (default: `file:./dev.db`)              |
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID                              |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret                          |
| `RESEND_API_KEY`       | Resend API key for email OTP                        |
| `EMAIL_FROM`           | Sender email for OTP codes                          |

## Docker Architecture

- Multi-stage build: install → build → standalone runner
- Single volume (`app-data`) holds SQLite DB + saved credentials
- `docker-entrypoint.sh` sources `/app/data/.env` before starting
- Setup API writes credentials, then `process.exit(0)` triggers Docker restart
- `restart: unless-stopped` ensures automatic recovery

## Auth Provider Detection

Providers register conditionally based on env vars:

- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` → Google OAuth enabled
- `RESEND_API_KEY` → Email OTP enabled
- Neither → Onboarding modal shown at `/login`

The setup API (`/api/setup`) is locked once any provider is configured.

## Accessibility

The MiniApp Template targets **APCA AAA 3.0** contrast (not legacy WCAG 2.x ratios). See [Coding Conventions](./coding-conventions.md#apca-aaa-30-contrast) for the per-use-case Lc thresholds and the `validateContrast` helper.

## See also

- [Getting Started](./getting-started.md) — local development setup
- [Coding Conventions](./coding-conventions.md) — file naming, TypeScript rules, contrast thresholds
- [AI Safety Guardrails](./ai-safety.md) — canonical reference for `@workspace/ai-safety`
- [Project Overview](./overview.md) — what the template is and who it's for
