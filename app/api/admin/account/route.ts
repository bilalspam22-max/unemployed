import { requireAdmin, ok } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { users, sessions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { maskString } from "@/lib/admin-helpers";

export async function GET() {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const userId = session!.user.id;
  const userRow = (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0];

  // Last login from sessions table
  const lastSession = (await db.select().from(sessions)
    .where(eq(sessions.userId, userId))
    .orderBy(desc(sessions.createdAt))
    .limit(1))[0];

  const anthropicKey = process.env.ANTHROPIC_API_KEY ?? "";

  return ok({
    email:                 userRow?.email ?? "(inconnu)",
    name:                  userRow?.name ?? "(inconnu)",
    role:                  userRow?.role ?? "user",
    passwordMasked:        "•••••••••••••",
    anthropicKeyMasked:    anthropicKey ? maskString(anthropicKey, 7, 4) : "(non configurée)",
    anthropicKeyConfigured: !!anthropicKey,
    createdAt:             userRow?.createdAt ?? null,
    lastLogin:             lastSession?.createdAt ?? null,
    status:                "ACTIVE",
  });
}
