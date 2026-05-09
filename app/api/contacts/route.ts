import { NextRequest } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { contacts } from "@/lib/db/schema";
import { requireAuth, ok, err } from "@/lib/api-helpers";
import { generateId } from "@/lib/utils";
import { z } from "zod";

const createSchema = z.object({
  firstName:           z.string().min(1),
  lastName:            z.string().min(1),
  companyId:           z.string().nullable().optional(),
  role:                z.string().nullable().optional(),
  email:               z.string().email().nullable().optional(),
  linkedinUrl:         z.string().nullable().optional(),
  contactType:         z.enum(["recruiter","consultant","engineer","acquaintance","referral"]).nullable().optional(),
  temperature:         z.enum(["cold","warm","hot"]).optional(),
  lastExchangeDate:    z.string().nullable().optional(),
  lastExchangeSummary: z.string().nullable().optional(),
  nextFollowupDate:    z.string().nullable().optional(),
  signalDetected:      z.string().nullable().optional(),
  humanNotes:          z.string().nullable().optional(),
  trustLevel:          z.number().int().min(1).max(5).optional(),
});

export async function GET() {
  const { session, response } = await requireAuth();
  if (response) return response;
  const rows = await db.select().from(contacts).where(eq(contacts.userId, session!.user.id)).orderBy(desc(contacts.updatedAt));
  return ok(rows);
}

export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.message);
  const row = await db.insert(contacts).values({
    id:     generateId(),
    userId: session!.user.id,
    ...parsed.data,
  }).returning();
  return ok(row[0], 201);
}
