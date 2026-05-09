"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, Plus } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/lib/store";
import { formatDateShort } from "@/lib/utils";
import type { Followup, Contact } from "@/lib/types";

export default function FollowupsPage() {
  const [followups, setFollowups]   = useState<Followup[]>([]);
  const [contacts, setContacts]     = useState<Contact[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [aiMessages, setAiMessages] = useState<Array<{ tone: string; toneLabel: string; message: string }> | null>(null);
  const [loadingAI, setLoadingAI]   = useState(false);
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const { showToast } = useToast();

  const load = useCallback(() => {
    fetch("/api/followups").then(r => r.json()).then(r => setFollowups(r.data ?? []));
    fetch("/api/contacts").then(r => r.json()).then(r => setContacts(r.data ?? []));
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

  const followupsByDay: Record<number, Followup[]> = {};
  followups.forEach(f => {
    const d = new Date(f.scheduledDate);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!followupsByDay[day]) followupsByDay[day] = [];
      followupsByDay[day].push(f);
    }
  });

  const weekFollowups = followups.filter(f => f.status === "pending" && f.scheduledDate >= todayStr && f.scheduledDate <= nextWeekStr);
  const contactMap    = Object.fromEntries(contacts.map(c => [c.id, c]));

  const MONTH_NAMES = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
  const DAY_LABELS  = ["L","M","M","J","V","S","D"];

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

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 24 }}>
        {/* Calendrier */}
        <div className="card card__pad-lg">
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>
            {MONTH_NAMES[month]} {year}
          </div>
          <div className="cal">
            {DAY_LABELS.map((d, i) => <div key={i} className="cal__head">{d}</div>)}
            {cells.map((day, i) => {
              const dayFollowups = day ? (followupsByDay[day] ?? []) : [];
              const isToday = day === today;
              const isSelected = day === selectedDay;
              return (
                <div
                  key={i}
                  className={`cal__cell${!day ? " cal__cell--out" : ""}${isToday ? " cal__cell--today" : ""}${isSelected ? " cal__cell--selected" : ""}`}
                  onClick={() => day && setSelectedDay(day === selectedDay ? null : day)}
                >
                  {day && <span className="cal__day">{day}</span>}
                  <div className="cal__events">
                    {dayFollowups.slice(0, 2).map(f => (
                      <div key={f.id} className={`cal__ev${f.status === "completed" ? " cal__ev--success" : ""}`}>
                        {contactMap[f.contactId ?? ""]?.firstName ?? "…"}
                      </div>
                    ))}
                    {dayFollowups.length > 2 && (
                      <div className="cal__ev">+{dayFollowups.length - 2}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
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
                      "{contact.lastExchangeSummary.slice(0, 80)}…"
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
