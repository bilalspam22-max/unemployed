import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { companies } from "@/lib/db/schema";
import { requireAuth, ok, err } from "@/lib/api-helpers";
import { z } from "zod";

const updateSchema = z.object({
  name:          z.string().min(1).optional(),
  sectorId:      z.string().nullable().optional(),
  location:      z.string().nullable().optional(),
  website:       z.string().nullable().optional(),
  hasRdOffice:   z.boolean().optional(),
  technologies:  z.array(z.string()).optional(),
  status:        z.enum(["to_contact","contacted","followed_up","interview","rejected","hot_opportunity"]).optional(),
  priorityScore: z.number().int().min(1).max(5).optional(),
  notes:         z.string().nullable().optional(),
}).strict();

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAuth();
  if (response) return response;
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.message);
  const { technologies, ...rest } = parsed.data;
  const update: Record<string, unknown> = { ...rest, updatedAt: new Date() };
  if (technologies !== undefined) update.technologies = JSON.stringify(technologies);
  const row = await db.update(companies)
    .set(update)
    .where(and(eq(companies.id, id), eq(companies.userId, session!.user.id)))
    .returning();
  if (!row.length) return err("Not found", 404);
  return ok({ ...row[0], technologies: JSON.parse(row[0].technologies ?? "[]") });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAuth();
  if (response) return response;
  const { id } = await params;
  await db.delete(companies).where(and(eq(companies.id, id), eq(companies.userId, session!.user.id)));
  return ok({ deleted: true });
}
