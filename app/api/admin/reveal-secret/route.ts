import { NextRequest } from "next/server";
import { requireAdmin, ok, err } from "@/lib/api-helpers";
import { logAdminAction, getIpFromRequest } from "@/lib/admin-helpers";

const SECRETS: Record<string, () => string | undefined> = {
  anthropic_key:        () => process.env.ANTHROPIC_API_KEY,
  better_auth_secret:   () => process.env.BETTER_AUTH_SECRET,
};

export async function POST(req: NextRequest) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const body = await req.json().catch(() => ({}));
  const { secretType, confirmation } = body as { secretType?: string; confirmation?: string };

  if (confirmation !== "SHOW") {
    return err('Confirmation requise : envoyer { confirmation: "SHOW" }', 400);
  }
  if (!secretType || !SECRETS[secretType]) {
    return err("Type de secret invalide", 400);
  }

  const value = SECRETS[secretType]();
  if (!value) return err("Ce secret n'est pas configuré dans l'environnement.", 404);

  await logAdminAction({
    userId:      session!.user.id,
    action:      "secret_revealed",
    description: `Secret révélé : ${secretType}`,
    metadata:    { secretType },
    ipAddress:   getIpFromRequest(req),
  });

  return ok({
    secretType,
    value,
    message: "Affichage limité à 10 secondes côté client.",
  });
}
