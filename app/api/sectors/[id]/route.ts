import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { sectors } from "@/lib/db/schema";
import { requireAuth, ok, err } from "@/lib/api-helpers";
import { z } from "zod";

const updateSchema = z.object({
  name:     z.string().min(1).optional(),
  color:    z.string().optional(),
  priority: z.number().int().min(1).max(3).optional(),
}).strict();

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAuth();
  if (response) return response;
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.message);
  const row = await db.update(sectors)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(sectors.id, id), eq(sectors.userId, session!.user.id)))
    .returning();
  if (!row.length) return err("Not found", 404);
  return ok(row[0]);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAuth();
  if (response) return response;
  const { id } = await params;
  await db.delete(sectors).where(and(eq(sectors.id, id), eq(sectors.userId, session!.user.id)));
  return ok({ deleted: true });
}
