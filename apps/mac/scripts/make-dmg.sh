#!/usr/bin/env bash
set -euo pipefail

APP_PATH="$1"
OUTPUT_DMG="$2"

rm -f "$OUTPUT_DMG"

create-dmg \
  --volname "SAS App" \
  --window-pos 200 120 \
  --window-size 600 400 \
  --icon-size 96 \
  --icon "$(basename "$APP_PATH")" 175 200 \
  --app-drop-link 425 200 \
  --no-internet-enable \
  "$OUTPUT_DMG" \
  "$APP_PATH"
