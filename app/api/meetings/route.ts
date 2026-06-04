import { NextRequest } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { meetings } from "@/lib/db/schema";
import { requireAuth, ok, err } from "@/lib/api-helpers";
import { generateId } from "@/lib/utils";
import { z } from "zod";

const questionItemSchema = z.object({
  question: z.string(),
  asked: z.boolean(),
  answer: z.string(),
});

const createSchema = z.object({
  title:          z.string().min(1),
  date:           z.string().min(1),
  companyId:      z.string().nullable().optional(),
  contactId:      z.string().nullable().optional(),
  applicationId:  z.string().nullable().optional(),
  companyInfo:    z.string().nullable().optional(),
  myPitch:        z.string().nullable().optional(),
  jobMentioned:   z.string().nullable().optional(),
  sentiment:      z.enum(["positive", "neutral", "negative"]).optional(),
  sentimentNotes: z.string().nullable().optional(),
  questionsData:  z.array(questionItemSchema).optional(),
  clientInfo:     z.string().nullable().optional(),
  nextSteps:      z.string().nullable().optional(),
  notes:          z.string().nullable().optional(),
});

export async function GET() {
  const { session, response } = await requireAuth();
  if (response) return response;
  try {
    const rows = await db.select().from(meetings)
      .where(eq(meetings.userId, session!.user.id))
      .orderBy(desc(meetings.date));
    return ok(rows.map(r => ({
      ...r,
      questionsData: JSON.parse(r.questionsData ?? "[]"),
    })));
  } catch (e) {
    console.error("[/api/meetings GET]", e);
    return err(e instanceof Error ? e.message : "Erreur de chargement des réunions", 500);
  }
}

export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.message);
  try {
    const { questionsData, ...rest } = parsed.data;
    const row = await db.insert(meetings).values({
      id:             generateId(),
      userId:         session!.user.id,
      questionsData:  JSON.stringify(questionsData ?? []),
      ...rest,
    }).returning();
    return ok({ ...row[0], questionsData: JSON.parse(row[0].questionsData ?? "[]") }, 201);
  } catch (e) {
    console.error("[/api/meetings POST]", e);
    return err(e instanceof Error ? e.message : "Erreur lors de l'enregistrement", 500);
  }
}
