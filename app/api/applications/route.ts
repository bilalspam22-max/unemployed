import { NextRequest } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { applications } from "@/lib/db/schema";
import { requireAuth, ok, err } from "@/lib/api-helpers";
import { generateId } from "@/lib/utils";
import { resolveCompanyId } from "@/app/api/contacts/company-resolver";
import { z } from "zod";

const createSchema = z.object({
  jobTitle:         z.string().min(1),
  companyId:        z.string().nullable().optional(),
  // Inline company creation (clipper / capture) — find-or-create by name
  companyName:      z.string().nullable().optional(),
  companySectorId:  z.string().nullable().optional(),
  contactId:        z.string().nullable().optional(),
  sectorId:         z.string().nullable().optional(),
  cvUsedId:         z.string().nullable().optional(),
  messageSent:      z.string().nullable().optional(),
  status:           z.enum(["to_prepare","cv_sent","followup_planned","in_discussion","interview","waiting","rejected","won"]).optional(),
  sentDate:         z.string().nullable().optional(),
  nextAction:       z.string().nullable().optional(),
  feedbackReceived: z.string().nullable().optional(),
  sourceUrl:        z.string().nullable().optional(),
  sentVia:          z.enum(["email","linkedin","referral","direct"]).nullable().optional(),
});

export async function GET() {
  const { session, response } = await requireAuth();
  if (response) return response;
  const rows = await db.select().from(applications).where(eq(applications.userId, session!.user.id)).orderBy(desc(applications.updatedAt));
  return ok(rows);
}

export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.message);

  const { companyName, companySectorId, companyId, ...rest } = parsed.data;
  const resolvedCompanyId = await resolveCompanyId(
    session!.user.id, companyName, companySectorId, null, null, companyId,
  );

  const row = await db.insert(applications).values({
    id:        generateId(),
    userId:    session!.user.id,
    companyId: resolvedCompanyId,
    ...rest,
  }).returning();
  return ok(row[0], 201);
}
