#!/usr/bin/env bash
set -euo pipefail

# Downloads Node 22.x for darwin-arm64 and extracts the bin/node binary into
# apps/mac/SASApp/Bundled/node. Idempotent.

NODE_VERSION="${NODE_VERSION:-22.12.0}"
ARCH="arm64"
TARBALL="node-v${NODE_VERSION}-darwin-${ARCH}.tar.gz"
URL="https://nodejs.org/dist/v${NODE_VERSION}/${TARBALL}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAC_ROOT="$(dirname "$SCRIPT_DIR")"
CACHE_DIR="${MAC_ROOT}/.cache"
DEST_DIR="${MAC_ROOT}/SASApp/Bundled"
DEST_BINARY="${DEST_DIR}/node"

mkdir -p "$CACHE_DIR" "$DEST_DIR"

if [[ ! -f "${CACHE_DIR}/${TARBALL}" ]]; then
  echo ">>> Downloading $URL"
  curl -fsSL "$URL" -o "${CACHE_DIR}/${TARBALL}"
fi

echo ">>> Extracting node binary"
tar -xzf "${CACHE_DIR}/${TARBALL}" -C "$CACHE_DIR"
cp "${CACHE_DIR}/node-v${NODE_VERSION}-darwin-${ARCH}/bin/node" "$DEST_BINARY"
chmod +x "$DEST_BINARY"

echo ">>> Bundled node binary at: $DEST_BINARY"
"$DEST_BINARY" --version
