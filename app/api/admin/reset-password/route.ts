import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { requireAdmin, ok, err } from "@/lib/api-helpers";
import { logAdminAction, getIpFromRequest, generateRandomPassword } from "@/lib/admin-helpers";

export async function POST(req: NextRequest) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const body = await req.json().catch(() => ({}));
  const { confirmation } = body as { confirmation?: string };

  if (confirmation !== "RESET") {
    return err('Confirmation requise : envoyer { confirmation: "RESET" }', 400);
  }

  const newPassword = generateRandomPassword(16);

  try {
    await auth.api.setPassword({
      body: { newPassword },
      headers: await headers(),
    });

    await logAdminAction({
      userId:      session!.user.id,
      action:      "password_reset",
      description: "Mot de passe réinitialisé (génération aléatoire)",
      ipAddress:   getIpFromRequest(req),
    });

    return ok({
      newPassword,
      message: "Nouveau mot de passe généré. Affichage limité à 10 secondes.",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur reset";
    return err(message, 500);
  }
}
