# MiniApp Template

Build your own app. No coding experience required to get started.

## Get Running in 3 Steps

### Step 1: Install Docker Desktop (one-time)

Docker is a free app that runs your project in an isolated container.

| System      | Install Link                                                                                    |
| ----------- | ----------------------------------------------------------------------------------------------- |
| **Mac**     | [Download Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac-install/)         |
| **Windows** | [Download Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/) |
| **Linux**   | [Docker Desktop for Linux](https://docs.docker.com/desktop/install/linux/)                      |

Install it, open it, and wait for the whale icon to stop animating. That means Docker is ready.

### Step 2: Download This Project

**Option A — Click the green "Code" button** on GitHub, then **"Download ZIP"**. Unzip it anywhere.

**Option B — Clone with Git** (if you have it):

```bash
git clone https://github.com/sas-technology/sas-default-app.git
cd sas-default-app
```

### Step 3: Start the App

Open a terminal in the project folder and run:

```bash
./start.sh
```

> **Windows?** Open PowerShell in the folder and run: `docker compose up -d --build`

The first build takes a few minutes. After that, your browser opens to **<http://localhost:11000>** and the app walks you through setting up authentication.

That's it. You're running.

---

## Setting Up Authentication

When you first open the app, you'll see a setup screen. Choose one or both:

| Method           | What You Need                                                                                     | Best For                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **Google OAuth** | Client ID + Secret from [Google Cloud Console](https://console.cloud.google.com/apis/credentials) | Google Workspace schools — students sign in with their school Google account |
| **Email OTP**    | API key from [Resend](https://resend.com/api-keys)                                                | Any email address — users get a 6-digit code                                 |

Enter your credentials in the modal, click **Save and start**, and the app restarts with authentication live.

### Google OAuth Setup (recommended for schools)

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create an **OAuth 2.0 Client ID** (Web application)
3. Add this as an **Authorized redirect URI**: `http://localhost:11000/api/auth/callback/google`
4. Copy the **Client ID** and **Client Secret** into the app's setup modal

---

## Editing the Code (VS Code)

Want to customize the app? Open it in VS Code:

### Option A: Dev Container (recommended)

1. Install [VS Code](https://code.visualstudio.com/) and the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-remote.remote-containers)
2. Open the project folder in VS Code
3. When prompted, click **"Reopen in Container"**
4. VS Code builds a development environment with everything pre-installed
5. Open the terminal in VS Code and run:

   ```bash
   pnpm dev
   ```

6. Open **<http://localhost:11000>** — changes you make to the code appear instantly

### Option B: Local setup (if you prefer)

Requires [Node.js 22+](https://nodejs.org/) and pnpm:

```bash
corepack enable pnpm
pnpm install
cp apps/web/.env.local.example apps/web/.env.local
# Edit apps/web/.env.local with your credentials
pnpm dev
```

---

## Everyday Commands

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

## What's Inside

This template gives you a working app with:

- **Authentication** — Google sign-in and/or email one-time codes
- **Database** — SQLite, runs locally inside the container
- **AI Safety** — Rate limiting, content moderation, PII redaction (for AI features)
- **Accessibility** — APCA AAA 3.0 contrast checking, keyboard navigation, screen reader support
- **Dark mode** — Press `d` to toggle

### Project Layout

```text
apps/web/                 # Your app lives here
  app/
    (auth)/login/         # Login page (auto-configured)
    (dashboard)/          # Protected pages (require sign-in)
    api/                  # API routes
  lib/
    auth.ts               # Authentication config
    db/                   # Database schema + client

packages/
  ui/                     # Reusable UI components (buttons, dialogs, etc.)
  ai-safety/              # AI guardrails (use when adding AI features)
  accessibility/          # Accessibility utilities
```

### Adding a New Page

Create a file in `apps/web/app/(dashboard)/your-page/page.tsx`:

```tsx
import { requireAuth } from "@/lib/auth-guard"

export default async function YourPage() {
  const session = await requireAuth()
  return <div>Hello {session.user?.name}!</div>
}
```

Pages inside `(dashboard)/` automatically require sign-in.

### Adding UI Components

```bash
npx shadcn@latest add card
npx shadcn@latest add form
```

Then use them:

```tsx
import { Card } from "@workspace/ui/components/card"
```

---

## For Template Maintainers

<details>
<summary>Developer reference (click to expand)</summary>

### Tech Stack

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

### Scripts

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

### Environment Variables

| Variable               | Purpose                                             |
| ---------------------- | --------------------------------------------------- |
| `AUTH_SECRET`          | Session encryption (auto-generated by setup wizard) |
| `AUTH_URL`             | App URL (default: `http://localhost:11000`)         |
| `DATABASE_URL`         | SQLite path (default: `file:./dev.db`)              |
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID                              |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret                          |
| `RESEND_API_KEY`       | Resend API key for email OTP                        |
| `EMAIL_FROM`           | Sender email for OTP codes                          |

### Docker Architecture

- Multi-stage build: install → build → standalone runner
- Single volume (`app-data`) holds SQLite DB + saved credentials
- `docker-entrypoint.sh` sources `/app/data/.env` before starting
- Setup API writes credentials, then `process.exit(0)` triggers Docker restart
- `restart: unless-stopped` ensures automatic recovery

### Auth Provider Detection

Providers register conditionally based on env vars:

- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` → Google OAuth enabled
- `RESEND_API_KEY` → Email OTP enabled
- Neither → Onboarding modal shown at `/login`

The setup API (`/api/setup`) is locked once any provider is configured.

</details>

---

## Need Help?

- **Something broken?** Run `docker compose logs` to see what happened
- **Want to start over?** Run `docker compose down -v && ./start.sh`
- **Found a bug?** [Open an issue](https://github.com/sas-technology/sas-default-app/issues)
