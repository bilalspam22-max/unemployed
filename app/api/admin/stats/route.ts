import { requireAdmin, ok } from "@/lib/api-helpers";
import { getDbStats, getDiskStats, estimateDaysUntilFull } from "@/lib/admin-helpers";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const dbStats = getDbStats();
  const diskStats = getDiskStats();
  const days = diskStats ? estimateDaysUntilFull(dbStats.totalSizeBytes, diskStats.freeBytes) : null;

  return ok({
    db:   dbStats,
    disk: diskStats,
    estimatedDaysUntilFull: days === Infinity ? null : days,
  });
}
