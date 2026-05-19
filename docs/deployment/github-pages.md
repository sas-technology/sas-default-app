# GitHub Pages (docs hosting)

Publish the contents of `docs/` to a free, public docs site at
`https://<your-org>.github.io/<your-repo>/`.

This is the simplest deployment target in this template: zero servers,
zero cost, zero secrets. It is also the most limited — Pages is static
hosting, so the application itself (auth, API routes, AI safety
middleware, server actions) does **not** run there.

## What this does

- Takes the markdown files in `docs/`
- Builds them with [Jekyll](https://jekyllrb.com/) and the
  [just-the-docs](https://just-the-docs.com/) theme
- Publishes the result to GitHub Pages on every push to `main` that
  touches `docs/`, `README.md`, or the workflow itself

The README is copied in as the landing page (`/`), and each markdown
file under `docs/` becomes a browsable page with built-in search.

## Prerequisites

- A GitHub repository hosting this code
- Repository **Settings → Pages** with the source set to **"GitHub
  Actions"** (not "Deploy from a branch")
- The workflow file `.github/workflows/docs-pages.yml` (already in this
  repo)

## One-time setup

1. Push this branch to GitHub.
2. In the repo's **Settings → Pages**, set **Source** to **GitHub
   Actions**. No further configuration is needed — the workflow handles
   building and publishing.
3. Trigger the first run by either:
   - Pushing a change under `docs/` to `main`, or
   - Running the workflow manually from the **Actions** tab
     ("Deploy docs to GitHub Pages" → "Run workflow").

Once the workflow finishes, the docs site will be live at
`https://<your-org>.github.io/<your-repo>/`. The exact URL is shown in
the workflow run summary and in **Settings → Pages**.

## Updating the docs

Just edit any file under `docs/` (or the root `README.md`) and push to
`main`. The workflow detects the change and republishes automatically.

Local preview (optional):

```bash
cd docs-site
bundle install              # one-time
mkdir -p site
cp -r ../docs/* site/
cp ../README.md site/index.md
bundle exec jekyll serve -s site
# open http://127.0.0.1:4000
```

## What does NOT work on GitHub Pages

GitHub Pages serves **static files only**. The following parts of this
template cannot run there:

- The Next.js application (`apps/web/`) — needs a Node.js runtime
- NextAuth login / sessions — needs server routes
- API routes under `/api/*` — needs a server
- AI safety middleware, rate limiting, server actions — all server-side
- Database connections, environment secrets at request time

For the full app, deploy to a host that runs Node.js:

- **Vercel** — recommended, zero-config (see `docs/deployment/vercel.md`)
- **Docker** — anywhere that runs containers (see the repo's
  `Dockerfile` and `docker-compose.yml`)
- **Netlify / Cloudflare Pages** — with their Next.js runtime adapters
- **Self-hosted Node** — `pnpm build && pnpm --filter web start`

## When to use GitHub Pages anyway

GitHub Pages is a great fit for:

- **Project documentation** (what this workflow does)
- **A static marketing or landing page** — if you build a separate
  `apps/landing/` workspace with `next export` or plain HTML, you can
  publish it the same way
- **Status pages, changelogs, design docs** — anything that's just
  files

Pair it with one of the dynamic hosts above for the real app, and use
Pages for everything that doesn't need a server.

## Costs

GitHub Pages is free for public repositories. For private repos it
requires a paid GitHub plan (Pro / Team / Enterprise). There are soft
limits (100 GB/month bandwidth, 1 GB site size, 10 builds/hour) which
are far above what a docs site needs.

## Troubleshooting

- **"Pages site not found"** — the workflow ran but Pages isn't enabled
  in repo settings. Enable it under **Settings → Pages** with source
  **GitHub Actions**.
- **404 on assets / wrong paths** — if you fork to a different
  org/repo, the site still works because `baseurl` is empty and Jekyll
  uses relative links. If you set a custom `baseurl` in
  `docs-site/_config.yml`, make sure links account for it.
- **Jekyll build fails** — most often a malformed front-matter block in
  a markdown file. The workflow log shows the offending file and line.
- **Old content still showing** — Pages caches aggressively; hard-
  refresh the page (Cmd/Ctrl-Shift-R) and wait a minute after the
  workflow completes.
