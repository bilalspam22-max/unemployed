import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { cvs } from "@/lib/db/schema";
import { requireAuth, ok, err } from "@/lib/api-helpers";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAuth();
  if (response) return response;
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { mainKeywords, strengthsToHighlight, ...rest } = body;
  const update: Record<string, unknown> = { ...rest };
  if (mainKeywords !== undefined)         update.mainKeywords         = JSON.stringify(mainKeywords);
  if (strengthsToHighlight !== undefined) update.strengthsToHighlight = JSON.stringify(strengthsToHighlight);
  const row = await db.update(cvs)
    .set(update)
    .where(and(eq(cvs.id, id), eq(cvs.userId, session!.user.id)))
    .returning();
  if (!row.length) return err("Not found", 404);
  return ok({ ...row[0], mainKeywords: JSON.parse(row[0].mainKeywords ?? "[]"), strengthsToHighlight: JSON.parse(row[0].strengthsToHighlight ?? "[]") });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAuth();
  if (response) return response;
  const { id } = await params;
  await db.delete(cvs).where(and(eq(cvs.id, id), eq(cvs.userId, session!.user.id)));
  return ok({ deleted: true });
}
