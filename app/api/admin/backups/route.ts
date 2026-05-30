import { requireAdmin, ok } from "@/lib/api-helpers";
import { listBackups, BACKUP_DIR } from "@/lib/admin-helpers";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const backups = listBackups();

  return ok({
    backups,
    lastBackup: backups[0] ?? null,
    backupDir:  BACKUP_DIR,
    settings: {
      autoBackupIntervalHours: 12,
      retentionDays:           30,
    },
  });
}
