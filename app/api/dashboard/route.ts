import { eq, and, gte, lt, count } from "drizzle-orm";
import { db } from "@/lib/db";
import { applications, contacts, followups, sectors, companies } from "@/lib/db/schema";
import { requireAuth, ok } from "@/lib/api-helpers";

export async function GET() {
  const { session, response } = await requireAuth();
  if (response) return response;
  const userId = session!.user.id;

  const now   = new Date();
  const month = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // Applications total & delta
  const [appsCurrent] = await db.select({ c: count() }).from(applications).where(eq(applications.userId, userId));
  const [appsPrev] = await db.select({ c: count() }).from(applications).where(
    and(eq(applications.userId, userId), lt(applications.createdAt, month))
  );

  // Followups this month
  const [followupsCurrent] = await db.select({ c: count() }).from(followups).where(
    and(eq(followups.userId, userId), gte(followups.scheduledDate, month.toISOString().slice(0, 10)))
  );
  const [followupsPrev] = await db.select({ c: count() }).from(followups).where(
    and(
      eq(followups.userId, userId),
      gte(followups.scheduledDate, prevMonth.toISOString().slice(0, 10)),
      lt(followups.scheduledDate, month.toISOString().slice(0, 10))
    )
  );

  // Interviews planned
  const [interviews] = await db.select({ c: count() }).from(applications).where(
    and(eq(applications.userId, userId), eq(applications.status, "interview"))
  );

  // Response rate (cv_sent + more advanced statuses / total sent)
  const [sent] = await db.select({ c: count() }).from(applications).where(
    and(eq(applications.userId, userId))
  );
  const [responded] = await db.select({ c: count() }).from(applications).where(
    and(eq(applications.userId, userId), eq(applications.status, "in_discussion"))
  );
  const [interviewedCount] = await db.select({ c: count() }).from(applications).where(
    and(eq(applications.userId, userId), eq(applications.status, "interview"))
  );
  const responseRate = sent.c > 0
    ? Math.round(((responded.c + interviewedCount.c) / sent.c) * 100)
    : 0;

  // Applications by sector
  const appsBySector = await db
    .select({ sectorId: applications.sectorId, cnt: count() })
    .from(applications)
    .where(eq(applications.userId, userId))
    .groupBy(applications.sectorId);

  const sectorRows = await db.select().from(sectors).where(eq(sectors.userId, userId));
  const sectorMap = Object.fromEntries(sectorRows.map(s => [s.id, s]));

  const applicationsBySector = appsBySector.map(r => ({
    sectorName: r.sectorId ? (sectorMap[r.sectorId]?.name ?? "Inconnu") : "Non classé",
    count: r.cnt,
    color: r.sectorId ? (sectorMap[r.sectorId]?.color ?? "#969892") : "#969892",
  }));

  // Hot contacts (next followup <= today + 7 days)
  const nextWeek = new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10);
  const hotContacts = await db.select().from(contacts).where(
    and(eq(contacts.userId, userId), eq(contacts.temperature, "hot"))
  ).limit(6);

  // Today actions: pending followups due today
  const todayStr = now.toISOString().slice(0, 10);
  const todayFollowups = await db
    .select({ id: followups.id, contactId: followups.contactId, scheduledDate: followups.scheduledDate })
    .from(followups)
    .where(and(eq(followups.userId, userId), eq(followups.status, "pending"), eq(followups.scheduledDate, todayStr)))
    .limit(4);

  return ok({
    applicationsTotal:   appsCurrent.c,
    applicationsDelta:   appsCurrent.c - appsPrev.c,
    followupsThisMonth:  followupsCurrent.c,
    followupsDelta:      followupsCurrent.c - followupsPrev.c,
    interviewsPlanned:   interviews.c,
    responseRate,
    responseRateDelta:   0,
    applicationsBySector,
    hotContacts,
    todayFollowups,
  });
}
