# Deployment

This template can be deployed in several ways. Pick the one that
matches your team's constraints — hosting cost, infra familiarity,
whether you need a real server, etc.

## Full application (server required)

These targets run the Next.js app with auth, API routes, and AI safety
middleware. Pick one:

- **Vercel** — zero-config Next.js host, recommended for most teams
  (see `vercel.md` when added).
- **Netlify** — works with the Next.js runtime adapter
  (see `netlify.md` when added).
- **Cloudflare Pages / Workers** — edge-first deployment via the
  Next-on-Pages adapter (see `cloudflare.md` when added).
- **Docker** — portable, self-hostable container. See the repo root
  `Dockerfile`, `docker-compose.yml`, and `start.sh`. Deploy to any
  container host (Fly.io, Railway, AWS ECS, GKE, your own VM, etc.).

All of these need at least:

- A `NEXTAUTH_SECRET` environment variable
- A real auth backend wired into `apps/web/lib/auth.ts` (the template
  ships a placeholder)
- Whatever app-specific env vars you add over time

## Static portions only

- **[GitHub Pages](./github-pages.md)** — publish the contents of
  `docs/` as a browsable, searchable documentation site at
  `https://<your-org>.github.io/<your-repo>/`. Free for public repos,
  zero servers, zero secrets. The full app does **not** run on Pages;
  use this alongside one of the dynamic hosts above for the docs.

## What to pick

| Need                                | Use                              |
| ----------------------------------- | -------------------------------- |
| Ship the full app fast              | Vercel                           |
| Self-host on your own infra         | Docker                           |
| Edge / global low-latency           | Cloudflare                       |
| Just publish the docs               | GitHub Pages                     |
| Static marketing page only          | GitHub Pages (separate workspace) |

The GitHub Pages workflow is independent — you can enable it in
addition to any of the dynamic deployments without conflict.
