import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { meetings } from "@/lib/db/schema";
import { requireAuth, ok, err } from "@/lib/api-helpers";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAuth();
  if (response) return response;
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  try {
    // Serialize questionsData if present
    const toSet = { ...body, updatedAt: new Date() };
    if (Array.isArray(body.questionsData)) {
      toSet.questionsData = JSON.stringify(body.questionsData);
    }
    const row = await db.update(meetings)
      .set(toSet)
      .where(and(eq(meetings.id, id), eq(meetings.userId, session!.user.id)))
      .returning();
    if (!row.length) return err("Not found", 404);
    return ok({ ...row[0], questionsData: JSON.parse(row[0].questionsData ?? "[]") });
  } catch (e) {
    console.error("[/api/meetings PUT]", e);
    return err(e instanceof Error ? e.message : "Erreur lors de la mise à jour", 500);
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAuth();
  if (response) return response;
  const { id } = await params;
  await db.delete(meetings).where(and(eq(meetings.id, id), eq(meetings.userId, session!.user.id)));
  return ok({ deleted: true });
}
