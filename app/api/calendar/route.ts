import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { followups, meetings, applications, contacts } from "@/lib/db/schema";
import { requireAuth, ok } from "@/lib/api-helpers";

export interface CalendarEvent {
  id: string;
  date: string;
  type: "followup" | "followup_done" | "meeting" | "application" | "contact_followup";
  label: string;
  status?: string;
  contactId?: string | null;
}

export async function GET() {
  const { session, response } = await requireAuth();
  if (response) return response;

  const userId = session!.user.id;
  const events: CalendarEvent[] = [];

  // Followup records (from the followups table — archived relances)
  const followupRows = await db.select().from(followups).where(eq(followups.userId, userId));
  for (const f of followupRows) {
    events.push({
      id: f.id,
      date: f.scheduledDate,
      type: f.status === "completed" ? "followup_done" : "followup",
      label: f.myMessage ? f.myMessage.slice(0, 40) : "Relance",
      status: f.status,
      contactId: f.contactId,
    });
  }

  // Contact nextFollowupDate (upcoming planned follow-ups not yet archived)
  const contactRows = await db.select().from(contacts).where(eq(contacts.userId, userId));
  for (const c of contactRows) {
    if (c.nextFollowupDate) {
      events.push({
        id: `cfup-${c.id}`,
        date: c.nextFollowupDate,
        type: "contact_followup",
        label: `${c.firstName} ${c.lastName}`,
        contactId: c.id,
      });
    }
  }

  // Meetings
  const meetingRows = await db.select().from(meetings).where(eq(meetings.userId, userId));
  for (const m of meetingRows) {
    events.push({
      id: m.id,
      date: m.date,
      type: "meeting",
      label: m.title,
    });
  }

  // Applications with sentDate
  const appRows = await db.select().from(applications).where(eq(applications.userId, userId));
  for (const a of appRows) {
    if (a.sentDate) {
      events.push({
        id: a.id,
        date: a.sentDate,
        type: "application",
        label: a.jobTitle,
        status: a.status,
      });
    }
  }

  return ok(events);
}
