import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { applications, contacts, followups, companies } from "@/lib/db/schema";
import { requireAuth, ok } from "@/lib/api-helpers";

/**
 * Compute consecutive days of activity for the user.
 * Activity = any createdAt or updatedAt on applications / contacts / followups / companies.
 *
 * - current : nombre de jours consécutifs jusqu'à aujourd'hui (ou hier si pas d'activité aujourd'hui).
 * - best    : meilleure série historique.
 */
export async function GET() {
  const { session, response } = await requireAuth();
  if (response) return response;
  const userId = session!.user.id;

  // Collect all activity timestamps from the user's data
  const [apps, contactRows, followupRows, companyRows] = await Promise.all([
    db.select({ c: applications.createdAt, u: applications.updatedAt }).from(applications).where(eq(applications.userId, userId)),
    db.select({ c: contacts.createdAt, u: contacts.updatedAt }).from(contacts).where(eq(contacts.userId, userId)),
    db.select({ c: followups.createdAt, completedAt: followups.completedAt }).from(followups).where(eq(followups.userId, userId)),
    db.select({ c: companies.createdAt, u: companies.updatedAt }).from(companies).where(eq(companies.userId, userId)),
  ]);

  // Collect unique YYYY-MM-DD strings for activity days
  const dayStrings = new Set<string>();
  function add(d: Date | string | null | undefined) {
    if (!d) return;
    const date = typeof d === "string" ? new Date(d) : d;
    if (isNaN(date.getTime())) return;
    dayStrings.add(date.toISOString().slice(0, 10));
  }

  for (const r of apps)         { add(r.c); add(r.u); }
  for (const r of contactRows)  { add(r.c); add(r.u); }
  for (const r of followupRows) { add(r.c); add(r.completedAt); }
  for (const r of companyRows)  { add(r.c); add(r.u); }

  if (dayStrings.size === 0) {
    return ok({ current: 0, best: 0, lastActivity: null });
  }

  const sortedDays = [...dayStrings].sort(); // ascending YYYY-MM-DD lex sort = chronological

  // Compute best streak ever
  let best = 1;
  let runningBest = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    const prev = new Date(sortedDays[i - 1]);
    const cur = new Date(sortedDays[i]);
    const diff = Math.round((cur.getTime() - prev.getTime()) / 86400000);
    if (diff === 1) {
      runningBest++;
      best = Math.max(best, runningBest);
    } else {
      runningBest = 1;
    }
  }

  // Compute current streak (counting back from today or yesterday)
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const yesterday = new Date(today.getTime() - 86400000).toISOString().slice(0, 10);

  let cursorStr: string;
  if (dayStrings.has(todayStr)) {
    cursorStr = todayStr;
  } else if (dayStrings.has(yesterday)) {
    cursorStr = yesterday;
  } else {
    return ok({ current: 0, best, lastActivity: sortedDays[sortedDays.length - 1] });
  }

  let current = 0;
  while (dayStrings.has(cursorStr)) {
    current++;
    const d = new Date(cursorStr);
    d.setDate(d.getDate() - 1);
    cursorStr = d.toISOString().slice(0, 10);
  }

  return ok({
    current,
    best,
    lastActivity: sortedDays[sortedDays.length - 1],
  });
}
