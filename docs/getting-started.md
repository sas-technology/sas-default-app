# Getting Started

This guide covers local development of the MiniApp Template without Docker. If
you only want to run the app, see the [README](../README.md) — it walks through
the Docker-based one-command setup at `http://localhost:11000`.

## Prerequisites

- **Node.js 22+** - Use [nvm](https://github.com/nvm-sh/nvm) and run `nvm install` in the project root
- **pnpm 9+** - Enable via `corepack enable pnpm`

## Using the Template

1. Click "Use this template" on GitHub (or clone directly)
2. Clone your new repository
3. Install dependencies:

```bash
pnpm install
```

## First-Time Setup

### Environment Variables

```bash
cp apps/web/.env.local.example apps/web/.env.local
```

Edit `apps/web/.env.local`:

```env
AUTH_SECRET=<generate with: openssl rand -base64 32>
AUTH_URL=http://localhost:11000
DATABASE_URL=file:./dev.db
```

The MiniApp Template uses SQLite (via libSQL/Drizzle). For local development
the database lives at `apps/web/dev.db`; inside the Docker container it lives
at `/app/data/app.db` on a persistent volume.

### Start Development

```bash
pnpm dev
```

Open [http://localhost:11000](http://localhost:11000).

## Renaming the Project

Update the `name` field in these files:

1. `package.json` (root) - change the package name to your project name
2. `apps/web/package.json` - change `web` to your app name
3. `apps/web/lib/constants.ts` - update `APP_NAME` and `APP_DESCRIPTION`

## Adding Your First shadcn Component

```bash
npx shadcn@latest add card
```

Then use it:

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@workspace/ui/components/card"
```

## Authentication

The template includes NextAuth with a placeholder Credentials provider. To connect your auth backend:

1. Edit `apps/web/lib/auth.ts`
2. Replace the `authorize` function with your actual authentication logic
3. The JWT session strategy means no database is required for sessions

## Deployment

### Vercel

1. Import the monorepo on [vercel.com](https://vercel.com)
2. Set the root directory to `apps/web`
3. Set build command: `cd ../.. && pnpm build --filter web`
4. Set the required environment variables (`AUTH_SECRET`, `AUTH_URL`)

### Environment Variables for Production

| Variable      | Description                                             |
| ------------- | ------------------------------------------------------- |
| `AUTH_SECRET` | Random secret for JWT signing (required)                |
| `AUTH_URL`    | Full URL of your app (e.g., `https://myapp.vercel.app`) |

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

## Adding a New Page

Create a file in `apps/web/app/(dashboard)/your-page/page.tsx`:

```tsx
import { requireAuth } from "@/lib/auth-guard"

export default async function YourPage() {
  const session = await requireAuth()
  return <div>Hello {session.user?.name}!</div>
}
```

Pages inside `(dashboard)/` automatically require sign-in.

## See also

- [Architecture](./architecture.md) — monorepo layout, auth flow, error boundary hierarchy
- [Coding Conventions](./coding-conventions.md) — file naming, server/client components, TypeScript rules
- [AI Safety Guardrails](./ai-safety.md) — rate limiting, prompt-injection defenses, PII redaction
- [Project Overview](./overview.md) — what the template is and who it's for
