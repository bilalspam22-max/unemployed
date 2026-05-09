import { NextRequest } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { cvs } from "@/lib/db/schema";
import { requireAuth, ok, err } from "@/lib/api-helpers";
import { generateId } from "@/lib/utils";
import { z } from "zod";

const createSchema = z.object({
  sectorId:             z.string().nullable().optional(),
  versionNumber:        z.number().int().min(1).optional(),
  lastUpdated:          z.string().nullable().optional(),
  mainKeywords:         z.array(z.string()).optional(),
  strengthsToHighlight: z.array(z.string()).optional(),
  pdfUrl:               z.string().nullable().optional(),
});

export async function GET() {
  const { session, response } = await requireAuth();
  if (response) return response;
  const rows = await db.select().from(cvs).where(eq(cvs.userId, session!.user.id)).orderBy(desc(cvs.createdAt));
  return ok(rows.map(r => ({
    ...r,
    mainKeywords:         JSON.parse(r.mainKeywords ?? "[]"),
    strengthsToHighlight: JSON.parse(r.strengthsToHighlight ?? "[]"),
  })));
}

export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.message);
  const { mainKeywords, strengthsToHighlight, ...rest } = parsed.data;
  const row = await db.insert(cvs).values({
    id:                   generateId(),
    userId:               session!.user.id,
    mainKeywords:         JSON.stringify(mainKeywords ?? []),
    strengthsToHighlight: JSON.stringify(strengthsToHighlight ?? []),
    ...rest,
  }).returning();
  return ok({
    ...row[0],
    mainKeywords:         JSON.parse(row[0].mainKeywords ?? "[]"),
    strengthsToHighlight: JSON.parse(row[0].strengthsToHighlight ?? "[]"),
  }, 201);
}
