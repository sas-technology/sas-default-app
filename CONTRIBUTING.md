# Contributing

Thanks for helping improve the MiniApp Template. This guide covers everything
you need to land a change — from cloning the repo to opening a pull request.

It is written for **contributors who edit the template itself** (internal team
and external community alike). If you only want to _use_ the template to build
an app, run `./start.sh` and follow the in-app setup — you don't need this
file.

## Getting Set Up

You need [Node.js 22+](https://nodejs.org/), [pnpm](https://pnpm.io/), and
[Docker Desktop](https://www.docker.com/products/docker-desktop/) (only if you
plan to test the container path).

```bash
git clone https://github.com/sas-technology/sas-default-app.git
cd sas-default-app
corepack enable pnpm
pnpm install
pnpm dev
```

The dev server runs at <http://localhost:11000>. For the full setup (env vars,
database, OAuth, Docker), see [`docs/getting-started.md`](docs/getting-started.md).

Two ways to run the app:

- **`pnpm dev`** — fast feedback for working on code. Direct Node, Turbopack
  HMR, no container overhead.
- **`./start.sh`** — same path teachers use. Builds the Docker image and starts
  the full container stack. Always run this once before opening a PR if your
  change touches Docker, env handling, startup, or migrations.

## Branch and Pull Request Workflow

1. **Branch off `main`** with a descriptive name:

   ```text
   feat/description     # new feature
   fix/description      # bug fix
   chore/description    # tooling, deps, refactor with no behaviour change
   docs/description     # documentation only
   test/description     # tests only
   ```

2. **Write commits using [Conventional Commits](https://www.conventionalcommits.org/).**
   Examples:

   ```text
   feat: add email OTP sign-in
   fix(auth): redirect loop when session cookie expires
   chore: bump drizzle-orm to 0.46
   docs: document AI safety middleware composition
   ```

3. **Open a PR against `main`.** Fill out the PR template — what, why, how to
   test, and the checklist. Link any related issue. Small PRs review faster
   than large ones; split if you can.

4. **Wait for CI to pass** and a maintainer to review. Address review comments
   in follow-up commits (don't force-push during review unless asked).

## Pre-Commit Checks

A Husky hook runs on every commit via [lint-staged](https://github.com/lint-staged/lint-staged).
It only touches files you actually staged, so it stays fast.

| What runs                                  | On                                  |
| ------------------------------------------ | ----------------------------------- |
| `eslint --fix`                             | `*.ts`, `*.tsx`, `*.js`, `*.mjs`    |
| `prettier --write`                         | all supported files                 |
| `markdownlint-cli2 --fix`                  | `*.md`                              |
| `secretlint`                               | every staged file                   |
| `tsc --noEmit` on related files            | `*.ts`, `*.tsx`                     |
| Vitest related tests                       | `*.ts`, `*.tsx`                     |
| `sort-package-json`                        | any `package.json`                  |

**Do not bypass the hook with `--no-verify`.** If it fails, fix the issue and
recommit. A failing hook usually means lint, a typo, or a leaked secret — all
of which CI will catch anyway, so bypassing only delays the fix.

## Quality Gates in CI

Every PR runs the workflows in [`.github/workflows/`](.github/workflows/). The
required checks are:

- **Typecheck** — `pnpm typecheck` (TypeScript strict mode, no `any`).
- **Lint** — `pnpm lint` (ESLint across all workspaces).
- **Format check** — `pnpm format:check` (Prettier, read-only).
- **Build** — `pnpm build` (catches runtime issues the type-checker misses).
- **Tests** — `pnpm test` (Vitest across all workspaces).
- **Coverage** — uploaded for each workspace; the `packages/ai-safety` package
  enforces a 70% threshold (lines, branches, functions, statements).
- **Lockfile freshness** — `pnpm install --frozen-lockfile` must succeed; the
  CI also verifies `pnpm-lock.yaml` matches `package.json`.
- **Secret scan** — `secretlint` over the diff to catch leaked credentials.
- **`sort-package-json`** — every `package.json` must be sorted.
- **Markdown lint** — `markdownlint-cli2` over all `*.md` files (config in
  [`.markdownlint-cli2.jsonc`](.markdownlint-cli2.jsonc)).

A separate **weekly security audit** workflow runs `pnpm audit` against the
lockfile and opens an issue if a CVE shows up. Dependabot proposes the bumps.

## Tests

- **Stack:** Vitest + Testing Library, jsdom for component tests.
- **Location:** co-located in `__tests__/` directories next to the source.
- **Cleanup:** always call `cleanup()` in `afterEach` — jsdom reuses the DOM
  between tests and stale nodes will make queries return the wrong element.
- **Queries:** prefer `getByRole`, `getByText`, `getByLabelText` over
  `getByTestId`. Tests should read like a user's interaction.
- **Run a single workspace:** `pnpm --filter web test` or
  `pnpm --filter @workspace/ai-safety test`.

## Changes to AI Safety

Anything that touches [`packages/ai-safety/`](packages/ai-safety/) must:

1. **Ship with tests.** Every guardrail (rate limiter, sanitizer, output
   filter, content safety, PII redactor, token budget, middleware pipeline)
   has a corresponding `__tests__` file. New behaviour gets a new test.
2. **Not drop coverage below the threshold.** The package enforces 70% line,
   branch, function, and statement coverage. Adding code without tests will
   fail CI.
3. **Document any new guardrail** in `docs/ai-safety.md` so reviewers and
   operators know what it does and how to configure it.

If a change weakens a safety property (e.g. raising a rate limit, relaxing
sanitization), call it out in the PR description and tag a maintainer.

## Documentation Changes

- All `*.md` files are linted via `markdownlint-cli2`. The pre-commit hook
  runs `--fix` for you; CI runs in read-only mode.
- Wrap prose at a comfortable width (the config disables `MD013` so soft
  wrapping is your call).
- When you add or change behaviour, update the most specific doc and add a
  **See also** section linking related docs. Cross-reference at least:
  - [`README.md`](README.md) — public landing, three-step quickstart.
  - [`docs/getting-started.md`](docs/getting-started.md) — full local setup.
  - [`docs/architecture.md`](docs/architecture.md) — how the pieces fit.
  - [`docs/coding-conventions.md`](docs/coding-conventions.md) — style + idioms.
  - [`AGENTS.md`](AGENTS.md) — AI-agent orientation.
  - [`CLAUDE.md`](CLAUDE.md) — Claude-specific notes (mirrors `AGENTS.md`).

## AI Coding Agents

If you use Claude Code, Cursor, Aider, Copilot Workspace, or another AI coding
agent, point it at [`AGENTS.md`](AGENTS.md) first. That file is the canonical
agent brief — repo layout, non-negotiables, common pitfalls, and the exact
commands an agent should run to verify its work. Keep it current as the repo
evolves; an out-of-date `AGENTS.md` produces out-of-date agents.

## Reporting Security Issues

**Please do not file public issues for security vulnerabilities.** Email the
maintainers at `security@sas-technology.example` (replace with the project's
actual security contact before publishing) with:

- A description of the issue and its impact.
- Steps to reproduce.
- The version, commit SHA, or deploy target affected.

We'll acknowledge within 72 hours and coordinate a fix and disclosure timeline.

## Reporting Other Issues

Use the [issue templates](https://github.com/sas-technology/sas-default-app/issues/new/choose):
**Bug Report**, **Feature Request**, or **Teacher Feedback**. Questions go in
[Discussions](https://github.com/sas-technology/sas-default-app/discussions).

## See Also

- [`AGENTS.md`](AGENTS.md) — orientation for AI coding agents.
- [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) — community expectations.
- [`docs/getting-started.md`](docs/getting-started.md) — local setup walkthrough.
- [`docs/architecture.md`](docs/architecture.md) — system-level design.
- [`docs/coding-conventions.md`](docs/coding-conventions.md) — code style.
