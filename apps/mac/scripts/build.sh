#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAC_ROOT="$(dirname "$SCRIPT_DIR")"
REPO_ROOT="$(cd "$MAC_ROOT/../.." && pwd)"
DIST_DIR="${MAC_ROOT}/dist"

echo "==> Building Next.js standalone output"
cd "$REPO_ROOT"
pnpm --filter sas-default-app-web build

echo "==> Fetching Node.js binary"
"${SCRIPT_DIR}/fetch-node.sh"

echo "==> Staging bundled resources"
BUNDLED="${MAC_ROOT}/SASApp/Bundled"
rm -rf "${BUNDLED}/standalone"
# Use rsync instead of `cp -r` because pnpm's standalone output contains
# broken symlinks under node_modules/.pnpm/node_modules/ that make `cp -r`
# fail. rsync -a preserves symlinks as-is without trying to follow them.
rsync -a "${REPO_ROOT}/apps/web/.next/standalone/" "${BUNDLED}/standalone/"
mkdir -p "${BUNDLED}/standalone/apps/web/.next"
rsync -a "${REPO_ROOT}/apps/web/.next/static/" "${BUNDLED}/standalone/apps/web/.next/static/"
if [[ -d "${REPO_ROOT}/apps/web/public" ]]; then
  rsync -a "${REPO_ROOT}/apps/web/public/" "${BUNDLED}/standalone/apps/web/public/"
fi

echo "==> Regenerating Xcode project"
cd "$MAC_ROOT"
xcodegen generate

echo "==> Building SASApp.app (Release)"
xcodebuild -project SASApp.xcodeproj -scheme SASApp \
  -configuration Release \
  -derivedDataPath build \
  CODE_SIGN_IDENTITY="-" \
  build

APP_PATH="${MAC_ROOT}/build/Build/Products/Release/SASApp.app"
[[ -d "$APP_PATH" ]] || { echo "ERROR: $APP_PATH not found"; exit 1; }

echo "==> Packaging .dmg"
mkdir -p "$DIST_DIR"
DMG="${DIST_DIR}/SASApp-$(date +%Y.%m.%d).dmg"
"${SCRIPT_DIR}/make-dmg.sh" "$APP_PATH" "$DMG"

echo "==> Done: $DMG"
