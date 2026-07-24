#!/usr/bin/env bash
#
# redeploy-staging.sh
#
# Wraps rebuild-staging.sh with the server stop/restart integration steps:
#   1. Stop the running pm2 apps
#   2. Remove the old nohup.out
#   3. Run rebuild-staging.sh under nohup (survives disconnection), waiting
#      for it to finish
#   4. Only if the rebuild succeeded, restart the pm2 apps
#
# If the rebuild fails, the pm2 apps are left stopped and this script exits
# non-zero (see /home/solidos/logs/status.log and nohup.out for details).

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

PM2_APPS=(nss-test pivot-3000 pivot-3100)
NOHUP_OUT="nohup.out"

echo "==> Stopping pm2 apps: ${PM2_APPS[*]}"
pm2 stop "${PM2_APPS[@]}"

echo "==> Removing old $NOHUP_OUT"
rm -f "$NOHUP_OUT"

# NOTE: nohup only auto-redirects to nohup.out when its stdout would
# otherwise go to a terminal. When this script itself is invoked from cron
# with its OWN stdout/stderr already redirected to a log file, nohup just
# inherits that fd instead - so the redirect below must be explicit, or the
# entire rebuild output ends up appended into the cron log instead.
echo "==> Starting rebuild-staging.sh (nohup)"
nohup bash "$SCRIPT_DIR/rebuild-staging.sh" > "$SCRIPT_DIR/$NOHUP_OUT" 2>&1 &
REBUILD_PID=$!
echo "Rebuild running as PID $REBUILD_PID (output: $NOHUP_OUT); waiting for it to finish..."

wait "$REBUILD_PID"
REBUILD_STATUS=$?

if [ "$REBUILD_STATUS" -eq 0 ]; then
  echo "==> Rebuild succeeded, restarting pm2 apps: ${PM2_APPS[*]}"
  pm2 restart "${PM2_APPS[@]}"
else
  echo "==> Rebuild FAILED (exit $REBUILD_STATUS) - pm2 apps left stopped." >&2
  echo "    See $NOHUP_OUT and /home/solidos/logs/status.log for details." >&2
  exit "$REBUILD_STATUS"
fi
