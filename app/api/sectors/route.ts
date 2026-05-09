import { NextRequest } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { sectors } from "@/lib/db/schema";
import { requireAuth, ok, err } from "@/lib/api-helpers";
import { generateId } from "@/lib/utils";
import { z } from "zod";

const createSchema = z.object({
  name:     z.string().min(1),
  color:    z.string().default("#3D5BE3"),
  priority: z.number().int().min(1).max(3).default(2),
});

export async function GET() {
  const { session, response } = await requireAuth();
  if (response) return response;
  const rows = await db.select().from(sectors).where(eq(sectors.userId, session!.user.id)).orderBy(desc(sectors.priority));
  return ok(rows);
}

export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.message);
  const row = await db.insert(sectors).values({
    id:     generateId(),
    userId: session!.user.id,
    ...parsed.data,
  }).returning();
  return ok(row[0], 201);
}
