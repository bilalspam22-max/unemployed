import { NextRequest } from "next/server";
import { requireAdmin, ok, err } from "@/lib/api-helpers";
import { restoreBackup, logAdminAction, getIpFromRequest } from "@/lib/admin-helpers";

export async function POST(req: NextRequest) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const body = await req.json().catch(() => ({}));
  const { backupFile, confirmation } = body as { backupFile?: string; confirmation?: string };

  if (!backupFile) return err("backupFile requis");
  if (confirmation !== "RESTORE") {
    return err('Confirmation requise : envoyer { confirmation: "RESTORE" }', 400);
  }

  try {
    const result = restoreBackup(backupFile);
    if (!result.ok) return err(result.message, 404);

    await logAdminAction({
      userId:      session!.user.id,
      action:      "backup_restored",
      description: `Restauration depuis ${backupFile}`,
      metadata:    { backupFile },
      ipAddress:   getIpFromRequest(req),
    });
    return ok({ message: result.message });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur restauration";
    return err(message, 500);
  }
}
