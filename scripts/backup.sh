#!/bin/bash
# Backup script for "Recherche." SaaS — copies SQLite DB to backups/ with timestamp + SHA256 hash.
# Run from cron every 12h, or manually via: bash scripts/backup.sh
set -e

PROJECT_DIR="${PROJECT_DIR:-/root/unemployed}"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups}"
DB_FILE="$PROJECT_DIR/recherche.db"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

mkdir -p "$BACKUP_DIR"

if [ ! -f "$DB_FILE" ]; then
  echo "[ERROR] DB introuvable : $DB_FILE" >&2
  exit 1
fi

TIMESTAMP=$(date +%Y-%m-%dT%H-%M-%S)
BACKUP_FILE="$BACKUP_DIR/recherche-$TIMESTAMP.db"

# Transaction-safe backup via SQLite .backup (won't see partial writes)
if command -v sqlite3 >/dev/null 2>&1; then
  sqlite3 "$DB_FILE" ".backup '$BACKUP_FILE'"
else
  # Fallback: plain copy (may catch a write in-flight, less safe)
  cp "$DB_FILE" "$BACKUP_FILE"
fi

# Compute SHA256
if command -v sha256sum >/dev/null 2>&1; then
  HASH=$(sha256sum "$BACKUP_FILE" | awk '{print $1}')
elif command -v shasum >/dev/null 2>&1; then
  HASH=$(shasum -a 256 "$BACKUP_FILE" | awk '{print $1}')
else
  HASH=""
fi
[ -n "$HASH" ] && echo "$HASH" > "$BACKUP_FILE.sha256"

# Cleanup old backups
find "$BACKUP_DIR" -name "recherche-*.db" -mtime "+$RETENTION_DAYS" -delete 2>/dev/null || true
find "$BACKUP_DIR" -name "*.sha256"      -mtime "+$RETENTION_DAYS" -delete 2>/dev/null || true

SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "[$(date -Iseconds)] Backup OK: $BACKUP_FILE ($SIZE)"
