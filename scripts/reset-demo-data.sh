#!/usr/bin/env bash
#
# Reset the PYRITE demo to a clean slate.
#
# Clears:
#   backend/data/vyuh_soc.db        -> telemetry events, attacker sessions,
#                                      production auth logs, virtual shell files
#   backend/logs/vyuh_deception.json-> JSONL deception log
#   attacker-cli/.attacker_state.json -> harvested crumbs + simulated attacker IP
#
# In-memory shadow worlds are wiped automatically when the backend restarts.
# Baseline seed rows (the two production auth logs) are recreated on startup,
# so the dashboard metrics start at zero.

set -euo pipefail

cd "$(dirname "$0")/.."

BACKEND_WAS_RUNNING=0
if command -v docker >/dev/null 2>&1; then
  if docker compose ps --status running --format '{{.Service}}' 2>/dev/null | grep -qx 'backend'; then
    BACKEND_WAS_RUNNING=1
    echo "Stopping backend to release the database..."
    docker compose stop backend >/dev/null
  fi
fi

echo "Removing persisted telemetry and CLI state..."
rm -f backend/data/vyuh_soc.db \
      backend/data/vyuh_soc.db-wal \
      backend/data/vyuh_soc.db-shm \
      backend/logs/vyuh_deception.json \
      attacker-cli/.attacker_state.json

mkdir -p backend/data backend/logs
: > backend/logs/vyuh_deception.json

if [ "$BACKEND_WAS_RUNNING" = "1" ]; then
  echo "Starting backend (recreates an empty schema)..."
  docker compose start backend >/dev/null
  for _ in $(seq 1 30); do
    if curl -sf http://localhost:8003/api/dashboard/snapshot >/dev/null 2>&1; then
      break
    fi
    sleep 1
  done
  echo "Backend ready: http://localhost:8003"
fi

echo "Reset complete. Reload http://localhost:3000/dashboard to see zeroed metrics."
