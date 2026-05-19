# MiniApp Template

> A safe, ready-to-run app you can install on any computer.

## What this is

This is a self-hosted starter app with sign-in, AI safety guardrails, and accessibility built in. It's designed for schools, small teams, and evaluators who want a working app they can run on their own machine — not a service to sign up for, and not a half-finished example. Install it, open a browser, and it works.

Out of the box you get a sign-in screen, a protected dashboard, AI safety guardrails for any AI features you add, a dark mode, and a local SQLite database — all running inside Docker on your own computer. No cloud account required, no data leaving your machine.

Full breakdown of features, what it isn't, and the audit-relevant facts: [docs/overview.md](docs/overview.md).

---

## Run it in 3 steps

### Step 1: Install Docker Desktop (one-time)

Docker is a free app that runs your project in an isolated container.

| System      | Install Link                                                                                    |
| ----------- | ----------------------------------------------------------------------------------------------- |
| **Mac**     | [Download Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac-install/)         |
| **Windows** | [Download Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/) |
| **Linux**   | [Docker Desktop for Linux](https://docs.docker.com/desktop/install/linux/)                      |

Install it, open it, and wait for the whale icon to stop animating. That means Docker is ready.

### Step 2: Download this project

**Option A — Click the green "Code" button** on GitHub, then **"Download ZIP"**. Unzip it anywhere.

**Option B — Clone with Git** (if you have it):

```bash
git clone https://github.com/sas-technology/sas-default-app.git
cd sas-default-app
```

### Step 3: Start the app

Open a terminal in the project folder and run:

```bash
./start.sh
```

> **Windows?** Open PowerShell in the folder and run: `docker compose up -d --build`

The first build takes a few minutes. After that, your browser opens to **<http://localhost:11000>** and the setup wizard walks you through the rest.

> **First-run setup token.** The setup wizard is locked behind a one-time token. To find it, run `docker compose logs web` in the project folder — the token is printed near the top of the log. Paste it into the wizard to unlock setup.

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
- **Database** — SQLite, lives inside the container
- **Dark mode** — press `d` to toggle
- **Audit log** — every security-sensitive action is logged as JSON to stdout
- **Active monitoring** — `/api/health` endpoint, Docker `HEALTHCHECK`, and security response headers

---

## Deploy somewhere else

Docker on your own machine is the default, but the same app runs in other places too.

- **Local Docker** — what the quick-start above does. Best for try-it-out and self-hosting.
- **Vercel** — [docs/deployment/vercel.md](docs/deployment/vercel.md)
- **Netlify** — [docs/deployment/netlify.md](docs/deployment/netlify.md)
- **Cloudflare Workers** — [docs/deployment/cloudflare.md](docs/deployment/cloudflare.md)
- **GitHub Pages (docs only)** — [docs/deployment/github-pages.md](docs/deployment/github-pages.md)
- **Google Apps Script + Sheets companion** — [apps/sheets/README.md](apps/sheets/README.md) — a zero-infrastructure alternative for very simple use cases

---

## Everyday commands

| What                      | Command                  |
| ------------------------- | ------------------------ |
| Start the app (Docker)    | `./start.sh`             |
| Stop the app              | `docker compose down`    |
| View logs                 | `docker compose logs`    |
| Start fresh (wipe data)   | `docker compose down -v` |
| Start dev server (coding) | `pnpm dev`               |
| Run tests                 | `pnpm test`              |
| Check for errors          | `pnpm typecheck`         |

---

## Need help?

- **Something broken?** Run `docker compose logs` to see what happened
- **Want to start over?** Run `docker compose down -v && ./start.sh`
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
