"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, Send, User } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/lib/store";
import { formatDateShort } from "@/lib/utils";
import type { Followup, Contact, CalendarEvent } from "@/lib/types";

// ─── Event type config ────────────────────────────────────────────────────────

const EVENT_CFG = {
  contact_followup: { color: "var(--primary)", bg: "var(--primary-soft)", label: "Relance" },
  followup:         { color: "var(--primary)", bg: "var(--primary-soft)", label: "Relance" },
  followup_done:    { color: "var(--muted)", bg: "var(--surface-2)", label: "Relance archivée" },
  meeting:          { color: "var(--plum)", bg: "var(--plum-soft, #f3eaff)", label: "Réunion" },
  application:      { color: "var(--warn)", bg: "var(--warn-soft)", label: "Candidature" },
} as const;

// Parse "YYYY-MM-DD" without timezone offset (avoids UTC midnight drift)
function parseLocalDate(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m, d };
}

// ─── Archive Followup Modal (minimal inline version for this page) ─────────────

function QuickArchiveModal({ contact, onArchive, onClose }: {
  contact: Contact;
  onArchive: (data: { myMessage: string; interlocutorResponse: string; nextFollowupDate: string }) => Promise<void>;
  onClose: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [myMessage, setMyMessage] = useState("");
  const [interlocutorResponse, setInterlocutorResponse] = useState("");
  const [nextFollowupDate, setNextFollowupDate] = useState("");
  const [saving, setSaving] = useState(false);

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onArchive({ myMessage, interlocutorResponse, nextFollowupDate });
    setSaving(false);
  }

  return (
    <form onSubmit={handle}>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
        Archiver la relance de <strong>{contact.firstName} {contact.lastName}</strong>.
        Note ce qui s'est passé, puis définis une nouvelle date si besoin.
      </p>
      <div className="field">
        <label className="label">Ce que j'ai dit / envoyé</label>
        <textarea className="input" value={myMessage} onChange={e => setMyMessage(e.target.value)} rows={2} placeholder="Message envoyé, sujet abordé…" />
      </div>
      <div className="field">
        <label className="label">Réponse reçue (optionnel)</label>
        <textarea className="input" value={interlocutorResponse} onChange={e => setInterlocutorResponse(e.target.value)} rows={2} placeholder="Pas de réponse / A dit que…" />
      </div>
      <div className="field">
        <label className="label">Nouvelle date de relance (optionnel)</label>
        <input className="input" type="date" value={nextFollowupDate} onChange={e => setNextFollowupDate(e.target.value)} min={today} />
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button type="button" className="btn" onClick={onClose}>Annuler</button>
        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? "Archivage…" : "Archiver"}
        </button>
      </div>
    </form>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FollowupsPage() {
  const [followups, setFollowups]           = useState<Followup[]>([]);
  const [contacts, setContacts]             = useState<Contact[]>([]);
  const [calEvents, setCalEvents]           = useState<CalendarEvent[]>([]);
  const [selectedDay, setSelectedDay]       = useState<number | null>(null);
  const [aiMessages, setAiMessages]         = useState<Array<{ tone: string; toneLabel: string; message: string }> | null>(null);
  const [loadingAI, setLoadingAI]           = useState(false);
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [archiveTarget, setArchiveTarget]   = useState<Contact | null>(null);
  const { showToast } = useToast();

  const load = useCallback(() => {
    fetch("/api/followups").then(r => r.json()).then(r => setFollowups(r.data ?? [])).catch(() => {});
    fetch("/api/contacts").then(r => r.json()).then(r => setContacts(r.data ?? [])).catch(() => {});
    fetch("/api/calendar").then(r => r.json()).then(r => setCalEvents(r.data ?? [])).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();    // 0-indexed
  const today = now.getDate();
  const todayStr = now.toISOString().slice(0, 10);
  const nextWeekStr = new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const adjustedFirst = (firstDay + 6) % 7;
  const cells: (number | null)[] = [...Array(adjustedFirst).fill(null)];
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  // Group calendar events by day — parse YYYY-MM-DD without UTC drift
  const eventsByDay: Record<number, CalendarEvent[]> = {};
  calEvents.forEach(ev => {
    const { y, m, d } = parseLocalDate(ev.date);
    if (y === year && m === month + 1) {
      if (!eventsByDay[d]) eventsByDay[d] = [];
      eventsByDay[d].push(ev);
    }
  });

  // "Cette semaine" — followup table entries (pending)
  const weekFollowups = followups.filter(
    f => f.status === "pending" && f.scheduledDate >= todayStr && f.scheduledDate <= nextWeekStr
  );

  // "Cette semaine" — contacts with nextFollowupDate in the window (not already covered by a followup record)
  const followupContactIds = new Set(weekFollowups.map(f => f.contactId).filter(Boolean));
  const weekContacts = contacts.filter(
    c => c.nextFollowupDate && c.nextFollowupDate >= todayStr && c.nextFollowupDate <= nextWeekStr
       && !followupContactIds.has(c.id)
  );

  const contactMap = Object.fromEntries(contacts.map(c => [c.id, c]));

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

  async function handleArchiveContact(contact: Contact, data: { myMessage: string; interlocutorResponse: string; nextFollowupDate: string }) {
    const today = new Date().toISOString().slice(0, 10);
    await fetch("/api/followups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contactId: contact.id,
        scheduledDate: contact.nextFollowupDate ?? today,
        status: "completed",
        completedAt: today,
        myMessage: data.myMessage || null,
        interlocutorResponse: data.interlocutorResponse || null,
      }),
    });
    await fetch(`/api/contacts/${contact.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lastExchangeDate: today,
        lastExchangeSummary: data.myMessage ? data.myMessage.slice(0, 200) : contact.lastExchangeSummary,
        nextFollowupDate: data.nextFollowupDate || null,
      }),
    });
    setArchiveTarget(null);
    showToast(`Relance archivée — ${contact.firstName} ✓`);
    load();
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
        firstName: contact.firstName, lastName: contact.lastName,
        role: contact.role, company: null,
        lastExchangeSummary: contact.lastExchangeSummary,
        signalDetected: contact.signalDetected,
      }),
    });
    const { data } = await resp.json();
    setAiMessages(data);
    setLoadingAI(false);
  }

  const hasWeekItems = weekFollowups.length > 0 || weekContacts.length > 0;

  return (
    <div className="main__inner">
      <div className="page-head">
        <div>
          <h1 className="page-head__title">Relances</h1>
          <p className="page-head__sub">Ne jamais oublier un suivi</p>
        </div>
      </div>

      <div className="followups-grid">
        {/* ── Calendrier ── */}
        <div className="card card__pad-lg">
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>
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
              const dotTypes = [...new Set(dayEvents.map(e => e.type))].slice(0, 3);
              return (
                <div
                  key={i}
                  className={`cal__cell${!day ? " cal__cell--out" : ""}${isToday ? " cal__cell--today" : ""}${isSelected ? " cal__cell--selected" : ""}`}
                  onClick={() => day && setSelectedDay(day === selectedDay ? null : day)}
                  style={{ cursor: day ? "pointer" : undefined }}
                >
                  {day && <span className="cal__day">{day}</span>}
                  {dotTypes.length > 0 && (
                    <div style={{ display: "flex", gap: 2, justifyContent: "center", marginTop: 2 }}>
                      {dotTypes.map(type => (
                        <div
                          key={type}
                          style={{
                            width: 6, height: 6, borderRadius: "50%",
                            background: EVENT_CFG[type as keyof typeof EVENT_CFG]?.color ?? "var(--muted)",
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Detail du jour sélectionné */}
          {selectedDay && (
            <div style={{ marginTop: 14, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 8, color: "var(--muted)" }}>
                {selectedDay} {MONTH_NAMES[month]}
              </div>
              {selectedDayEvents.length === 0 ? (
                <div style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>Aucun événement.</div>
              ) : (
                <div className="col gap-2">
                  {selectedDayEvents.map(ev => {
                    const cfg = EVENT_CFG[ev.type as keyof typeof EVENT_CFG];
                    return (
                      <div key={ev.id} style={{
                        display: "flex", alignItems: "flex-start", gap: 8,
                        padding: "7px 10px", borderRadius: "var(--r-sm)",
                        background: cfg?.bg ?? "var(--surface-2)",
                        border: `1px solid ${cfg?.color ?? "var(--border)"}33`,
                      }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg?.color ?? "var(--muted)", marginTop: 3, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>{ev.label}</div>
                          <div style={{ fontSize: 10, color: cfg?.color, fontWeight: 700, textTransform: "uppercase", marginTop: 1 }}>
                            {cfg?.label ?? ev.type}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Cette semaine ── */}
        <div>
          <div className="section-title" style={{ marginBottom: 12 }}>À faire cette semaine</div>
          <div className="col gap-3">
            {!hasWeekItems && (
              <div className="card card__pad" style={{ textAlign: "center" }}>
                <CheckCircle2 size={24} color="var(--success)" style={{ margin: "8px auto" }} />
                <div className="muted" style={{ fontSize: 13 }}>Tout est à jour !</div>
              </div>
            )}

            {/* Relances depuis la table followup */}
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
                    <button className="btn btn--sm" onClick={() => loadAIMessages(f.contactId)} disabled={loadingAI && activeContactId === f.contactId}>
                      Suggérer message
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Contacts avec nextFollowupDate cette semaine */}
            {weekContacts.map(c => (
              <div key={c.id} className="card card__pad-lg" style={{ borderLeft: "3px solid var(--primary)" }}>
                <div className="row gap-3" style={{ marginBottom: 10 }}>
                  <Avatar firstName={c.firstName} lastName={c.lastName} size="sm" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{c.firstName} {c.lastName}</div>
                    <div className="muted tiny">{c.role ?? "—"}</div>
                  </div>
                  <span className="muted tiny" style={{ color: "var(--primary)", fontWeight: 600 }}>
                    {c.nextFollowupDate ? formatDateShort(c.nextFollowupDate) : ""}
                  </span>
                </div>
                {c.lastExchangeSummary && (
                  <div style={{ fontSize: 12.5, fontStyle: "italic", color: "var(--ink-3)", marginBottom: 10, borderLeft: "2px solid var(--border-strong)", paddingLeft: 10 }}>
                    &ldquo;{c.lastExchangeSummary.slice(0, 80)}…&rdquo;
                  </div>
                )}
                <div className="row gap-2">
                  <button className="btn btn--sm btn--primary" onClick={() => setArchiveTarget(c)}>
                    <Send size={12} /> Archiver la relance
                  </button>
                  <button className="btn btn--sm" onClick={() => loadAIMessages(c.id)} disabled={loadingAI && activeContactId === c.id}>
                    Suggérer message
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* AI Messages */}
          {aiMessages && (
            <div style={{ marginTop: 20 }}>
              <div className="section-title" style={{ marginBottom: 10 }}>Suggestions de messages</div>
              <div className="col gap-3">
                {aiMessages.map((m, i) => (
                  <div key={i} style={{ background: "var(--primary-soft)", borderRadius: "var(--r-md)", padding: 12 }}>
                    <div className="badge badge--primary" style={{ marginBottom: 6, fontSize: 10 }}>{m.toneLabel}</div>
                    <div style={{ fontSize: 12.5, color: "var(--primary-ink)", fontFamily: "var(--f-mono)", lineHeight: 1.5 }}>{m.message}</div>
                    <button className="btn btn--sm" style={{ marginTop: 8 }} onClick={() => { navigator.clipboard.writeText(m.message); showToast("Message copié ✓"); }}>
                      Copier
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal archivage rapide */}
      {archiveTarget && (
        <Modal open={true} onClose={() => setArchiveTarget(null)} title="Archiver cette relance" size="md">
          <QuickArchiveModal
            contact={archiveTarget}
            onArchive={data => handleArchiveContact(archiveTarget, data)}
            onClose={() => setArchiveTarget(null)}
          />
        </Modal>
      )}
    </div>
  );
}
