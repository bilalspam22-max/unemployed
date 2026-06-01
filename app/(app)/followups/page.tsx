"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckCircle2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/lib/store";
import { formatDateShort } from "@/lib/utils";
import type { Followup, Contact } from "@/lib/types";
import type { CalendarEvent } from "@/app/api/calendar/route";

// ─── Event type config ────────────────────────────────────────────────────────

const EVENT_CFG = {
  contact_followup: { color: "var(--primary)", bg: "var(--primary-soft)", label: "Relance" },
  followup:         { color: "var(--primary)", bg: "var(--primary-soft)", label: "Relance" },
  followup_done:    { color: "var(--muted)", bg: "var(--surface-2)", label: "Relance archivée" },
  meeting:          { color: "var(--plum)", bg: "var(--plum-soft, #f3eaff)", label: "Réunion" },
  application:      { color: "var(--warn)", bg: "var(--warn-soft)", label: "Candidature" },
} as const;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FollowupsPage() {
  const [followups, setFollowups]         = useState<Followup[]>([]);
  const [contacts, setContacts]           = useState<Contact[]>([]);
  const [calEvents, setCalEvents]         = useState<CalendarEvent[]>([]);
  const [selectedDay, setSelectedDay]     = useState<number | null>(null);
  const [aiMessages, setAiMessages]       = useState<Array<{ tone: string; toneLabel: string; message: string }> | null>(null);
  const [loadingAI, setLoadingAI]         = useState(false);
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const { showToast } = useToast();

  const load = useCallback(() => {
    fetch("/api/followups").then(r => r.json()).then(r => setFollowups(r.data ?? []));
    fetch("/api/contacts").then(r => r.json()).then(r => setContacts(r.data ?? []));
    fetch("/api/calendar").then(r => r.json()).then(r => setCalEvents(r.data ?? []));
  }, []);

  useEffect(() => { load(); }, [load]);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const todayStr = now.toISOString().slice(0, 10);
  const nextWeekStr = new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const adjustedFirst = (firstDay + 6) % 7;
  const cells: (number | null)[] = [...Array(adjustedFirst).fill(null)];
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  // Group calendar events by day (current month only)
  const eventsByDay: Record<number, CalendarEvent[]> = {};
  calEvents.forEach(ev => {
    const d = new Date(ev.date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!eventsByDay[day]) eventsByDay[day] = [];
      eventsByDay[day].push(ev);
    }
  });

  const weekFollowups = followups.filter(f => f.status === "pending" && f.scheduledDate >= todayStr && f.scheduledDate <= nextWeekStr);
  const contactMap    = Object.fromEntries(contacts.map(c => [c.id, c]));

  const MONTH_NAMES = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
  const DAY_LABELS  = ["L","M","M","J","V","S","D"];

  // Events for selected day
  const selectedDayStr = selectedDay
    ? `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`
    : null;
  const selectedDayEvents = selectedDayStr
    ? calEvents.filter(ev => ev.date === selectedDayStr)
    : [];

  async function markDone(f: Followup) {
    await fetch(`/api/followups/${f.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed", completedAt: todayStr }),
    });
    setFollowups(prev => prev.map(fu => fu.id === f.id ? { ...fu, status: "completed" } : fu));
    const contact = contactMap[f.contactId ?? ""];
    showToast(`Relance enregistrée${contact ? ` — ${contact.firstName}` : ""} ✓`);
  }

  async function loadAIMessages(contactId: string | null) {
    if (!contactId) return;
    const contact = contactMap[contactId];
    if (!contact) return;
    setLoadingAI(true);
    setAiMessages(null);
    setActiveContactId(contactId);
    const resp = await fetch("/api/ai/suggest-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName:           contact.firstName,
        lastName:            contact.lastName,
        role:                contact.role,
        company:             null,
        lastExchangeSummary: contact.lastExchangeSummary,
        signalDetected:      contact.signalDetected,
      }),
    });
    const { data } = await resp.json();
    setAiMessages(data);
    setLoadingAI(false);
  }

  return (
    <div className="main__inner">
      <div className="page-head">
        <div>
          <h1 className="page-head__title">Relances</h1>
          <p className="page-head__sub">Ne jamais oublier un suivi</p>
        </div>
      </div>

      <div className="followups-grid">
        {/* Calendrier */}
        <div className="card card__pad-lg">
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>
            {MONTH_NAMES[month]} {year}
          </div>

          {/* Légende */}
          <div className="row gap-3" style={{ marginBottom: 12, flexWrap: "wrap" }}>
            {(["contact_followup", "meeting", "application"] as const).map(type => {
              const cfg = EVENT_CFG[type];
              return (
                <div key={type} className="row gap-1" style={{ alignItems: "center" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 10, color: "var(--muted)", fontWeight: 600 }}>{cfg.label}</span>
                </div>
              );
            })}
          </div>

          <div className="cal">
            {DAY_LABELS.map((d, i) => <div key={i} className="cal__head">{d}</div>)}
            {cells.map((day, i) => {
              const dayEvents = day ? (eventsByDay[day] ?? []) : [];
              const isToday = day === today;
              const isSelected = day === selectedDay;
              const hasEvents = dayEvents.length > 0;
              return (
                <div
                  key={i}
                  className={`cal__cell${!day ? " cal__cell--out" : ""}${isToday ? " cal__cell--today" : ""}${isSelected ? " cal__cell--selected" : ""}`}
                  onClick={() => day && setSelectedDay(day === selectedDay ? null : day)}
                  style={{ cursor: day ? "pointer" : undefined }}
                >
                  {day && <span className="cal__day">{day}</span>}
                  <div className="cal__events">
                    {/* Colored dots grouped by type */}
                    {hasEvents && (() => {
                      const types = [...new Set(dayEvents.map(e => e.type))];
                      return (
                        <div style={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap", marginTop: 2 }}>
                          {types.slice(0, 3).map(type => {
                            const cfg = EVENT_CFG[type as keyof typeof EVENT_CFG];
                            const count = dayEvents.filter(e => e.type === type).length;
                            return (
                              <div
                                key={type}
                                style={{
                                  width: 6, height: 6, borderRadius: "50%",
                                  background: cfg?.color ?? "var(--muted)",
                                  position: "relative",
                                }}
                                title={`${count} ${cfg?.label ?? type}`}
                              />
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected day detail */}
          {selectedDay && selectedDayEvents.length > 0 && (
            <div style={{ marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 8, color: "var(--muted)" }}>
                {selectedDay} {MONTH_NAMES[month]}
              </div>
              <div className="col gap-2">
                {selectedDayEvents.map(ev => {
                  const cfg = EVENT_CFG[ev.type as keyof typeof EVENT_CFG];
                  return (
                    <div
                      key={ev.id}
                      style={{
                        display: "flex", alignItems: "flex-start", gap: 8,
                        padding: "7px 10px",
                        borderRadius: "var(--r-sm)",
                        background: cfg?.bg ?? "var(--surface-2)",
                        border: `1px solid ${cfg?.color ?? "var(--border)"}22`,
                      }}
                    >
                      <div style={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: cfg?.color ?? "var(--muted)",
                        marginTop: 4, flexShrink: 0,
                      }} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)" }}>{ev.label}</div>
                        <div style={{ fontSize: 10, color: cfg?.color ?? "var(--muted)", fontWeight: 700, textTransform: "uppercase", marginTop: 1 }}>
                          {cfg?.label ?? ev.type}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {selectedDay && selectedDayEvents.length === 0 && (
            <div style={{ marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 12, textAlign: "center" }}>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>Aucun événement ce jour.</span>
            </div>
          )}
        </div>

        {/* Cette semaine */}
        <div>
          <div className="section-title" style={{ marginBottom: 12 }}>À faire cette semaine</div>
          <div className="col gap-3">
            {weekFollowups.length === 0 && (
              <div className="card card__pad" style={{ textAlign: "center" }}>
                <CheckCircle2 size={24} color="var(--success)" style={{ margin: "8px auto" }} />
                <div className="muted" style={{ fontSize: 13 }}>Tout est à jour !</div>
              </div>
            )}
            {weekFollowups.map(f => {
              const contact = contactMap[f.contactId ?? ""];
              return (
                <div key={f.id} className="card card__pad-lg">
                  {contact && (
                    <div className="row gap-3" style={{ marginBottom: 10 }}>
                      <Avatar firstName={contact.firstName} lastName={contact.lastName} size="sm" />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{contact.firstName} {contact.lastName}</div>
                        <div className="muted tiny">{contact.role ?? "—"}</div>
                      </div>
                      <span className="muted tiny">{formatDateShort(f.scheduledDate)}</span>
                    </div>
                  )}
                  {contact?.lastExchangeSummary && (
                    <div style={{ fontSize: 12.5, fontStyle: "italic", color: "var(--ink-3)", marginBottom: 10, borderLeft: "2px solid var(--border-strong)", paddingLeft: 10 }}>
                      &ldquo;{contact.lastExchangeSummary.slice(0, 80)}…&rdquo;
                    </div>
                  )}
                  <div className="row gap-2">
                    <button className="btn btn--sm btn--primary" onClick={() => markDone(f)}>
                      <CheckCircle2 size={12} /> Marquer relancé
                    </button>
                    <button
                      className="btn btn--sm"
                      onClick={() => loadAIMessages(f.contactId)}
                      disabled={loadingAI && activeContactId === f.contactId}
                    >
                      Suggérer message
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* AI Messages */}
          {aiMessages && (
            <div style={{ marginTop: 20 }}>
              <div className="section-title" style={{ marginBottom: 10 }}>Suggestions de messages</div>
              <div className="col gap-3">
                {aiMessages.map((m, i) => (
                  <div key={i} style={{ background: "var(--primary-soft)", borderRadius: "var(--r-md)", padding: 12 }}>
                    <div className="badge badge--primary" style={{ marginBottom: 6, fontSize: 10 }}>{m.toneLabel}</div>
                    <div style={{ fontSize: 12.5, color: "var(--primary-ink)", fontFamily: "var(--f-mono)", lineHeight: 1.5 }}>
                      {m.message}
                    </div>
                    <button
                      className="btn btn--sm"
                      style={{ marginTop: 8 }}
                      onClick={() => { navigator.clipboard.writeText(m.message); showToast("Message copié ✓"); }}
                    >
                      Copier
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
