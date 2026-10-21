#!/usr/bin/env bash
# Websec Decompiled instant launcher.
# Serves the pre-built offline portal in the background (via systemd user service
# or a silent background process) and opens it immediately in your browser—no
# terminal window required.
set -euo pipefail

cd "$(dirname "$(readlink -f "$0")")"

PORT="${PORT:-5173}"
BASE="http://127.0.0.1:${PORT}"

open_browser() {
  [ "${NO_OPEN:-0}" = "1" ] && return 0
  if command -v xdg-open >/dev/null 2>&1; then
    nohup xdg-open "${BASE}/" >/dev/null 2>&1 &
  elif command -v open >/dev/null 2>&1; then
    open "${BASE}/"
  elif command -v python3 >/dev/null 2>&1; then
    python3 -m webbrowser "${BASE}/" >/dev/null 2>&1 || true
  fi
}

site_running() {
  curl -fsS --max-time 1 "${BASE}/" >/dev/null 2>&1
}

# 1. If already running (e.g. via the always-on systemd user service), open immediately!
if site_running; then
  open_browser
  exit 0
fi

# 2. Try starting the systemd user service if installed.
if command -v systemctl >/dev/null 2>&1; then
  systemctl --user start websec-decompiled.service >/dev/null 2>&1 || true
  sleep 0.3
  if site_running; then
    open_browser
    exit 0
  fi
fi

# 3. Ensure static build exists; if not, build once.
if [ ! -f ".vitepress/dist/index.html" ]; then
  npm run build
fi

# 4. Fallback: start a silent background HTTP server detached from any terminal.
nohup python3 -m http.server "${PORT}" --bind 127.0.0.1 --directory ".vitepress/dist" >/dev/null 2>&1 &

for _ in $(seq 1 40); do
  if site_running; then
    open_browser
    exit 0
  fi
  sleep 0.15
done
