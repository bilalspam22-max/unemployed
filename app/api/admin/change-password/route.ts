import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { requireAdmin, ok, err } from "@/lib/api-helpers";
import { logAdminAction, getIpFromRequest } from "@/lib/admin-helpers";

export async function POST(req: NextRequest) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const body = await req.json().catch(() => ({}));
  const { currentPassword, newPassword } = body as { currentPassword?: string; newPassword?: string };

  if (!currentPassword || !newPassword) return err("currentPassword et newPassword requis");
  if (newPassword.length < 8) return err("Nouveau mot de passe trop court (8 caractères min)");

  try {
    await auth.api.changePassword({
      body: { currentPassword, newPassword },
      headers: await headers(),
    });

    await logAdminAction({
      userId:      session!.user.id,
      action:      "password_changed",
      description: "Mot de passe modifié (avec mot de passe actuel)",
      ipAddress:   getIpFromRequest(req),
    });
    return ok({ message: "Mot de passe modifié avec succès." });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur lors du changement";
    if (message.toLowerCase().includes("invalid") || message.toLowerCase().includes("incorrect")) {
      return err("Mot de passe actuel incorrect.", 400);
    }
    return err(message, 500);
  }
}
