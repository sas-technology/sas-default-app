# macOS native app — design

**Date:** 2026-05-19
**Status:** Approved
**Author:** Bryan Fawcett (with Claude)

## Problem

Docker is the current primary deployment path. For technical users running on
servers or in CI, it works well. For the target audience — teachers, school
administrators, and other non-technical people — Docker Desktop is a barrier:
it's a separate install, asks for system permissions, takes memory even when
idle, and presents a developer-oriented UI. After installing it, users still
need to open a Terminal and run `./start.sh`.

The user has decided the local macOS experience should be the primary
deployment target, not Docker. The expectation is software that behaves like a
real Mac app: a `.dmg` you download, a `.app` you drag to Applications, a
menu-bar icon that shows status, and zero prerequisites.

## Goals

- A user with no developer tools installed (no Homebrew, no Node, no Docker,
  no Terminal) can install the app by downloading a `.dmg`, dragging the
  `.app` to `/Applications`, and double-clicking it.
- The app appears in the menu bar with a clear running/stopped status, opens
  the browser to the running server on launch, and persists across logins
  via an opt-in LaunchAgent.
- Existing Docker support is retained for server / cloud deployments. README
  leads with the Mac app; Docker becomes a secondary "for production
  servers" option.
- The Next.js application itself does not change. The mac app is a wrapper
  around the `apps/web` standalone build.

## Non-goals

- Windows or Linux native packaging (Docker remains the cross-platform
  option).
- Automatic updates via Sparkle — defer to v2.
- App Store submission — defer (different signing + sandbox requirements).
- Replacing the existing `/api/setup` wizard — the Mac app uses it as-is.
- Embedded browser (WKWebView) inside the app — out of scope; the system
  default browser is used.

## Approach

A native Swift menu-bar app at `apps/mac/`, built with SwiftUI's
`MenuBarExtra` (macOS 13 Ventura+). The app bundles a Node.js binary and the
Next.js `standalone` build output inside its `Contents/Resources/` directory.
On launch the app spawns the bundled Node process, polls `/api/health`, opens
the default browser, and tracks server state with a colored menu-bar icon.

Alternatives considered:

- **Electron wrapper.** Cross-platform but ~150 MB bundle, JS-based runtime,
  and overlaps responsibilities with the Next.js app it would be embedding.
  Rejected — too heavy for the benefit, and we already have a working web
  app.
- **Platypus-wrapped shell script.** Trivial to build but limited menu-bar
  control, no clean way to track server state, and not extensible. Rejected.
- **`brew install` formula.** Easiest to maintain but still requires the
  user to open a Terminal. Useful as a secondary distribution channel later,
  but not the primary UX. Deferred.

## Design

### Files and structure

```text
apps/mac/                          NEW
├── SASApp.xcodeproj/              Xcode project
├── SASApp/
│   ├── SASAppApp.swift            @main entry, MenuBarExtra scene
│   ├── ServerManager.swift        Spawn/kill node Process; health-check loop
│   ├── MenuView.swift             SwiftUI menu (Open / Status / Restart / Logs / Launch-at-Login / Quit)
│   ├── FirstRunSetup.swift        Creates data dir, generates AUTH_SECRET, writes setup token
│   ├── LaunchAgent.swift          Install/uninstall the auto-start plist
│   ├── DataPaths.swift            Resolves ~/Library/Application Support/SASApp/ paths
│   ├── Logger.swift               Streams node stdout/stderr to a rotating log file
│   ├── Resources/
│   │   ├── MenuBarIconActive.svg  Green dot (server up)
│   │   ├── MenuBarIconIdle.svg    Gray dot (server stopped)
│   │   ├── MenuBarIconError.svg   Red dot (server crashed)
│   │   └── Info.plist             LSUIElement=YES, bundle id, version
│   └── Bundled/                   (created by build script, gitignored)
│       ├── node                   Bundled Node.js 22 binary (~35 MB)
│       └── standalone/            Built Next.js standalone output
├── scripts/
│   ├── build.sh                   End-to-end: pnpm build → bundle → xcodebuild → .dmg
│   ├── fetch-node.sh              Download and extract Node.js 22 for darwin-arm64 + darwin-x64
│   ├── notarize.sh                Optional: xcrun notarytool for Apple notarization (v2+)
│   └── make-dmg.sh                create-dmg invocation with template settings
└── README.md                      Build instructions and architecture overview
```

### Data layout on the user's Mac

```text
~/Library/Application Support/SASApp/
├── app.db                         SQLite database (libSQL)
├── .env                           AUTH_SECRET + AUTH_URL + (later) credentials
├── .setup-token                   One-time setup token (consumed at /api/setup)
└── logs/
    ├── server.log                 Node stdout/stderr (rotated daily)
    └── server.log.1               Previous day
```

The `apps/web` server reads from this directory via `DATABASE_URL` and
`AUTH_URL` env vars set by `ServerManager` when it spawns the node process.

### Component responsibilities

**`SASAppApp.swift`** — App entry. Sets up `MenuBarExtra` with the menu view.
Holds the shared `ServerManager` instance. Hides the Dock icon
(`LSUIElement=YES`). On launch: calls `FirstRunSetup.runIfNeeded()`,
`ServerManager.start()`, then `NSWorkspace.shared.open(AUTH_URL)` once the
health check passes.

**`ServerManager.swift`** — Manages the node process lifecycle:
- `start()`: spawn `Bundled/node Bundled/standalone/apps/web/server.js` with
  env vars `DATABASE_URL=file:<data>/app.db`, `AUTH_URL=http://localhost:11000`,
  `AUTH_SECRET=<from .env>`, `SETUP_TOKEN_PATH=<data>/.setup-token`, `PORT=11000`.
- `stop()`: send SIGTERM, then SIGKILL after 5 s timeout.
- `restart()`: stop + start.
- Health-check loop: every 2 s, GET `/api/health`; updates `@Published var status: ServerStatus { .stopped, .starting, .running, .error }`.
- Streams stdout/stderr through `Logger`.

**`MenuView.swift`** — SwiftUI menu rendered from `MenuBarExtra`:
- **Status indicator**: "● Server running" (green) / "● Stopped" (gray) / "● Error" (red, with reason).
- **Open App** → `NSWorkspace.shared.open(URL("http://localhost:11000"))`.
- **Restart Server** → `serverManager.restart()`.
- **Open Data Folder** → `NSWorkspace.shared.open(dataPath)`.
- **View Logs** → opens latest `server.log` in Console.app.
- **☐ Launch at Login** → toggle calls `LaunchAgent.install/uninstall`.
- **Quit** → `serverManager.stop()` then `NSApp.terminate()`.

**`FirstRunSetup.swift`** — On first launch (when `~/Library/Application
Support/SASApp/` doesn't exist):
1. Create the data directory.
2. Generate `AUTH_SECRET = openssl rand -base64 32` equivalent (Swift
   `SecRandomCopyBytes`).
3. Write `.env` with `AUTH_SECRET`, `AUTH_URL=http://localhost:11000`,
   `DATABASE_URL=file:<data>/app.db`.
4. Generate a 32-byte hex `.setup-token` and show it in a modal alert with
   "Copy to Clipboard" — same security flow as Docker's setup-token-on-boot.
5. Trigger drizzle migration once: spawn
   `node Bundled/standalone/apps/web/drizzle-kit-runner.js` (a small wrapper
   shipped in the build that runs `drizzle-kit push --force` against the
   data DB).

**`LaunchAgent.swift`** — Manages `~/Library/LaunchAgents/com.sas-technology.sas-app.plist`:
- `install()`: write the plist with `ProgramArguments = ["/Applications/SASApp.app/Contents/MacOS/SASApp"]`, `RunAtLoad=true`, `KeepAlive=false` (the user can quit explicitly). Then `launchctl load`.
- `uninstall()`: `launchctl unload` + delete plist.
- `isInstalled()`: file exists check.

**`DataPaths.swift`** — Resolves `FileManager.default.url(for: .applicationSupportDirectory, ...).appendingPathComponent("SASApp")`. Exposes `dataDir`, `dbPath`, `envPath`, `setupTokenPath`, `logsDir`.

**`Logger.swift`** — Daily-rotating log writer at `<dataDir>/logs/server.log`. Pipes node stdout/stderr into the file. Keeps last 7 days.

### Build pipeline

`apps/mac/scripts/build.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

# 1. Build the Next.js standalone output
pnpm --filter sas-default-app-web build

# 2. Fetch the Node.js binary (idempotent — skips if already present)
./apps/mac/scripts/fetch-node.sh

# 3. Stage the bundled resources
rm -rf apps/mac/SASApp/Bundled
mkdir -p apps/mac/SASApp/Bundled
cp -r apps/web/.next/standalone apps/mac/SASApp/Bundled/
cp -r apps/web/.next/static apps/mac/SASApp/Bundled/standalone/apps/web/.next/
cp -r apps/web/public apps/mac/SASApp/Bundled/standalone/apps/web/ 2>/dev/null || true

# 4. Build the .app with Xcode
cd apps/mac
xcodebuild -project SASApp.xcodeproj -scheme SASApp \
  -configuration Release \
  -derivedDataPath build/ \
  CODE_SIGN_IDENTITY="-" \
  CODE_SIGN_ENTITLEMENTS="SASApp/SASApp.entitlements" \
  build

# 5. Package as .dmg
./scripts/make-dmg.sh build/Build/Products/Release/SASApp.app dist/SASApp-$(date +%Y.%m.%d).dmg
```

`fetch-node.sh` downloads `node-v22.x.x-darwin-arm64.tar.gz` and
`node-v22.x.x-darwin-x64.tar.gz`, extracts the `bin/node` binary, and lipo's
them into a universal binary at `apps/mac/SASApp/Bundled/node`.

### Distribution

For v1: ad-hoc signed (`CODE_SIGN_IDENTITY="-"`). Users see Gatekeeper's
"unidentified developer" warning on first launch and must right-click → Open.
The README clearly explains this and provides a screenshot.

For v2 (deferred): Apple Developer ID Application certificate + notarization
via `xcrun notarytool`. This removes the Gatekeeper warning.

### CI build

A new GitHub Actions workflow at `.github/workflows/mac-build.yml` builds the
`.dmg` on every push to `main` and uploads it to the GitHub Release when a
git tag matching `v*` is pushed. Uses `macos-latest` runners.

### README repositioning

The current README leads with the Docker `./start.sh` flow. After this work:

```markdown
# SAS Default App

## Install on your Mac (recommended)
1. Download SASApp.dmg from Releases
2. Drag SASApp.app to /Applications
3. Right-click → Open the first time
4. The menu bar icon means it's running; your browser opens automatically

## Run as a server (Docker)
For production / cloud deployments. See docs/deployment/.
```

`start.sh` and Docker stay exactly as they are. The README simply puts Mac
first.

## Implementation phases (parallelizable)

Each phase is mostly independent of the others (except phase 1, which must
land first because it creates the Xcode project). Phases 2–7 are independent
and can run in parallel worktrees.

1. **Foundation** — `apps/mac/` Xcode project, `SASAppApp.swift` skeleton,
   `Info.plist` with `LSUIElement=YES`, `DataPaths.swift`. Builds an empty
   menu-bar icon that does nothing yet.
2. **ServerManager** — process spawn, lifecycle, health-check loop, status
   publishing. Includes unit tests against a stubbed `Process`.
3. **MenuView** — SwiftUI menu with all actions. Wired to ServerManager.
4. **FirstRunSetup** — data dir creation, AUTH_SECRET generation, setup
   token modal, drizzle migration trigger.
5. **LaunchAgent** — install/uninstall plist with launchctl.
6. **Logger** — daily-rotating log writer with retention.
7. **Resources** — menu bar SVG icons (active/idle/error), `.entitlements`.
8. **Build scripts** — `build.sh`, `fetch-node.sh`, `make-dmg.sh`.
9. **CI workflow** — `.github/workflows/mac-build.yml` for tagged releases.
10. **Docs + README** — README updates, `apps/mac/README.md`, deployment doc
    cross-references.

## Risks

- **Node binary licensing**: Node.js is MIT-licensed and bundling is
  explicitly permitted, but the `.app` should ship the Node LICENSE inside
  `Contents/Resources/`.
- **macOS version floor**: `MenuBarExtra` is macOS 13+. Bundle a clear
  message if the user is on older macOS. (`LSMinimumSystemVersion = 13.0`.)
- **Gatekeeper UX**: First-launch right-click → Open is annoying and is a
  common confusion point. README + a short GIF in the repo helps.
- **Port 11000 already in use**: If another process is on 11000, the server
  fails to start. ServerManager surfaces this in the menu bar with a
  clear error message and an "Open Logs" affordance.
- **Universal binary size**: Lipo'd arm64+x64 node binary roughly doubles
  the size. We can ship arm64-only first (Apple Silicon dominates new Macs)
  and add x64 later, or ship universal from v1.

## Open decisions (defaults chosen; user can override)

- **Universal binary or arm64-only**: arm64-only for v1 (smaller .dmg).
- **macOS minimum version**: 13.0 (Ventura), released Oct 2022.
- **Bundle ID**: `com.sas-technology.sas-app`.
- **App name in Finder**: `SASApp`.

## Success criteria

- A user with no developer tools installed can install the app from the
  `.dmg`, launch it, and reach the working app at `localhost:11000` in
  under 60 seconds end-to-end.
- The menu bar icon accurately reflects server status within 2 seconds of
  state changes.
- Quitting the app cleanly terminates the node child process (no orphans).
- "Launch at Login" persists across reboots.
- The data directory (`~/Library/Application Support/SASApp/`) is
  preserved across app updates.
