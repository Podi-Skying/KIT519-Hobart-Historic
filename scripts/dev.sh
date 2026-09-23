#!/usr/bin/env bash
# Start the Vite dev server using the project-local Node.js in .tools/
# (falls back to a system Node.js if .tools/ is missing).
# Usage: ./scripts/dev.sh [extra vite args]
set -euo pipefail

cd "$(dirname "$0")/.."

if [ -x ".tools/node/bin/node" ]; then
  export PATH="$PWD/.tools/node/bin:$PATH"
fi

if [ ! -d node_modules ]; then
  npm install --no-fund --no-audit
fi

exec node node_modules/vite/bin/vite.js --port 5173 --strictPort "$@"
