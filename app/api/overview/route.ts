import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { companies, contacts, applications, meetings } from "@/lib/db/schema";
import { requireAuth, ok, err } from "@/lib/api-helpers";

// Safe JSON parse — never throws, falls back to provided default
function safeParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw); } catch { return fallback; }
}

export async function GET() {
  const { session, response } = await requireAuth();
  if (response) return response;
  const uid = session!.user.id;

  try {
    const [companyRows, contactRows, applicationRows, meetingRows] = await Promise.all([
      db.select().from(companies).where(eq(companies.userId, uid)),
      db.select().from(contacts).where(eq(contacts.userId, uid)),
      db.select().from(applications).where(eq(applications.userId, uid)),
      db.select().from(meetings).where(eq(meetings.userId, uid)),
    ]);

    return ok({
      companies: companyRows.map(r => ({ ...r, technologies: safeParse(r.technologies, []) })),
      contacts: contactRows,
      applications: applicationRows,
      meetings: meetingRows.map(r => ({ ...r, questionsData: safeParse(r.questionsData, []) })),
    });
  } catch (e) {
    console.error("[/api/overview] error:", e);
    return err("Erreur lors du chargement de la vue d'ensemble", 500);
  }
}
