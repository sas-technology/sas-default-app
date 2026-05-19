# CLAUDE.md

This file provides context for AI assistants working with this codebase.

## What Is This?

A production-ready Next.js monorepo template used as a starting point for new projects. It includes authentication, AI safety guardrails, APCA AAA 3.0 accessibility, error boundaries, and comprehensive tooling out of the box.

**This is a base template** — the auth provider is a placeholder, and teams are expected to customize it for their specific backend.

## Monorepo Structure

```text
.
├── apps/
│   └── web/                            # Next.js 16 app (App Router, RSC, Turbopack)
│       ├── app/
│       │   ├── (auth)/login/page.tsx   # Public login page
│       │   ├── (dashboard)/            # Protected route group
│       │   │   └── dashboard/page.tsx  # /dashboard (requires auth)
│       │   ├── api/auth/[...nextauth]/ # NextAuth API routes
│       │   ├── error.tsx               # Root error boundary
│       │   ├── global-error.tsx        # Layout-level error boundary
│       │   ├── not-found.tsx           # 404 page
│       │   ├── loading.tsx             # Root loading skeleton
│       │   ├── layout.tsx              # Root layout (providers, fonts, a11y)
│       │   └── page.tsx               # Landing page (public)
│       ├── components/
│       │   ├── providers.tsx           # Composition root (SessionProvider + ThemeProvider)
│       │   ├── error-boundary.tsx      # Reusable client error boundary
│       │   └── theme-provider.tsx      # Dark/light mode (press 'd' to toggle)
│       ├── lib/
│       │   ├── auth.ts                 # NextAuth config (⚠️ placeholder authorize fn)
│       │   ├── auth-guard.ts           # Server-side requireAuth() helper
│       │   └── constants.ts            # APP_NAME, route constants
│       ├── hooks/
│       │   └── use-session.ts          # Typed session hook wrapper
│       ├── middleware.ts               # Route protection (auth check on all routes)
│       ├── vitest.config.ts
│       └── __tests__/                  # Co-located tests
├── packages/
│   ├── ui/                             # Shared shadcn/ui component library
│   │   └── src/
│   │       ├── components/button.tsx   # Example component (CVA variants)
│   │       ├── lib/utils.ts            # cn() class merge utility
│   │       └── styles/globals.css      # Tailwind v4 + design tokens (OKLCH)
│   ├── ai-safety/                      # AI safety guardrails
│   │   └── src/
│   │       ├── guardrails/             # Rate limiter, input sanitizer, output filter, token budget
│   │       ├── moderation/             # Content safety, PII redactor
│   │       └── middleware/             # Composed safety pipeline
│   ├── accessibility/                  # APCA AAA 3.0 accessibility
│   │   └── src/
│   │       ├── apca/                   # Contrast calculation + validation
│   │       ├── components/             # SkipLink, VisuallyHidden, LiveRegion
│   │       ├── hooks/                  # useReducedMotion, useFocusTrap, useAnnounce
│   │       └── utils/                  # Color conversion, focus management
│   ├── eslint-config/                  # Shared ESLint configs (base, next-js, react-internal)
│   └── typescript-config/              # Shared TS configs (base, nextjs, react-library)
├── turbo.json                          # Turborepo pipeline
├── pnpm-workspace.yaml                 # Workspace definition
└── .github/workflows/ci.yml           # CI pipeline
```

## Commands

```bash
pnpm dev            # Start dev server (localhost:3000)
pnpm build          # Build all workspaces
pnpm typecheck      # Type check all workspaces
pnpm lint           # Lint all workspaces
pnpm test           # Run all tests (Vitest)
pnpm format         # Format code (Prettier)
pnpm format:check   # Check formatting without writing

# Filter to a specific workspace
pnpm --filter web dev
pnpm --filter web test
pnpm --filter @workspace/ai-safety test
```

## Key Architecture Decisions

- **Package manager:** pnpm with workspace protocol (`workspace:*`)
- **Auth:** NextAuth v5 beta with Credentials provider, JWT sessions, no database required
- **Styling:** Tailwind CSS v4 with CSS variables (OKLCH color space), `cn()` utility
- **Components:** shadcn/ui in `packages/ui/src/components/`, consumed as source via `transpilePackages`
- **Server Components by default** — only add `"use client"` when hooks/browser APIs are needed
- **TypeScript strict mode** with `noUncheckedIndexedAccess` enabled
- **APCA AAA 3.0** contrast algorithm (replaces WCAG 2.x ratios)
- **No `.js` extensions** in import paths — packages use `"moduleResolution": "Bundler"`

## Route Protection

The middleware at `apps/web/middleware.ts` runs NextAuth's `auth()` on every request except:

- `/api/auth/*` (NextAuth endpoints)
- `/_next/static/*`, `/_next/image/*` (Next.js internals)
- `/favicon.ico`, `/sitemap.xml`, `/robots.txt`

For server components in protected routes, use `requireAuth()`:

```ts
import { requireAuth } from "@/lib/auth-guard"

export default async function ProtectedPage() {
  const session = await requireAuth() // redirects to /login if no session
  return <div>Hello {session.user?.name}</div>
}
```

For client components, use the `useSession()` hook from `@/hooks/use-session`.

## Auth (Placeholder)

**⚠️ The authorize function in `apps/web/lib/auth.ts` is a placeholder.** It accepts any non-empty email/password. Teams must replace it with their actual authentication backend before deploying.

The auth system uses JWT sessions — no database is needed for session storage. If you need database-backed sessions, swap `strategy: "jwt"` to `strategy: "database"` and add an adapter.

## Common Tasks

### Add a shadcn component

```bash
npx shadcn@latest add <component-name>
```

Components install to `packages/ui/src/components/`.

### Add a protected route

Create `apps/web/app/(dashboard)/your-route/page.tsx`. The `(dashboard)` route group is for authenticated pages. Call `requireAuth()` at the top of server components.

### Add a public route

Create `apps/web/app/(auth)/your-route/page.tsx` or directly under `apps/web/app/`.

### Add a provider

Wrap in `apps/web/components/providers.tsx` — this is the composition root used in the root layout.

### Add a new workspace package

1. Create `packages/your-package/` with `package.json` (name: `@workspace/your-package`)
2. Add `tsconfig.json` extending `@workspace/typescript-config/base.json`
3. Set `"module": "ESNext"` and `"moduleResolution": "Bundler"` in tsconfig
4. Add to `apps/web/package.json` dependencies and `next.config.mjs` transpilePackages
5. Use extensionless imports (no `.js` extensions)

### Add an AI-powered API route

```ts
import { createAiSafetyMiddleware } from "@workspace/ai-safety/middleware"

const safeAi = createAiSafetyMiddleware({
  rateLimit: { maxRequests: 10, windowMs: 60_000 },
  sanitize: { sensitivity: "medium" },
})

// Then use: const result = await safeAi({ userId, input }, handler)
```

## Testing

- **Framework:** Vitest + Testing Library (jsdom environment)
- **Location:** `__tests__/` directories co-located with source
- **Setup:** `apps/web/vitest.setup.ts` loads jest-dom matchers
- **Cleanup:** Always use `cleanup()` in `afterEach` — jsdom reuses the DOM between tests
- **Queries:** Prefer `getByRole`, `getByText`, `getByLabelText` over `getByTestId`

## Conventions

- **Files:** kebab-case (`auth-guard.ts`, `error-boundary.tsx`)
- **Components:** PascalCase exports (`ErrorBoundary`, `SkipLink`)
- **Imports:** `@/` for apps/web local, `@workspace/` for shared packages
- **No `any` types** — use `unknown` and narrow
- **Conventional commits** (`feat:`, `fix:`, `chore:`, `docs:`, `test:`)
- **APCA contrast:** Body text Lc >= 90, large text Lc >= 75, non-text Lc >= 60

## Troubleshooting

- **"Cannot be named without a reference"** on NextAuth exports: Use `typeof nextAuth.X` annotations (see `lib/auth.ts` pattern)
- **Module not found for `.tsx` files:** Don't use `.js` extensions in imports; set `moduleResolution: "Bundler"` in tsconfig
- **Stale turbo cache:** Run `pnpm turbo --force` to skip cache
- **Pre-commit hook fails:** Fix lint/format issues, then commit again (don't use `--no-verify`)
