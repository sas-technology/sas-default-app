# Contributing

Thanks for your interest in contributing to the MiniApp Template. This guide is for **template maintainers and developers** who want to improve the template itself.

If you're a teacher using the template to build an app, you don't need this file. Just run `./start.sh` and start building.

## Getting Started

```bash
git clone https://github.com/sas-technology/sas-default-app.git
cd sas-default-app
corepack enable pnpm
pnpm install
cp apps/web/.env.local.example apps/web/.env.local
pnpm dev
```

The app runs at <http://localhost:11000>.

## Development Workflow

### Branch Naming

```text
feat/description     # New feature
fix/description      # Bug fix
chore/description    # Maintenance, deps, tooling
docs/description     # Documentation only
```

### Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```text
feat: add user profile page
fix: OTP verification redirect loop
chore: update drizzle-orm to v0.46
docs: add VS Code setup instructions
test: add login page integration tests
```

### Before Submitting a PR

Run the full check suite:

```bash
pnpm typecheck      # TypeScript
pnpm lint           # ESLint
pnpm format:check   # Prettier
pnpm test           # Vitest
pnpm build          # Full build (catches runtime issues)
```

All checks must pass. The pre-commit hook runs lint + format automatically, but `typecheck`, `test`, and `build` are your responsibility before pushing.

### Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Run the full check suite (above)
4. Push and open a PR against `main`
5. Fill out the PR template
6. Wait for CI to pass and a maintainer to review

## Architecture Guidelines

Read [AGENTS.md](AGENTS.md) for the full architecture context. The key principles:

### The Teacher Test

Before adding or changing anything, ask: **"Would a non-technical teacher understand this?"**

- If a feature needs configuration, build a UI for it. Don't add env vars and document them.
- If a flow has more than 3 steps, simplify it.
- If you're adding a dependency, justify it. Every dependency is complexity a teacher might encounter.

### What Lives Where

| Directory                   | Purpose                        | Who Changes It            |
| --------------------------- | ------------------------------ | ------------------------- |
| `apps/web/app/(dashboard)/` | App pages and features         | Everyone                  |
| `apps/web/app/(auth)/`      | Auth flow (login, onboarding)  | Template maintainers      |
| `apps/web/app/api/`         | API routes                     | Template maintainers      |
| `apps/web/lib/`             | Core infrastructure (auth, db) | Template maintainers only |
| `packages/ui/`              | Shared UI components           | Template maintainers      |
| `packages/ai-safety/`       | AI safety middleware           | Template maintainers      |
| `packages/accessibility/`   | Accessibility utilities        | Template maintainers      |

### Non-Negotiables

- **Docker must work.** Every change must build and run in the Docker container.
- **Zero-config for teachers.** No manual env file editing. Use the setup wizard pattern.
- **Accessibility.** All UI meets APCA AAA 3.0 contrast. Keyboard and screen reader support.
- **No secrets in code.** Ever.
- **No `any` types.** Use `unknown` and narrow.

## Adding a shadcn Component

```bash
npx shadcn@latest add <component-name>
```

Components install to `packages/ui/src/components/`. They're automatically available via `@workspace/ui/components/<name>`.

## Adding a Database Table

1. Add the table to `apps/web/lib/db/schema.ts`
2. Run `pnpm --filter web db:push` to apply
3. Export from `apps/web/lib/db/index.ts` if needed

## Testing

Tests use Vitest + Testing Library. Place test files in `__tests__/` directories alongside the source.

```bash
pnpm test                          # All tests
pnpm --filter web test:watch       # Watch mode for web app
```

Prefer accessible queries (`getByRole`, `getByText`) over test IDs. Always call `cleanup()` in `afterEach`.

## Reporting Issues

Use the [issue templates](https://github.com/sas-technology/sas-default-app/issues/new/choose) on GitHub. Choose the right template:

- **Bug Report** — Something is broken
- **Feature Request** — You want something new
- **Teacher Feedback** — Feedback from a teacher using the template

## Questions?

Open a [Discussion](https://github.com/sas-technology/sas-default-app/discussions) on GitHub.
