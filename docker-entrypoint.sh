#!/bin/sh
set -e

DATA_DIR=/app/data
ENV_FILE="$DATA_DIR/.env"
BOOTSTRAP_ENV="$DATA_DIR/.bootstrap.env"

mkdir -p "$DATA_DIR"

# Source saved credentials if they exist (written by the setup wizard).
# Otherwise, generate a one-shot bootstrap AUTH_SECRET so NextAuth can boot
# and serve the setup wizard. The wizard will overwrite this with a real
# secret on first successful setup.
if [ -f "$ENV_FILE" ]; then
  . "$ENV_FILE"
elif [ -f "$BOOTSTRAP_ENV" ]; then
  . "$BOOTSTRAP_ENV"
else
  BOOTSTRAP_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
  echo "export AUTH_SECRET=\"$BOOTSTRAP_SECRET\"" > "$BOOTSTRAP_ENV"
  chmod 600 "$BOOTSTRAP_ENV"
  . "$BOOTSTRAP_ENV"
fi

exec node apps/web/server.js
