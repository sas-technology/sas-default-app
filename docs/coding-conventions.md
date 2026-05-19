# Coding Conventions

## File Naming

- **Files:** kebab-case (`auth-guard.ts`, `error-boundary.tsx`)
- **Components:** PascalCase exports (`ErrorBoundary`, `SkipLink`)
- **Hooks:** camelCase with `use` prefix (`useSession`, `useAnnounce`)

## Server vs Client Components

- **Default to Server Components** - no directive needed
- Add `"use client"` only when you need:
  - React hooks (`useState`, `useEffect`, etc.)
  - Browser APIs (`window`, `document`)
  - Event handlers (`onClick`, `onChange`)
  - Third-party client libraries

## Import Ordering

1. React/Next.js imports
2. Third-party packages
3. `@workspace/` package imports
4. `@/` local imports
5. Relative imports
6. Type-only imports

## Styling

- Use Tailwind CSS utility classes
- Use `cn()` from `@workspace/ui/lib/utils` for conditional classes
- Use CSS custom properties for design tokens (defined in globals.css)
- Avoid inline styles except in accessibility components

## TypeScript

- **Strict mode** is enabled
- No `any` types - use `unknown` and narrow
- `noUncheckedIndexedAccess` is enabled - always check array/object access
- Prefer `interface` for object shapes, `type` for unions/intersections

## APCA AAA 3.0 Contrast

Use the `@workspace/accessibility/apca` module to validate color pairs:

| Use Case                        | Minimum Lc |
| ------------------------------- | ---------- |
| Body text (14-16px)             | 90         |
| Large text (24px+ / 18px+ bold) | 75         |
| Non-text (icons, borders)       | 60         |
| Placeholder/disabled text       | 45         |

```typescript
import { validateContrast } from "@workspace/accessibility/apca"

const result = validateContrast("#333333", "#ffffff", "bodyText")
// result.passes === true/false
```

## Testing

- Tests in `__tests__/` directories co-located with source
- Use Testing Library queries by role, text, or label (avoid `getByTestId`)
- Run specific package tests: `pnpm --filter web test`

## Git Conventions

- Branch from `main`
- Use conventional commit messages (`feat:`, `fix:`, `chore:`, `docs:`, `test:`)
- Pre-commit hooks run automatically (lint + format)
- PR template includes accessibility checklist

## AI Safety

- **Always** use `createAiSafetyMiddleware()` for AI-powered API routes
- Configure appropriate rate limits per route
- Review PII redaction settings for your use case
- Content safety patterns are a baseline - add external moderation APIs for production

## Adding UI Components

Install shadcn/ui components into the shared `@workspace/ui` package:

```bash
npx shadcn@latest add card
npx shadcn@latest add form
```

Then import them from the shared package:

```tsx
import { Card } from "@workspace/ui/components/card"
```

See [docs/ai-safety.md](./ai-safety.md) for the full reference: each guardrail's defaults, configuration, and known limitations.

## See also

- [Getting Started](./getting-started.md) — local development setup
- [Architecture](./architecture.md) — monorepo layout and auth flow
- [AI Safety Guardrails](./ai-safety.md) — canonical reference for `@workspace/ai-safety`
- [Project Overview](./overview.md) — what the template is and who it's for
