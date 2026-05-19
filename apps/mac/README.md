# SASApp (macOS)

A native menu-bar app that bundles Node.js and the Next.js server. Users install
by dragging `SASApp.app` to Applications — no Docker, no Terminal, no
prerequisites.

## Architecture

`apps/mac/` contains a Swift/SwiftUI app built with **XcodeGen** + **xcodebuild**.

- **`SASAppApp.swift`** — `@main`, sets up `MenuBarExtra`, owns `ServerManager`.
- **`ServerManager.swift`** — Spawns and monitors a node process running the
  bundled Next.js standalone build. Polls `/api/health` and publishes status.
- **`MenuView.swift`** — SwiftUI menu items (Open / Restart / Logs / Launch at
  Login / Quit).
- **`FirstRunSetup.swift`** — Creates the data directory, generates
  `AUTH_SECRET`, shows the one-time setup token in a modal.
- **`LaunchAgent.swift`** — Installs/uninstalls a `~/Library/LaunchAgents/` plist
  for auto-start on login.
- **`Logger.swift`** — Rotating log writer for node stdout/stderr.
- **`DataPaths.swift`** — Resolves `~/Library/Application Support/SASApp/` paths.

## Building locally

Install build tools (once):

```bash
brew install xcodegen create-dmg
```

Then:

```bash
./apps/mac/scripts/build.sh
```

This produces `apps/mac/dist/SASApp-YYYY.MM.DD.dmg`.

The build does:

1. `pnpm --filter sas-default-app-web build` (Next.js standalone)
2. `fetch-node.sh` (Node.js binary download)
3. Stages `node` + `standalone/` into `apps/mac/SASApp/Bundled/`
4. `xcodegen generate` (regenerate `.xcodeproj`)
5. `xcodebuild` (build `SASApp.app`)
6. `create-dmg` (package `.dmg`)

## Running tests

```bash
cd apps/mac
xcodegen generate
xcodebuild -project SASApp.xcodeproj -scheme SASApp -destination 'platform=macOS' test
```

## Data location

`~/Library/Application Support/SASApp/`

- `app.db` — SQLite database
- `.env` — `AUTH_SECRET` and runtime config
- `.setup-token` — One-time setup token (consumed by `/api/setup`)
- `logs/server.log` — Node stdout/stderr (rotates at 5 MB, keeps 7 backups)

## Distribution

v1 ships ad-hoc signed. First-launch shows a Gatekeeper warning; users
right-click → Open to bypass once.

v2 will add Developer ID signing + Apple notarization (deferred).
