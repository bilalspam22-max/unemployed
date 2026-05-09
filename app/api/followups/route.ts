import { NextRequest } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { followups } from "@/lib/db/schema";
import { requireAuth, ok, err } from "@/lib/api-helpers";
import { generateId } from "@/lib/utils";
import { z } from "zod";

const createSchema = z.object({
  contactId:           z.string().nullable().optional(),
  scheduledDate:       z.string().min(1),
  status:              z.enum(["pending","completed","skipped"]).optional(),
  messageTemplateUsed: z.string().nullable().optional(),
  completedAt:         z.string().nullable().optional(),
});

export async function GET() {
  const { session, response } = await requireAuth();
  if (response) return response;
  const rows = await db.select().from(followups).where(eq(followups.userId, session!.user.id)).orderBy(desc(followups.scheduledDate));
  return ok(rows);
}

export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.message);
  const row = await db.insert(followups).values({
    id:     generateId(),
    userId: session!.user.id,
    ...parsed.data,
  }).returning();
  return ok(row[0], 201);
}
