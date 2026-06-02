"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  DndContext, DragEndEvent, DragStartEvent, DragOverlay,
  PointerSensor, useSensor, useSensors, useDroppable, useDraggable,
} from "@dnd-kit/core";
import { CheckCircle2, Send, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, CalendarDays, History, MessageSquare } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/lib/store";
import { formatDateShort } from "@/lib/utils";
import type { Followup, Contact, Meeting, Application, CalendarEvent } from "@/lib/types";

// ─── Event type config ────────────────────────────────────────────────────────

const EVENT_CFG = {
  contact_followup: { color: "var(--primary)", bg: "var(--primary-soft)", label: "Relance" },
  followup:         { color: "var(--primary)", bg: "var(--primary-soft)", label: "Relance" },
  followup_done:    { color: "var(--muted)", bg: "var(--surface-2)", label: "Relance archivée" },
  meeting:          { color: "var(--plum)", bg: "var(--plum-soft, #f3eaff)", label: "Réunion" },
  application:      { color: "var(--warn)", bg: "var(--warn-soft)", label: "Candidature" },
} as const;

// Parse "YYYY-MM-DD" (or an ISO datetime) without timezone offset (avoids UTC drift)
function parseLocalDate(iso: string): { y: number; m: number; d: number } {
  const datePart = iso.slice(0, 10); // strip any "T..." time portion
  const [y, m, d] = datePart.split("-").map(Number);
  return { y, m, d };
}

// Which event types can be rescheduled by drag & drop (future-oriented).
const DRAGGABLE_TYPES = new Set(["contact_followup", "followup", "meeting"]);

// ─── Droppable day cell ───────────────────────────────────────────────────────

function DayCell({ dateStr, className, onClick, children }: {
  dateStr: string; className: string; onClick: () => void; children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `day:${dateStr}` });
  return (
    <div ref={setNodeRef} className={`${className}${isOver ? " cal__cell--drop" : ""}`} onClick={onClick} style={{ cursor: "pointer" }}>
      {children}
    </div>
  );
}

// ─── Draggable pill ───────────────────────────────────────────────────────────

function DragPill({ ev, label, color, draggable }: {
  ev: CalendarEvent; label: string; color: string; draggable: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${ev.type}|${ev.id}|${ev.contactId ?? ""}`,
    disabled: !draggable,
  });
  return (
    <span
      ref={setNodeRef}
      className={`cal__pill${draggable ? " cal__pill--drag" : ""}${isDragging ? " is-dragging" : ""}`}
      style={{ background: color }}
      title={draggable ? "Glisser sur un autre jour pour reprogrammer" : undefined}
      {...(draggable ? attributes : {})}
      {...(draggable ? listeners : {})}
    >
      {label}
    </span>
  );
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

// ─── Historique Timeline ──────────────────────────────────────────────────────

const MONTH_NAMES_FULL = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

function HistoriqueTimeline({ followups, contacts }: { followups: Followup[]; contacts: Contact[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const contactMap = Object.fromEntries(contacts.map(c => [c.id, c]));

  const completed = [...followups]
    .filter(f => f.status === "completed")
    .sort((a, b) => {
      const da = a.completedAt ?? a.scheduledDate;
      const db = b.completedAt ?? b.scheduledDate;
      return db.localeCompare(da);
    });

  const groups: Array<{ key: string; label: string; items: Followup[] }> = [];
  for (const f of completed) {
    const dateStr = (f.completedAt ?? f.scheduledDate).slice(0, 10);
    const [y, m] = dateStr.split("-").map(Number);
    const key = `${y}-${String(m).padStart(2, "0")}`;
    const existing = groups.find(g => g.key === key);
    const label = `${MONTH_NAMES_FULL[m - 1]} ${y}`;
    if (existing) existing.items.push(f);
    else groups.push({ key, label, items: [f] });
  }

  if (completed.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="Aucune relance archivée"
        description="Les relances complétées apparaîtront ici avec le détail de vos échanges."
        tone="neutral"
      />
    );
  }

  return (
    <div>
      {groups.map(group => (
        <div key={group.key} style={{ marginBottom: 36 }}>
          <div style={{
            fontWeight: 700, fontSize: 11, color: "var(--muted)",
            textTransform: "uppercase", letterSpacing: "0.1em",
            marginBottom: 14, display: "flex", alignItems: "center", gap: 8,
          }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            {group.label}
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          <div style={{ position: "relative", paddingLeft: 24 }}>
            {/* Ligne verticale */}
            <div style={{
              position: "absolute", left: 8, top: 8, bottom: 8,
              width: 2, background: "var(--border)",
            }} />

            <div className="col gap-3">
              {group.items.map(f => {
                const contact = contactMap[f.contactId ?? ""];
                const isOpen = expanded.has(f.id);
                const dateStr = (f.completedAt ?? f.scheduledDate).slice(0, 10);
                const hasContent = !!(f.myMessage || f.interlocutorResponse);

                return (
                  <div key={f.id} style={{ position: "relative" }}>
                    {/* Point de timeline */}
                    <div style={{
                      position: "absolute", left: -24, top: 16,
                      width: 10, height: 10, borderRadius: "50%",
                      background: "var(--success)", border: "2px solid var(--bg)",
                      zIndex: 1,
                    }} />

                    <div
                      className="card"
                      style={{ overflow: "hidden", cursor: hasContent ? "pointer" : "default" }}
                      onClick={() => {
                        if (!hasContent) return;
                        setExpanded(prev => {
                          const next = new Set(prev);
                          if (next.has(f.id)) next.delete(f.id); else next.add(f.id);
                          return next;
                        });
                      }}
                    >
                      {/* En-tête de l'entrée */}
                      <div style={{ padding: "10px 14px" }}>
                        <div className="row gap-3" style={{ alignItems: "center" }}>
                          {contact && (
                            <Avatar firstName={contact.firstName} lastName={contact.lastName} size="sm" />
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>
                              {contact ? `${contact.firstName} ${contact.lastName}` : "Contact supprimé"}
                            </div>
                            {contact?.role && (
                              <div className="muted tiny">{contact.role}</div>
                            )}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                            {f.myMessage && !isOpen && (
                              <MessageSquare size={12} color="var(--primary)" />
                            )}
                            {f.interlocutorResponse && !isOpen && (
                              <div style={{
                                fontSize: 9, fontWeight: 800, padding: "2px 6px",
                                borderRadius: 4, background: "var(--success-soft, #e8f7ee)",
                                color: "var(--success)", letterSpacing: "0.05em",
                              }}>RÉPONSE</div>
                            )}
                            <span className="muted tiny">{formatDateShort(dateStr)}</span>
                            {hasContent && (
                              isOpen
                                ? <ChevronUp size={13} color="var(--muted)" />
                                : <ChevronDown size={13} color="var(--muted)" />
                            )}
                          </div>
                        </div>

                        {/* Aperçu du message (fermé) */}
                        {!isOpen && f.myMessage && (
                          <div style={{
                            fontSize: 12, color: "var(--ink-3)", marginTop: 8,
                            paddingLeft: 40, fontStyle: "italic",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>
                            &ldquo;{f.myMessage}&rdquo;
                          </div>
                        )}
                      </div>

                      {/* Détail étendu */}
                      {isOpen && (
                        <div style={{ borderTop: "1px solid var(--border)", padding: "14px 14px" }}>
                          {f.myMessage && (
                            <div style={{ marginBottom: f.interlocutorResponse ? 14 : 0 }}>
                              <div style={{
                                fontSize: 10, fontWeight: 700, color: "var(--muted)",
                                textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6,
                              }}>
                                Mon message
                              </div>
                              <div style={{
                                fontSize: 13, color: "var(--ink)", lineHeight: 1.65,
                                whiteSpace: "pre-wrap",
                                background: "var(--surface-2)", padding: "10px 12px",
                                borderRadius: "var(--r-sm)",
                              }}>
                                {f.myMessage}
                              </div>
                            </div>
                          )}
                          {f.interlocutorResponse && (
                            <div>
                              <div style={{
                                fontSize: 10, fontWeight: 700, color: "var(--success)",
                                textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6,
                              }}>
                                Réponse reçue
                              </div>
                              <div style={{
                                fontSize: 13, color: "var(--ink)", lineHeight: 1.65,
                                whiteSpace: "pre-wrap",
                                background: "var(--success-soft, #e8f7ee)", padding: "10px 12px",
                                borderRadius: "var(--r-sm)",
                                borderLeft: "3px solid var(--success)",
                              }}>
                                {f.interlocutorResponse}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FollowupsPage() {
  const nowInit = new Date();
  const [tab, setTab]                       = useState<"agenda" | "historique">("agenda");
  const [followups, setFollowups]           = useState<Followup[]>([]);
  const [contacts, setContacts]             = useState<Contact[]>([]);
  const [meetings, setMeetings]             = useState<Meeting[]>([]);
  const [applications, setApplications]     = useState<Application[]>([]);
  const [viewYear, setViewYear]             = useState(nowInit.getFullYear());
  const [viewMonth, setViewMonth]           = useState(nowInit.getMonth());
  const [selectedDay, setSelectedDay]       = useState<number | null>(null);
  const [aiMessages, setAiMessages]         = useState<Array<{ tone: string; toneLabel: string; message: string }> | null>(null);
  const [loadingAI, setLoadingAI]           = useState(false);
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [archiveTarget, setArchiveTarget]   = useState<Contact | null>(null);
  const [activeDragLabel, setActiveDragLabel] = useState<string | null>(null);
  const { showToast } = useToast();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  // Load from the individual endpoints that already work — never depend on /api/calendar.
  const load = useCallback(() => {
    const getList = (url: string, set: (v: never[]) => void) =>
      fetch(url).then(r => r.json()).then(r => set(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    getList("/api/followups", setFollowups as never);
    getList("/api/contacts", setContacts as never);
    getList("/api/meetings", setMeetings as never);
    getList("/api/applications", setApplications as never);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Build the calendar events client-side from the loaded data.
  const calEvents: CalendarEvent[] = useMemo(() => {
    const evs: CalendarEvent[] = [];
    for (const f of followups) {
      evs.push({
        id: f.id,
        date: f.scheduledDate,
        type: f.status === "completed" ? "followup_done" : "followup",
        label: f.myMessage ? f.myMessage.slice(0, 40) : "Relance",
        contactId: f.contactId,
      });
    }
    for (const c of contacts) {
      if (c.nextFollowupDate) {
        evs.push({
          id: `cfup-${c.id}`,
          date: c.nextFollowupDate,
          type: "contact_followup",
          label: `${c.firstName} ${c.lastName}`,
          contactId: c.id,
        });
      }
    }
    for (const m of meetings) {
      if (m.date) evs.push({ id: m.id, date: m.date, type: "meeting", label: m.title });
    }
    for (const a of applications) {
      if (a.sentDate) evs.push({ id: a.id, date: a.sentDate, type: "application", label: a.jobTitle });
    }
    return evs;
  }, [followups, contacts, meetings, applications]);

  const now = new Date();
  // Calendar grid follows the navigated month/year…
  const year = viewYear;
  const month = viewMonth;          // 0-indexed
  // …but "today" highlight only applies when viewing the actual current month.
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
  const today = isCurrentMonth ? now.getDate() : -1;
  const todayStr = now.toISOString().slice(0, 10);
  const nextWeekStr = new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const adjustedFirst = (firstDay + 6) % 7;
  const cells: (number | null)[] = [...Array(adjustedFirst).fill(null)];
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  function prevMonth() {
    setSelectedDay(null);
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    setSelectedDay(null);
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }
  function goToday() {
    setSelectedDay(null);
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
  }

  // Group calendar events by day — parse YYYY-MM-DD without UTC drift
  const eventsByDay: Record<number, CalendarEvent[]> = {};
  calEvents.forEach(ev => {
    const { y, m, d } = parseLocalDate(ev.date);
    if (y === year && m === month + 1) {
      if (!eventsByDay[d]) eventsByDay[d] = [];
      eventsByDay[d].push(ev);
    }
  });

  // Short label for an event pill in a calendar cell
  function eventPillLabel(ev: CalendarEvent): string {
    if (ev.type === "contact_followup" || ev.type === "followup" || ev.type === "followup_done") {
      const c = ev.contactId ? contactMap[ev.contactId] : null;
      return c ? c.firstName : "Relance";
    }
    if (ev.type === "meeting") return ev.label || "Réunion";
    if (ev.type === "application") return ev.label || "Candidature";
    return ev.label || "Événement";
  }

  // ── Drag & drop reschedule ──
  function handleDragStart(e: DragStartEvent) {
    const [type, id, contactId] = String(e.active.id).split("|");
    let label = "";
    if (type === "contact_followup") { const c = contactMap[contactId]; label = c ? c.firstName : "Relance"; }
    else if (type === "followup") { const f = followups.find(x => x.id === id); const c = f?.contactId ? contactMap[f.contactId] : null; label = c ? c.firstName : "Relance"; }
    else if (type === "meeting") { const m = meetings.find(x => x.id === id); label = m?.title ?? "Réunion"; }
    setActiveDragLabel(label);
  }

  async function handleDragEnd(e: DragEndEvent) {
    setActiveDragLabel(null);
    const { active, over } = e;
    if (!over) return;
    const overId = String(over.id);
    if (!overId.startsWith("day:")) return;
    const newDate = overId.slice(4); // YYYY-MM-DD
    const [type, id, contactId] = String(active.id).split("|");

    let endpoint = "", entityId = "", body: Record<string, string> = {};
    if (type === "contact_followup") {
      if (contactMap[contactId]?.nextFollowupDate === newDate) return;
      setContacts(prev => prev.map(c => c.id === contactId ? { ...c, nextFollowupDate: newDate } : c));
      endpoint = "contacts"; entityId = contactId; body = { nextFollowupDate: newDate };
    } else if (type === "followup") {
      setFollowups(prev => prev.map(f => f.id === id ? { ...f, scheduledDate: newDate } : f));
      endpoint = "followups"; entityId = id; body = { scheduledDate: newDate };
    } else if (type === "meeting") {
      setMeetings(prev => prev.map(m => m.id === id ? { ...m, date: newDate } : m));
      endpoint = "meetings"; entityId = id; body = { date: newDate };
    } else {
      return;
    }

    const resp = await fetch(`/api/${endpoint}/${entityId}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    if (!resp.ok) { showToast("Erreur lors de la reprogrammation", "error"); load(); return; }
    const label = type === "meeting"
      ? (meetings.find(m => m.id === id)?.title ?? "Réunion")
      : (contactMap[type === "contact_followup" ? contactId : (followups.find(f => f.id === id)?.contactId ?? "")]?.firstName ?? "Relance");
    showToast(`${label} reprogrammé au ${newDate} ✓`);
  }

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
    ? calEvents.filter(ev => ev.date.slice(0, 10) === selectedDayStr)
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

      <Tabs
        tabs={[
          { id: "agenda", label: "Agenda", icon: CalendarDays },
          {
            id: "historique",
            label: "Historique",
            icon: History,
            badge: followups.filter(f => f.status === "completed").length > 0 && (
              <span style={{
                fontSize: 10, fontWeight: 700,
                background: "var(--surface-2)", color: "var(--muted)",
                borderRadius: 10, padding: "1px 6px",
              }}>
                {followups.filter(f => f.status === "completed").length}
              </span>
            ),
          },
        ]}
        activeTab={tab}
        onChange={setTab}
      />

      {tab === "historique" && (
        <HistoriqueTimeline followups={followups} contacts={contacts} />
      )}

      {tab === "agenda" && <div className="followups-grid">
        {/* ── Calendrier ── */}
        <div className="card card__pad-lg">
          {/* En-tête avec navigation entre mois */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <button className="btn btn--ghost btn--icon" onClick={prevMonth} title="Mois précédent">
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={goToday}
              style={{ fontWeight: 700, fontSize: 15, background: "none", border: "none", cursor: "pointer", color: "var(--ink)", padding: "2px 8px", borderRadius: "var(--r-sm)" }}
              title="Revenir au mois actuel"
            >
              {MONTH_NAMES[month]} {year}
            </button>
            <button className="btn btn--ghost btn--icon" onClick={nextMonth} title="Mois suivant">
              <ChevronRight size={16} />
            </button>
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

          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="cal cal--events">
              {DAY_LABELS.map((d, i) => <div key={i} className="cal__head">{d}</div>)}
              {cells.map((day, i) => {
                if (!day) return <div key={i} className="cal__cell cal__cell--out" />;
                const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const dayEvents = eventsByDay[day] ?? [];
                const isToday = day === today;
                const isSelected = day === selectedDay;
                const shown = dayEvents.slice(0, 2);
                const extra = dayEvents.length - shown.length;
                const popDir = Math.floor(i / 7) === 0 ? "down" : "up";
                return (
                  <DayCell
                    key={i}
                    dateStr={dateStr}
                    className={`cal__cell${isToday ? " cal__cell--today" : ""}${isSelected ? " cal__cell--selected" : ""}${dayEvents.length > 0 ? " cal__cell--has-events" : ""}`}
                    onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                  >
                    <span className="cal__day">{day}</span>
                    {shown.length > 0 && (
                      <div className="cal__pills">
                        {shown.map(ev => {
                          const cfg = EVENT_CFG[ev.type as keyof typeof EVENT_CFG];
                          return (
                            <DragPill
                              key={ev.id}
                              ev={ev}
                              label={eventPillLabel(ev)}
                              color={cfg?.color ?? "var(--muted)"}
                              draggable={DRAGGABLE_TYPES.has(ev.type)}
                            />
                          );
                        })}
                        {extra > 0 && <span className="cal__pill cal__pill--more">+{extra}</span>}
                      </div>
                    )}

                    {/* Hover popover with full detail */}
                    {dayEvents.length > 0 && (
                      <div className={`cal__popover cal__popover--${popDir}`}>
                        <div className="cal__popover__date">{day} {MONTH_NAMES[month]}</div>
                        {dayEvents.map(ev => {
                          const cfg = EVENT_CFG[ev.type as keyof typeof EVENT_CFG];
                          const c = ev.contactId ? contactMap[ev.contactId] : null;
                          const detail = (ev.type === "contact_followup" || ev.type === "followup" || ev.type === "followup_done")
                            ? (c ? `${c.firstName} ${c.lastName}${c.role ? ` · ${c.role}` : ""}` : "Relance")
                            : ev.label;
                          return (
                            <div className="cal__popover__row" key={ev.id}>
                              <span className="cal__popover__dot" style={{ background: cfg?.color ?? "var(--muted)" }} />
                              <div style={{ minWidth: 0 }}>
                                <div className="cal__popover__label">{detail}</div>
                                <div className="cal__popover__type" style={{ color: cfg?.color ?? "var(--muted)" }}>{cfg?.label ?? "Événement"}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </DayCell>
                );
              })}
            </div>

            <DragOverlay>
              {activeDragLabel ? (
                <span className="cal__pill" style={{ background: "var(--primary)", boxShadow: "var(--sh-3)" }}>
                  {activeDragLabel}
                </span>
              ) : null}
            </DragOverlay>
          </DndContext>

          <div className="muted tiny" style={{ marginTop: 8, textAlign: "center" }}>
            Astuce : glisse une relance sur un autre jour pour la reprogrammer.
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
      </div>}

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
