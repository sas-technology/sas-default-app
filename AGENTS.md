# AGENTS.md

Instructions for AI assistants building on this template.

## What This Is

A Next.js starter template for **non-technical teachers at a Google school** to build miniapps. The template handles all the hard infrastructure (auth, database, Docker, accessibility, AI safety) so teachers — and the AI assistants helping them — can focus on building the actual app.

**The setup never changes.** Teachers run `./start.sh`, fill in a modal, and start using the app. Whatever you build on top of this template must preserve that experience.

## Who Uses This

| User                   | Skill Level           | What They Do                                            |
| ---------------------- | --------------------- | ------------------------------------------------------- |
| **Teachers**           | Non-coders            | Download the template, run `./start.sh`, use the app    |
| **Student developers** | Beginner–intermediate | Fork the repo, open in VS Code, customize the dashboard |
| **AI assistants**      | You                   | Build features, add pages, extend the dashboard         |

## Design Principles

Follow these strictly. They exist because the end users are not developers.

### 1. Zero-Config UX

Users never edit `.env` files, `config` files, or JSON. If a feature needs configuration, build a UI for it. The setup wizard at `/login` is the reference implementation — credentials are entered in a modal, saved via API, and the container restarts.

### 2. Docker-First

The app runs in a Docker container. Everything lives in one place:

- `/app/data/app.db` — SQLite database (persistent volume)
- `/app/data/.env` — Saved credentials (persistent volume)
- `docker-entrypoint.sh` sources the env file, then starts the server

New features must work inside this container. No external services unless the user explicitly opts in via a UI.

### 3. KISS

If a teacher can't understand the feature by looking at it, simplify it. No abstract configuration. No "power user" modes. One obvious way to do everything.

### 4. Fork-Safe

This is a public repo. Schools fork it and bring their own credentials. Never hardcode secrets. Never phone home. Auth providers register only when their env vars are present — if a school only sets up Google OAuth, email OTP doesn't exist for them.

### 5. Accessible by Default

All UI meets APCA AAA 3.0 contrast (body text Lc >= 90). Use the `@workspace/accessibility` package. Keyboard navigation must work. Screen readers must work.

## What's Built

### Infrastructure (done — don't rebuild)

- **Auth**: NextAuth v5, Google OAuth + Email OTP via Resend. Providers register conditionally based on env vars. Setup wizard at `/api/setup` + `/login` onboarding modal.
- **Database**: SQLite via libSQL + Drizzle ORM. Schema at `apps/web/lib/db/schema.ts`. Tables: users, accounts, sessions, verificationTokens.
- **Docker**: Multi-stage Dockerfile, `docker-compose.yml`, `start.sh` with Docker install detection, persistent volume for DB + credentials.
- **Middleware**: Route protection via NextAuth. All routes except `/api/auth/*`, static assets, and metadata files require authentication.
- **Error handling**: Root error boundary, global error boundary, 404 page, loading skeleton.
- **Theme**: Dark/light mode via `next-themes`. Press `d` to toggle.
- **AI Safety**: `@workspace/ai-safety` — rate limiter, input sanitizer, output filter, token budget, content safety, PII redactor. Composable middleware pipeline.
- **Accessibility**: `@workspace/accessibility` — APCA contrast calculation, SkipLink, VisuallyHidden, LiveRegion, focus trap, reduced motion detection.

### UI Components (available in `@workspace/ui`)

alert, avatar, badge, button, card, chart, dialog, dropdown-menu, input, label, separator, sheet, sidebar, skeleton, sonner (toast), table, tabs, tooltip

Add more with `npx shadcn@latest add <component>`.

### Pages

| Route        | Status      | Purpose                                             |
| ------------ | ----------- | --------------------------------------------------- |
| `/`          | Built       | Public landing page                                 |
| `/login`     | Built       | Auth flow (onboarding modal + Google/email sign-in) |
| `/dashboard` | Placeholder | Protected — this is where you build                 |

## What Needs to Be Built

The dashboard is a placeholder. Everything below belongs in `apps/web/app/(dashboard)/`.

### Priority: Core App Features

These are the pages and features that make this template useful as an actual app:

1. **Dashboard home** (`/dashboard`) — Replace the placeholder with a real home view. Show the user's name, recent activity, and quick actions. Use the `Card` component for layout.

2. **Profile/settings page** (`/dashboard/settings`) — Let users update their display name and view their email. This page should also show which auth method they used.

3. **Navigation** — The sidebar component exists but isn't wired up. Create a sidebar or top nav in the `(dashboard)/layout.tsx` that links between dashboard pages.

### Priority: Template Polish

1. **Landing page** (`/`) — The current landing page is generic. Update it to explain what the app does, with a clear "Get Started" CTA that links to `/login`.

2. **Signout flow** — Add a sign-out button to the dashboard. Use `signOut()` from `next-auth/react` and redirect to `/`.

3. **Loading states** — Add `loading.tsx` files to the dashboard route group for skeleton loading between page navigations.

### Priority: AI Features (when the app needs AI)

1. **AI chat route** (`/dashboard/chat`) — A basic chat interface that uses the `@workspace/ai-safety` middleware. Template for teachers building AI-powered tools.

2. **AI API route** (`/api/ai/chat`) — Server-side route that composes the safety pipeline. Expects `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` in env — add to the setup wizard if used.

### Priority: Admin & Multi-User

1. **User management** — List users in the database, see when they last signed in. Admin-only page.

2. **Role-based access** — Add a `role` column to the users table (`admin`, `teacher`, `student`). First user to sign in becomes admin.

## How to Build Features

### Adding a new page

```tsx
// apps/web/app/(dashboard)/your-feature/page.tsx
import { requireAuth } from "@/lib/auth-guard"

export default async function YourFeature() {
  const session = await requireAuth()
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-semibold">Your Feature</h1>
      {/* Build here */}
    </div>
  )
}
```

### Adding a new API route

```tsx
// apps/web/app/api/your-feature/route.ts
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  // Your logic here
}
```

### Using the database

```tsx
import { db, users } from "@/lib/db"
import { eq } from "drizzle-orm"

// Query
const user = await db.query.users.findFirst({
  where: eq(users.email, "teacher@school.edu"),
})

// Insert
await db.insert(users).values({ email: "new@school.edu" })
```

### Using AI safety

```tsx
import { createAiSafetyMiddleware } from "@workspace/ai-safety/middleware"

const safeAi = createAiSafetyMiddleware({
  rateLimit: { maxRequests: 10, windowMs: 60_000 },
  sanitize: { sensitivity: "medium" },
})

const result = await safeAi(
  { userId: session.user.id, input: userMessage },
  async (sanitizedInput) => {
    // Call your AI provider
    return { output: response, tokensUsed: count }
  }
)
```

## Conventions

- **Files**: kebab-case (`user-settings.tsx`)
- **Components**: PascalCase exports (`UserSettings`)
- **Imports**: `@/` for web app, `@workspace/` for packages
- **No `any` types** — use `unknown` and narrow
- **Server Components by default** — only add `"use client"` when you need hooks or browser APIs
- **Conventional commits**: `feat:`, `fix:`, `chore:`, `docs:`, `test:`

## Testing

Tests live in `__tests__/` directories. Use Vitest + Testing Library.

```bash
pnpm test           # Run all tests
pnpm --filter web test:watch  # Watch mode
```

Existing test coverage:

- Home page rendering
- Error boundary behavior
- APCA contrast calculations
- Input sanitizer
- PII redactor
- Rate limiter

**Missing test coverage** (write these when touching these areas):

- Login page flow (email entry → OTP entry → verification)
- Setup API route (POST with credentials, lock after setup)
- Auth guard (redirect when no session)
- Dashboard page rendering
- Database schema operations

## Do Not

- Do not remove the Docker setup or `start.sh`
- Do not add features that require manual `.env` editing — use the setup wizard pattern
- Do not use Edge runtime — this runs on Node.js in Docker
- Do not add external service dependencies without adding them to the setup wizard
- Do not use `any` types
- Do not skip accessibility — all text must pass APCA contrast, all interactions must be keyboard-accessible
- Do not hardcode credentials, URLs, or environment-specific values
