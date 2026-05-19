# SAS Default App — starter template

> A safe, ready-to-run starter for building your own classroom or team app. Drop the GitHub URL into your AI coding tool and start building.

---

## Start here — copy this into your AI tool

Paste the block below into Claude Code, Cursor, Windsurf, Aider, ChatGPT, or any other AI coding tool. It tells the AI exactly what to do, asks what you want to build, and pins the rules it must follow.

```text
Clone https://github.com/sas-technology/sas-default-app and help me build a new app on top of it.

Setup steps (do these first):
  1. git clone https://github.com/sas-technology/sas-default-app
  2. cd sas-default-app
  3. pnpm install
  4. Read AGENTS.md end-to-end — that is the canonical engineering reference for this codebase.
  5. Start the dev server with `pnpm dev` (it runs on http://localhost:11000).

Then ask me, one question at a time:
  - What does the app do, in one sentence?
  - Who are the users (teachers, students, parents, the public)?
  - Do I need sign-in? Google OAuth, email OTP, or both?
  - Will it use AI features? If so, what kind (chat, summarisation, tutoring, grading help, etc.)?
  - Anything sensitive in scope (PII, student records, grades, health data)?

After I answer, sketch a plan before writing code. Wait for me to approve it.

Rules you MUST follow (SAS AI safety guidelines):
  1. Wrap every AI route with `aiSafety()` from `@/lib/ai-safety`. Never call a model directly without it.
  2. No PII in prompts. Redact emails, names, and IDs before sending to a model — the middleware does this automatically when you use it.
  3. APCA AAA 3.0 contrast (not WCAG 2.x). Body Lc ≥ 90, large text Lc ≥ 75, non-text Lc ≥ 60. Use the helpers in `@workspace/accessibility/apca`.
  4. Server Components by default. Only add `"use client"` when you genuinely need hooks, browser APIs, or event handlers.
  5. No `any` types. Use `unknown` and narrow.
  6. No external tracking, telemetry, or analytics. Data stays on the user's machine unless I explicitly opt in.
  7. Don't bypass auth. Protected routes use `requireAuth()` or live under `app/(dashboard)/`.
  8. Never use `--no-verify` on commits. If a pre-commit hook fails, fix the underlying issue.
  9. Test what you build. Add Vitest tests for new logic and run `pnpm test` before declaring something done.
  10. Ask me before adding new dependencies — keep the install footprint small and review the licence + maintainer.
  11. Commit early and often, with conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`).
  12. If something is ambiguous, ask. Do not guess.

When you are done with each chunk of work, run `pnpm typecheck && pnpm test && pnpm lint` and show me the result before moving on.

Now ask me what I want to build.
```

That's it. Hand the prompt to your AI tool and answer its questions. The sections below are reference material you can ignore until later.

---

## What this is

A starter template, not a finished product. It comes with the boring-but-important parts already wired up — sign-in, AI safety guardrails, accessibility, a database, a packaging pipeline for a native Mac app — so you can focus on building whatever your students, teachers, or team actually need.

The intended workflow: clone the repo, open it in your AI coding tool of choice (Claude Code, Cursor, Windsurf, etc.) or your IDE, tell it what you want to build, and ship. When you're ready to put it in front of users, the same codebase packages as a native Mac app, deploys to Vercel/Netlify/Cloudflare, or self-hosts in Docker — whichever fits.

Full feature list, what it isn't, and the audit-relevant facts: [docs/overview.md](docs/overview.md).

---

## Get started

You need: [Node.js 22+](https://nodejs.org), [pnpm 9+](https://pnpm.io/installation), and your favourite editor or AI coding tool.

### Option A — let your AI tool do the work

Copy this URL:

```text
https://github.com/sas-technology/sas-default-app
```

Open Claude Code, Cursor, Windsurf, Aider, or whatever you use, and tell it:

> Clone <https://github.com/sas-technology/sas-default-app>, install dependencies with pnpm, start the dev server, and then help me [build the thing you want].

It will clone, install, and open the dev server at `http://localhost:11000`. From there, describe what you want and let it edit the code.

### Option B — do it yourself

```bash
git clone https://github.com/sas-technology/sas-default-app
cd sas-default-app
pnpm install
pnpm dev
```

Open `http://localhost:11000`.

### Option C — download a ZIP

1. Open [the repo on GitHub](https://github.com/sas-technology/sas-default-app)
2. Click **Code → Download ZIP**
3. Unzip, open the folder in your editor or AI tool, then `pnpm install && pnpm dev`

---

## Ship your customized app

When the app is ready for users, pick a target:

| Target               | When to use it                                                              | How                                                            |
| -------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **macOS app**        | Individual teachers, classrooms, evaluators — drag a `.dmg` to Applications | `./apps/mac/scripts/build.sh` → produces a `.dmg`              |
| **Docker**           | Self-hosting on a Linux server or VPS                                       | `./start.sh` (or `docker compose up -d --build`)               |
| **Vercel**           | Hosted, no-ops, scalable                                                    | [docs/deployment/vercel.md](docs/deployment/vercel.md)         |
| **Netlify**          | Same as Vercel, pick by preference                                          | [docs/deployment/netlify.md](docs/deployment/netlify.md)       |
| **Cloudflare**       | Edge performance, global                                                    | [docs/deployment/cloudflare.md](docs/deployment/cloudflare.md) |
| **Sheets companion** | Zero-infra, very simple use cases                                           | [apps/sheets/README.md](apps/sheets/README.md)                 |

Full comparison + decision matrix: [docs/deployment/](docs/deployment/).

---

## Built-in AI safety

Every AI feature you build on this template is protected by guardrails that run before each request reaches the model and after each response comes back.

- **Rate limits** — stop abuse and runaway costs
- **Prompt-injection protection** — sanitizes risky user input
- **PII redaction** — strips emails, phone numbers, and similar from prompts
- **Output filtering** — blocks unsafe model responses before users see them
- **Content moderation** — flags harmful categories
- **Token budgets** — cap spend per user or session

This matters most when your users are students or members of the public. The guardrails reduce the chance of a model leaking personal data, returning harmful content, or being tricked into ignoring its instructions.

Every guardrail, what it catches, what it doesn't catch, and how to configure it: [docs/ai-safety.md](docs/ai-safety.md).

---

## Set up sign-in

When you first open the app, the setup wizard asks you to configure sign-in. Choose one or both:

| Method           | What You Need                                                                                     | Best For                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **Google OAuth** | Client ID + Secret from [Google Cloud Console](https://console.cloud.google.com/apis/credentials) | Google Workspace schools — students sign in with their school Google account |
| **Email OTP**    | API key from [Resend](https://resend.com/api-keys)                                                | Any email address — users get a 6-digit code                                 |

Enter your credentials in the wizard, click **Save and start**, and the app restarts with sign-in live.

### Google OAuth setup (recommended for schools)

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create an **OAuth 2.0 Client ID** (Web application)
3. Add an **Authorized redirect URI** of the form `YOUR_AUTH_URL/api/auth/callback/google` — the setup wizard shows you the exact value to paste
4. Copy the **Client ID** and **Client Secret** into the wizard

---

## What else you get

- **Auth** — Google sign-in and email one-time codes
- **Accessibility** — APCA AAA 3.0 contrast, keyboard navigation, screen reader support
- **Database** — SQLite at `~/Library/Application Support/SASApp/app.db` on Mac, or `/app/data/app.db` inside Docker
- **Dark mode** — press `d` to toggle
- **Audit log** — every security-sensitive action is logged as JSON to stdout
- **Active monitoring** — `/api/health` endpoint, security response headers, and Docker `HEALTHCHECK` when containerized

---

## Everyday commands (development)

| What             | Command          |
| ---------------- | ---------------- |
| Start dev server | `pnpm dev`       |
| Run tests        | `pnpm test`      |
| Type check       | `pnpm typecheck` |
| Lint             | `pnpm lint`      |
| Format           | `pnpm format`    |
| Push DB schema   | `pnpm db:push`   |
| Open DB browser  | `pnpm db:studio` |

Filter to one workspace: `pnpm --filter sas-default-app-web <cmd>`. Dev server runs on `http://localhost:11000`.

### After you build & package as a Mac app

| What           | How                                                                             |
| -------------- | ------------------------------------------------------------------------------- |
| Start the app  | Open `SASApp.app` (auto-starts if Launch at Login is on)                        |
| Stop the app   | Menu bar icon → **Quit**                                                        |
| Restart server | Menu bar icon → **Restart Server**                                              |
| View logs      | Menu bar icon → **View Logs** (or `~/Library/Application Support/SASApp/logs/`) |
| Start fresh    | Quit, then delete `~/Library/Application Support/SASApp/`                       |

### Or if you run it in Docker

| What                    | Command                  |
| ----------------------- | ------------------------ |
| Start the app           | `./start.sh`             |
| Stop the app            | `docker compose down`    |
| View logs               | `docker compose logs`    |
| Start fresh (wipe data) | `docker compose down -v` |

---

## Need help?

- **Something broken on the Mac app?** Click the menu bar icon → **View Logs** to see what happened
- **Something broken in Docker?** Run `docker compose logs` to see what happened
- **Want to start over on the Mac?** Quit the app, then delete `~/Library/Application Support/SASApp/`
- **Want to start over in Docker?** Run `docker compose down -v && ./start.sh`
- **Found a bug?** [Open an issue](https://github.com/sas-technology/sas-default-app/issues)

---

## For developers

Built with Next.js 16, TypeScript, Drizzle/SQLite (or Turso for hosted), Tailwind v4, and pnpm workspaces. Monorepo with `apps/web` (the app), `apps/sheets` (optional companion), and `packages/ai-safety`, `packages/accessibility`, `packages/ui` (shared libraries).

- Overview (what this is + audit info) → [docs/overview.md](docs/overview.md)
- Set up your dev environment → [docs/getting-started.md](docs/getting-started.md)
- Architecture and tech stack → [docs/architecture.md](docs/architecture.md)
- Coding conventions → [docs/coding-conventions.md](docs/coding-conventions.md)
- AI safety reference → [docs/ai-safety.md](docs/ai-safety.md)
- All deployment guides → [docs/deployment/](docs/deployment/)
- AI coding agents → [AGENTS.md](AGENTS.md)
