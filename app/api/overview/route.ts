import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { companies, contacts, applications, meetings } from "@/lib/db/schema";
import { requireAuth, ok } from "@/lib/api-helpers";

export async function GET() {
  const { session, response } = await requireAuth();
  if (response) return response;
  const uid = session!.user.id;

  const [companyRows, contactRows, applicationRows, meetingRows] = await Promise.all([
    db.select().from(companies).where(eq(companies.userId, uid)),
    db.select().from(contacts).where(eq(contacts.userId, uid)),
    db.select().from(applications).where(eq(applications.userId, uid)),
    db.select().from(meetings).where(eq(meetings.userId, uid)),
  ]);

  return ok({
    companies: companyRows.map(r => ({ ...r, technologies: JSON.parse(r.technologies ?? "[]") })),
    contacts: contactRows,
    applications: applicationRows,
    meetings: meetingRows.map(r => ({ ...r, questionsData: JSON.parse(r.questionsData ?? "[]") })),
  });
}
