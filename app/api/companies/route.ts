import { NextRequest } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { companies } from "@/lib/db/schema";
import { requireAuth, ok, err } from "@/lib/api-helpers";
import { generateId } from "@/lib/utils";
import { z } from "zod";

const createSchema = z.object({
  name:          z.string().min(1),
  sectorId:      z.string().nullable().optional(),
  location:      z.string().nullable().optional(),
  website:       z.string().nullable().optional(),
  hasRdOffice:   z.boolean().optional(),
  technologies:  z.array(z.string()).optional(),
  status:        z.enum(["to_contact","contacted","followed_up","interview","rejected","hot_opportunity"]).optional(),
  priorityScore: z.number().int().min(1).max(5).optional(),
  notes:         z.string().nullable().optional(),
});

export async function GET() {
  const { session, response } = await requireAuth();
  if (response) return response;
  const rows = await db.select().from(companies).where(eq(companies.userId, session!.user.id)).orderBy(desc(companies.updatedAt));
  return ok(rows.map(r => ({ ...r, technologies: JSON.parse(r.technologies ?? "[]") })));
}

export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.message);
  const { technologies, ...rest } = parsed.data;
  const row = await db.insert(companies).values({
    id:           generateId(),
    userId:       session!.user.id,
    technologies: JSON.stringify(technologies ?? []),
    ...rest,
  }).returning();
  return ok({ ...row[0], technologies: JSON.parse(row[0].technologies ?? "[]") }, 201);
}
