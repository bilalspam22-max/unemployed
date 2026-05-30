import { NextRequest } from "next/server";
import { requireAdmin, ok, err } from "@/lib/api-helpers";
import { createBackup, logAdminAction, getIpFromRequest } from "@/lib/admin-helpers";

export async function POST(req: NextRequest) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  try {
    const backup = createBackup();
    await logAdminAction({
      userId:    session!.user.id,
      action:    "backup_created",
      description: `Backup manuel : ${backup.filename}`,
      metadata:  { filename: backup.filename, sizeMb: backup.sizeMb, hash: backup.hash },
      ipAddress: getIpFromRequest(req),
    });
    return ok(backup);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur backup";
    return err(message, 500);
  }
}
