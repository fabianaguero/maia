#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-1421}"
HOST="${HOST:-127.0.0.1}"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

existing_pid="$(lsof -tiTCP:${PORT} -sTCP:LISTEN 2>/dev/null || true)"
if [[ -n "${existing_pid}" ]]; then
  existing_cmd="$(ps -p "${existing_pid}" -o command= 2>/dev/null || true)"
  if [[ "${existing_cmd}" == *"${PROJECT_ROOT}/node_modules/.bin/vite"* ]]; then
    kill "${existing_pid}" 2>/dev/null || true
    sleep 0.5
  else
    echo "Port ${PORT} is already in use by another process:"
    echo "${existing_cmd:-unknown}"
    exit 1
  fi
fi

cd "${PROJECT_ROOT}"
exec npx vite --port "${PORT}" --host "${HOST}"
