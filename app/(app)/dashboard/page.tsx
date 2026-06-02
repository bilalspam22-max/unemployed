"use client";

import { useEffect, useState, useMemo } from "react";
import { Bell, TrendingUp, Flame, ChevronLeft, ChevronRight } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { Donut } from "@/components/ui/donut";
import { TempDot } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { InsightsPanel } from "@/components/ui/insights-panel";
import { KpiGridSkeleton } from "@/components/ui/skeleton";
import { formatDateShort } from "@/lib/utils";
import { getDailyQuote } from "@/lib/quotes";
import type { Contact, Insight, CalendarEvent, Followup, Meeting, Application } from "@/lib/types";
import { useSession } from "@/lib/auth-client";

interface StreakData { current: number; best: number; lastActivity: string | null; }

interface DashboardData {
  applicationsTotal: number;
  applicationsDelta: number;
  followupsThisMonth: number;
  followupsDelta: number;
  interviewsPlanned: number;
  responseRate: number;
  responseRateDelta: number;
  applicationsBySector: Array<{ sectorName: string; count: number; color: string }>;
  hotContacts: Contact[];
  todayFollowups: Array<{ id: string; contactId: string | null; scheduledDate: string }>;
}

const EVENT_DOT_COLORS: Record<string, string> = {
  contact_followup: "var(--primary)",
  followup:         "var(--primary)",
  followup_done:    "var(--muted)",
  meeting:          "var(--plum)",
  application:      "var(--warn)",
};

const EVENT_SHORT_LABEL: Record<string, string> = {
  contact_followup: "Relance",
  followup:         "Relance",
  followup_done:    "Relance",
  meeting:          "Réunion",
  application:      "Candidat.",
};

// Compact label for a calendar pill (first name for relances, else short type)
function pillLabel(ev: CalendarEvent): string {
  if (ev.type.startsWith("followup") || ev.type === "contact_followup") {
    return ev.label?.split(" ")[0] || "Relance";
  }
  return ev.label || EVENT_SHORT_LABEL[ev.type] || "Événement";
}

function CalendarMini() {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [contacts, setContacts]         = useState<Contact[]>([]);
  const [followups, setFollowups]       = useState<Followup[]>([]);
  const [meetings, setMeetings]         = useState<Meeting[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);

  // Build calendar events from the individual endpoints (never depend on /api/calendar).
  useEffect(() => {
    const getList = (url: string, set: (v: never[]) => void) =>
      fetch(url).then(r => r.json()).then(r => set(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    getList("/api/contacts", setContacts as never);
    getList("/api/followups", setFollowups as never);
    getList("/api/meetings", setMeetings as never);
    getList("/api/applications", setApplications as never);
  }, []);

  const events: CalendarEvent[] = useMemo(() => {
    const evs: CalendarEvent[] = [];
    for (const f of followups) {
      evs.push({
        id: f.id, date: f.scheduledDate,
        type: f.status === "completed" ? "followup_done" : "followup",
        label: f.myMessage ? f.myMessage.slice(0, 40) : "Relance", contactId: f.contactId,
      });
    }
    for (const c of contacts) {
      if (c.nextFollowupDate) evs.push({ id: `cfup-${c.id}`, date: c.nextFollowupDate, type: "contact_followup", label: `${c.firstName} ${c.lastName}`, contactId: c.id });
    }
    for (const m of meetings) {
      if (m.date) evs.push({ id: m.id, date: m.date, type: "meeting", label: m.title });
    }
    for (const a of applications) {
      if (a.sentDate) evs.push({ id: a.id, date: a.sentDate, type: "application", label: a.jobTitle });
    }
    return evs;
  }, [contacts, followups, meetings, applications]);

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();
  const today = isCurrentMonth ? now.getDate() : -1;

  const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];
  const adjustedFirst = (firstDay + 6) % 7;

  const cells: (number | null)[] = [...Array(adjustedFirst).fill(null)];
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const MONTH_NAMES = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

  // Group events by day — parse YYYY-MM-DD without UTC offset drift (strip any time part)
  const eventsByDay: Record<number, CalendarEvent[]> = {};
  events.forEach(ev => {
    const [evY, evM, evD] = ev.date.slice(0, 10).split("-").map(Number);
    if (evY === viewYear && evM === viewMonth + 1) {
      if (!eventsByDay[evD]) eventsByDay[evD] = [];
      eventsByDay[evD].push(ev);
    }
  });

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }
  function goToday() { setViewYear(now.getFullYear()); setViewMonth(now.getMonth()); }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <button className="btn btn--ghost btn--icon" onClick={prevMonth} title="Mois précédent">
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={goToday}
          style={{ fontWeight: 700, fontSize: 14, background: "none", border: "none", cursor: "pointer", color: "var(--ink)", padding: "2px 8px", borderRadius: "var(--r-sm)" }}
          title="Revenir au mois actuel"
        >
          {MONTH_NAMES[viewMonth]} {viewYear}
        </button>
        <button className="btn btn--ghost btn--icon" onClick={nextMonth} title="Mois suivant">
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="cal cal--events">
        {DAY_LABELS.map((d, i) => (
          <div key={`h-${i}`} className="cal__head">{d}</div>
        ))}
        {cells.map((day, i) => {
          const dayEvents = day ? (eventsByDay[day] ?? []) : [];
          const shown = dayEvents.slice(0, 2);
          const extra = dayEvents.length - shown.length;
          return (
            <div
              key={i}
              className={`cal__cell${!day ? " cal__cell--out" : ""}${day === today ? " cal__cell--today" : ""}${dayEvents.length > 0 ? " cal__cell--has-events" : ""}`}
            >
              {day && <span className="cal__day">{day}</span>}
              {shown.length > 0 && (
                <div className="cal__pills">
                  {shown.map(ev => (
                    <span
                      key={ev.id}
                      className="cal__pill"
                      style={{ background: EVENT_DOT_COLORS[ev.type] ?? "var(--muted)" }}
                      title={ev.label}
                    >
                      {pillLabel(ev)}
                    </span>
                  ))}
                  {extra > 0 && <span className="cal__pill cal__pill--more">+{extra}</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [streak, setStreak] = useState<StreakData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then(r => r.json())
      .then(r => { setData(r.data); setLoading(false); })
      .catch(() => setLoading(false));
    fetch("/api/insights")
      .then(r => r.json())
      .then(r => { setInsights(r.data ?? []); setInsightsLoading(false); })
      .catch(() => setInsightsLoading(false));
    fetch("/api/streak")
      .then(r => r.json())
      .then(r => setStreak(r.data))
      .catch(() => {});
  }, []);

  const name = session?.user?.name?.split(" ")[0] ?? "Bilal";
  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const quote = getDailyQuote();

  // Streak tone
  const streakTone = !streak || streak.current === 0
    ? null
    : streak.current >= 8 ? "hot" : streak.current >= 4 ? "mid" : "low";

  return (
    <div className="main__inner">
      {/* Header */}
      <div className="page-head">
        <div>
          <p className="page-head__sub" style={{ margin: "0 0 2px 0" }}>{today}</p>
          <h1 className="page-head__title">Bonjour, {name} 👋</h1>
        </div>
        <div className="row gap-2" style={{ flexWrap: "wrap" }}>
          {streak && streak.current > 0 && streakTone && (
            <span
              className={`streak-badge streak-badge--${streakTone}`}
              title={`Meilleur : ${streak.best} jour${streak.best > 1 ? "s" : ""}`}
            >
              <Flame size={14} strokeWidth={2.2} />
              {streak.current} jour{streak.current > 1 ? "s" : ""} d'activité
            </span>
          )}
          <button className="btn">
            <Bell size={14} /> Rappels
          </button>
        </div>
      </div>

      {/* KPIs */}
      {loading ? (
        <KpiGridSkeleton count={4} />
      ) : (
        <div className="kpi-grid">
          <KpiCard
            label="Candidatures envoyées"
            value={data?.applicationsTotal ?? 0}
            delta={data?.applicationsDelta}
            sparkData={[3, 5, 4, 8, 6, 10, data?.applicationsTotal ?? 0]}
            sparkColor="var(--primary)"
          />
          <KpiCard
            label="Relances ce mois"
            value={data?.followupsThisMonth ?? 0}
            delta={data?.followupsDelta}
            sparkData={[1, 3, 2, 4, 3, 6, data?.followupsThisMonth ?? 0]}
            sparkColor="var(--success)"
          />
          <KpiCard
            label="Entretiens prévus"
            value={data?.interviewsPlanned ?? 0}
            sparkData={[0, 1, 1, 2, 1, 3, data?.interviewsPlanned ?? 0]}
            sparkColor="var(--warn)"
          />
          <KpiCard
            label="Taux de réponse"
            value={data?.responseRate ?? 0}
            unit="%"
            delta={data?.responseRateDelta}
            sparkData={[0, 5, 8, 10, 12, 15, data?.responseRate ?? 0]}
            sparkColor="var(--plum)"
          />
        </div>
      )}

      {/* Insights Radar */}
      <InsightsPanel insights={insights} loading={insightsLoading} />

      {/* Mid row */}
      <div className="dashboard-mid-grid" style={{ marginBottom: 24 }}>
        {/* Donut */}
        <div className="card card__pad-lg">
          <div className="section-title" style={{ marginBottom: 16 }}>Candidatures par secteur</div>
          {data?.applicationsBySector?.length ? (
            <Donut data={data.applicationsBySector.map(s => ({ name: s.sectorName, value: s.count, color: s.color }))} />
          ) : (
            <div className="muted" style={{ fontSize: 13, textAlign: "center", padding: "20px 0" }}>
              Aucune candidature pour l'instant
            </div>
          )}
        </div>

        {/* Actions du jour */}
        <div className="card card__pad-lg">
          <div className="section-title" style={{ marginBottom: 12 }}>À faire aujourd'hui</div>
          {data?.todayFollowups?.length ? (
            <div className="col gap-3">
              {data.todayFollowups.map(f => (
                <div key={f.id} className="row gap-3 between" style={{ padding: "10px 12px", background: "var(--warn-soft)", borderRadius: "var(--r-md)" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Relance prévue</div>
                    <div className="muted tiny">{formatDateShort(f.scheduledDate)}</div>
                  </div>
                  <button className="btn btn--sm">Voir</button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: "24px 0", textAlign: "center" }}>
              <TrendingUp size={28} strokeWidth={1.5} color="var(--success)" style={{ margin: "0 auto 8px" }} />
              <div className="muted" style={{ fontSize: 13 }}>Tout est à jour !</div>
            </div>
          )}
        </div>

        {/* Contacts chauds */}
        <div className="card card__pad-lg">
          <div className="section-title" style={{ marginBottom: 12 }}>Contacts chauds</div>
          {data?.hotContacts?.length ? (
            <div className="col gap-2">
              {data.hotContacts.map(c => (
                <div key={c.id} className="row gap-3 between" style={{ padding: "8px 0" }}>
                  <Avatar firstName={c.firstName} lastName={c.lastName} size="sm" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.firstName} {c.lastName}
                    </div>
                    <div className="muted tiny">{c.role ?? "—"}</div>
                  </div>
                  <TempDot temp={c.temperature} />
                </div>
              ))}
            </div>
          ) : (
            <div className="muted" style={{ fontSize: 13, textAlign: "center", padding: "20px 0" }}>
              Pas encore de contacts chauds
            </div>
          )}
        </div>
      </div>

      {/* Calendrier */}
      <div className="card card__pad-lg" style={{ maxWidth: 560 }}>
        <CalendarMini />
      </div>

      {/* Citation motivante du jour */}
      <div className="quote-card" style={{ marginTop: 24 }}>
        {quote.text}
        <div className="quote-card__author">— {quote.author}</div>
      </div>
    </div>
  );
}
