import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { followups } from "@/lib/db/schema";
import { requireAuth, ok, err } from "@/lib/api-helpers";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAuth();
  if (response) return response;
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const row = await db.update(followups)
    .set(body)
    .where(and(eq(followups.id, id), eq(followups.userId, session!.user.id)))
    .returning();
  if (!row.length) return err("Not found", 404);
  return ok(row[0]);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAuth();
  if (response) return response;
  const { id } = await params;
  await db.delete(followups).where(and(eq(followups.id, id), eq(followups.userId, session!.user.id)));
  return ok({ deleted: true });
}
