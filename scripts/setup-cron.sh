#!/bin/bash
# Install cron entry for automatic backups every 12h.
# Usage (on the VM, as root): bash scripts/setup-cron.sh
set -e

PROJECT_DIR="${PROJECT_DIR:-/root/unemployed}"
SCRIPT_PATH="$PROJECT_DIR/scripts/backup.sh"
LOG_FILE="/var/log/recherche-backup.log"

if [ ! -f "$SCRIPT_PATH" ]; then
  echo "[ERROR] $SCRIPT_PATH introuvable" >&2
  exit 1
fi

chmod +x "$SCRIPT_PATH"

# Build new crontab : remove any old line, add our new one
CRON_LINE="0 */12 * * * $SCRIPT_PATH >> $LOG_FILE 2>&1"

NEW_CRON=$( { crontab -l 2>/dev/null | grep -v "$SCRIPT_PATH"; echo "$CRON_LINE"; } )
echo "$NEW_CRON" | crontab -

echo "✅ Cron installé : backup automatique toutes les 12h"
echo "  Commande : $CRON_LINE"
echo "  Logs : $LOG_FILE"
echo ""
echo "Crontab actuel :"
crontab -l | grep backup || true
