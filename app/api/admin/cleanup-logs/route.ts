import { NextRequest } from "next/server";
import { lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { adminLogs } from "@/lib/db/schema";
import { requireAdmin, ok, err } from "@/lib/api-helpers";
import { logAdminAction, getIpFromRequest, cleanupOldBackups } from "@/lib/admin-helpers";

export async function POST(req: NextRequest) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const body = await req.json().catch(() => ({}));
  const { daysToKeep = 30, includeBackups = false } = body as { daysToKeep?: number; includeBackups?: boolean };

  if (typeof daysToKeep !== "number" || daysToKeep < 1) {
    return err("daysToKeep doit être un entier >= 1");
  }

  const cutoff = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

  const result = await db.delete(adminLogs).where(lt(adminLogs.createdAt, cutoff)).returning({ id: adminLogs.id });
  const logsDeleted = result.length;

  let backupsDeleted = 0;
  if (includeBackups) {
    backupsDeleted = cleanupOldBackups(daysToKeep).deleted;
  }

  await logAdminAction({
    userId:      session!.user.id,
    action:      "logs_cleanup",
    description: `Nettoyage logs >${daysToKeep}j`,
    metadata:    { logsDeleted, backupsDeleted, daysToKeep },
    ipAddress:   getIpFromRequest(req),
  });

  return ok({ logsDeleted, backupsDeleted });
}
