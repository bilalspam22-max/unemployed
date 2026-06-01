"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Send, Star, History, ChevronDown, ChevronUp, MessageSquare, MessageCircleReply } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { TempDot, Badge } from "@/components/ui/badge";
import { Drawer } from "@/components/ui/drawer";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ListSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/lib/store";
import { Users as UsersIcon, Search } from "lucide-react";
import { relativeDate, formatDate } from "@/lib/utils";
import type { Contact, Followup } from "@/lib/types";

type Filter = "all" | "hot" | "followup" | "week";

// ─── Contact Form ─────────────────────────────────────────────────────────────

function ContactForm({ onSubmit, onClose, initial }: {
  onSubmit: (data: Partial<Contact>) => Promise<void>;
  onClose: () => void;
  initial?: Partial<Contact>;
}) {
  const [d, setD] = useState({
    firstName:    initial?.firstName ?? "",
    lastName:     initial?.lastName  ?? "",
    role:         initial?.role      ?? "",
    email:        initial?.email     ?? "",
    linkedinUrl:  initial?.linkedinUrl ?? "",
    contactType:  initial?.contactType ?? "recruiter",
    temperature:  initial?.temperature ?? "cold",
    humanNotes:   initial?.humanNotes  ?? "",
    nextFollowupDate: initial?.nextFollowupDate ?? "",
    lastExchangeDate: initial?.lastExchangeDate ?? "",
    lastExchangeSummary: initial?.lastExchangeSummary ?? "",
    signalDetected: initial?.signalDetected ?? "",
    trustLevel:   initial?.trustLevel ?? 3,
  });
  const [saving, setSaving] = useState(false);

  function up(key: string, val: unknown) { setD(prev => ({ ...prev, [key]: val })); }

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSubmit({
      ...d,
      role:        d.role || null,
      email:       d.email || null,
      linkedinUrl: d.linkedinUrl || null,
      humanNotes:  d.humanNotes || null,
      nextFollowupDate: d.nextFollowupDate || null,
      lastExchangeDate: d.lastExchangeDate || null,
      lastExchangeSummary: d.lastExchangeSummary || null,
      signalDetected: d.signalDetected || null,
    });
    setSaving(false);
    onClose();
  }

  return (
    <form onSubmit={handle}>
      <div className="form-grid">
        <div className="field">
          <label className="label">Prénom *</label>
          <input className="input" value={d.firstName} onChange={e => up("firstName", e.target.value)} required />
        </div>
        <div className="field">
          <label className="label">Nom *</label>
          <input className="input" value={d.lastName} onChange={e => up("lastName", e.target.value)} required />
        </div>
      </div>
      <div className="form-grid">
        <div className="field">
          <label className="label">Rôle</label>
          <input className="input" value={d.role} onChange={e => up("role", e.target.value)} placeholder="DRH, Recruiter..." />
        </div>
        <div className="field">
          <label className="label">Type</label>
          <select className="input" value={d.contactType} onChange={e => up("contactType", e.target.value)}>
            <option value="recruiter">Recruteur</option>
            <option value="consultant">Consultant</option>
            <option value="engineer">Ingénieur</option>
            <option value="acquaintance">Connaissance</option>
            <option value="referral">Référence</option>
          </select>
        </div>
      </div>
      <div className="form-grid">
        <div className="field">
          <label className="label">Email</label>
          <input className="input" type="email" value={d.email} onChange={e => up("email", e.target.value)} />
        </div>
        <div className="field">
          <label className="label">LinkedIn URL</label>
          <input className="input" value={d.linkedinUrl} onChange={e => up("linkedinUrl", e.target.value)} placeholder="https://linkedin.com/in/..." />
        </div>
      </div>
      <div className="form-grid">
        <div className="field">
          <label className="label">Température</label>
          <select className="input" value={d.temperature} onChange={e => up("temperature", e.target.value)}>
            <option value="cold">Froid</option>
            <option value="warm">Tiède</option>
            <option value="hot">Chaud</option>
          </select>
        </div>
        <div className="field">
          <label className="label">Confiance (1-5)</label>
          <input className="input" type="number" min={1} max={5} value={d.trustLevel} onChange={e => up("trustLevel", parseInt(e.target.value))} />
        </div>
      </div>
      <div className="form-grid">
        <div className="field">
          <label className="label">Dernier échange</label>
          <input className="input" type="date" value={d.lastExchangeDate} onChange={e => up("lastExchangeDate", e.target.value)} />
        </div>
        <div className="field">
          <label className="label">Prochaine relance</label>
          <input className="input" type="date" value={d.nextFollowupDate} onChange={e => up("nextFollowupDate", e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label className="label">Résumé dernier échange</label>
        <textarea className="input" value={d.lastExchangeSummary} onChange={e => up("lastExchangeSummary", e.target.value)} rows={2} />
      </div>
      <div className="field">
        <label className="label">Signal détecté</label>
        <input className="input" value={d.signalDetected} onChange={e => up("signalDetected", e.target.value)} placeholder="Mentionne une ouverture en juin..." />
      </div>
      <div className="field">
        <label className="label">Notes personnelles</label>
        <textarea className="input" value={d.humanNotes} onChange={e => up("humanNotes", e.target.value)} rows={2} />
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button type="button" className="btn" onClick={onClose}>Annuler</button>
        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? "Enregistrement…" : initial ? "Mettre à jour" : "Créer"}
        </button>
      </div>
    </form>
  );
}

// ─── Archive Followup Modal ───────────────────────────────────────────────────

function ArchiveFollowupModal({ contact, onArchive, onClose }: {
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
        Archiver la relance de <strong>{contact.firstName} {contact.lastName}</strong> du{" "}
        <strong>{contact.nextFollowupDate ?? today}</strong>.
        Renseigne ce qui s'est passé, puis définis une nouvelle date si besoin.
      </p>

      <div className="field">
        <label className="label">
          <MessageSquare size={13} style={{ display: "inline", marginRight: 4 }} />
          Ce que j'ai dit / envoyé
        </label>
        <textarea
          className="input"
          value={myMessage}
          onChange={e => setMyMessage(e.target.value)}
          rows={3}
          placeholder="Ex : J'ai relancé par LinkedIn en mentionnant l'ouverture de poste vue sur leur site…"
        />
      </div>

      <div className="field">
        <label className="label">
          <MessageCircleReply size={13} style={{ display: "inline", marginRight: 4 }} />
          Réponse de l'interlocuteur (optionnel)
        </label>
        <textarea
          className="input"
          value={interlocutorResponse}
          onChange={e => setInterlocutorResponse(e.target.value)}
          rows={3}
          placeholder="Ex : Pas de réponse / A dit qu'il me rappelle fin juillet / A proposé un entretien le…"
        />
      </div>

      <div className="field">
        <label className="label">Prochaine date de relance (optionnel)</label>
        <input
          className="input"
          type="date"
          value={nextFollowupDate}
          onChange={e => setNextFollowupDate(e.target.value)}
          min={today}
        />
        <span style={{ fontSize: 11, color: "var(--muted)", marginTop: 4, display: "block" }}>
          Laisser vide pour ne pas planifier de nouvelle relance.
        </span>
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button type="button" className="btn" onClick={onClose}>Annuler</button>
        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? "Archivage…" : "Archiver cette relance"}
        </button>
      </div>
    </form>
  );
}

// ─── Contact History ──────────────────────────────────────────────────────────

function ContactHistory({ contactId }: { contactId: string }) {
  const [history, setHistory] = useState<Followup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    fetch(`/api/followups?contactId=${contactId}`)
      .then(r => r.json())
      .then(r => {
        const rows = Array.isArray(r.data) ? r.data : [];
        setHistory(rows.filter((f: Followup) => f.status === "completed"));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [contactId]);

  if (loading) return <div className="muted tiny" style={{ padding: "8px 0" }}>Chargement…</div>;
  if (history.length === 0) return (
    <div className="muted tiny" style={{ padding: "8px 0", fontStyle: "italic" }}>
      Aucune relance archivée pour ce contact.
    </div>
  );

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded(p => !p)}
        className="row gap-2"
        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink)", fontWeight: 600, fontSize: 12, padding: "4px 0", width: "100%" }}
      >
        <History size={13} />
        {history.length} relance{history.length > 1 ? "s" : ""} archivée{history.length > 1 ? "s" : ""}
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {expanded && (
        <div className="col gap-2" style={{ marginTop: 8 }}>
          {history.map(f => (
            <div
              key={f.id}
              style={{
                borderRadius: "var(--r-md)",
                border: "1px solid var(--border)",
                overflow: "hidden",
              }}
            >
              <div style={{
                background: "var(--surface-2)",
                padding: "6px 12px",
                fontSize: 11,
                fontWeight: 700,
                color: "var(--muted)",
                letterSpacing: "0.03em",
              }}>
                {formatDate(f.scheduledDate)}
              </div>
              {f.myMessage && (
                <div style={{ padding: "8px 12px", borderTop: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", marginBottom: 3 }}>
                    Ce que j'ai dit
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--ink)", whiteSpace: "pre-wrap" }}>{f.myMessage}</div>
                </div>
              )}
              {f.interlocutorResponse && (
                <div style={{ padding: "8px 12px", borderTop: "1px solid var(--border)", background: "var(--success-soft)" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--success)", textTransform: "uppercase", marginBottom: 3 }}>
                    Réponse reçue
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--ink)", whiteSpace: "pre-wrap" }}>{f.interlocutorResponse}</div>
                </div>
              )}
              {!f.myMessage && !f.interlocutorResponse && (
                <div style={{ padding: "8px 12px", fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>
                  Relance enregistrée sans notes.
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selected, setSelected] = useState<Contact | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [aiMessages, setAiMessages] = useState<Array<{ tone: string; toneLabel: string; message: string }> | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [archiveTarget, setArchiveTarget] = useState<Contact | null>(null);
  const { showToast } = useToast();

  const load = useCallback(async () => {
    const r = await fetch("/api/contacts").then(r => r.json());
    setContacts(r.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(data: Partial<Contact>) {
    const resp = await fetch("/api/contacts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const { data: created } = await resp.json();
    setContacts(prev => [created, ...prev]);
    showToast("Contact créé ✓");
  }

  async function handleUpdate(data: Partial<Contact>) {
    if (!selected) return;
    const resp = await fetch(`/api/contacts/${selected.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const { data: updated } = await resp.json();
    setContacts(prev => prev.map(c => c.id === updated.id ? updated : c));
    setSelected(updated);
    showToast("Contact mis à jour ✓");
  }

  async function handleDelete() {
    if (!selected) return;
    await fetch(`/api/contacts/${selected.id}`, { method: "DELETE" });
    setContacts(prev => prev.filter(c => c.id !== selected.id));
    setSelected(null);
    setConfirmDelete(false);
    showToast("Contact supprimé");
  }

  async function handleArchiveFollowup(contact: Contact, data: { myMessage: string; interlocutorResponse: string; nextFollowupDate: string }) {
    const today = new Date().toISOString().slice(0, 10);

    // Create archived followup record
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

    // Update contact: clear current followup date, update exchange info, set new date if provided
    const contactUpdate: Partial<Contact> = {
      lastExchangeDate: today,
      lastExchangeSummary: data.myMessage
        ? data.myMessage.slice(0, 200)
        : contact.lastExchangeSummary,
      nextFollowupDate: data.nextFollowupDate || null,
    };

    const resp = await fetch(`/api/contacts/${contact.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contactUpdate),
    });
    const { data: updated } = await resp.json();
    setContacts(prev => prev.map(c => c.id === updated.id ? updated : c));
    if (selected?.id === contact.id) setSelected(updated);

    setArchiveTarget(null);
    showToast(`Relance archivée — ${contact.firstName} ✓`);
  }

  async function loadAIMessages(contact: Contact) {
    setLoadingAI(true);
    setAiMessages(null);
    const resp = await fetch("/api/ai/suggest-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: contact.firstName,
        lastName: contact.lastName,
        role: contact.role,
        company: null,
        lastExchangeSummary: contact.lastExchangeSummary,
        signalDetected: contact.signalDetected,
      }),
    });
    const { data } = await resp.json();
    setAiMessages(data);
    setLoadingAI(false);
  }

  const today = new Date().toISOString().slice(0, 10);
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  const filtered = contacts.filter(c => {
    if (search && !`${c.firstName} ${c.lastName} ${c.role ?? ""}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === "hot") return c.temperature === "hot";
    if (filter === "followup") return !!c.nextFollowupDate;
    if (filter === "week") return !!c.nextFollowupDate && c.nextFollowupDate <= nextWeek;
    return true;
  });

  const FILTERS: Array<{ id: Filter; label: string }> = [
    { id: "all",      label: "Tous" },
    { id: "hot",      label: "Chauds" },
    { id: "followup", label: "À relancer" },
    { id: "week",     label: "Cette semaine" },
  ];

  return (
    <div className="main__inner">
      <div className="page-head">
        <div>
          <h1 className="page-head__title">Contacts</h1>
          <p className="page-head__sub">{contacts.length} contacts dans votre réseau</p>
        </div>
        <button className="btn btn--primary" onClick={() => setShowCreate(true)}>
          <Plus size={14} /> Nouveau contact
        </button>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search">
          <input placeholder="Rechercher un contact…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {FILTERS.map(f => (
          <button key={f.id} className={`chip ${filter === f.id ? "chip--active" : ""}`} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Contact list */}
      {loading ? (
        <ListSkeleton rows={5} />
      ) : (
      <div className="col gap-2">
        {filtered.length === 0 && (
          search || filter !== "all" ? (
            <EmptyState
              icon={Search}
              title="Aucun contact trouvé"
              description="Aucun contact ne correspond à ta recherche ou tes filtres actuels."
              tone="neutral"
            />
          ) : (
            <EmptyState
              icon={UsersIcon}
              title="Construis ton réseau"
              description="Ajoute tes premiers contacts — recruteurs, anciens collègues, consultants. Ils sont la clé d'une recherche d'emploi réussie."
              action={{ label: "Ajouter un contact", onClick: () => setShowCreate(true), icon: Plus }}
              tone="primary"
            />
          )
        )}
        {filtered.map(c => (
          <div key={c.id} className="contact-row" onClick={() => setSelected(c)}>
            <Avatar firstName={c.firstName} lastName={c.lastName} size="sm" />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                {c.firstName} {c.lastName}
                <TempDot temp={c.temperature} />
              </div>
              <div className="muted tiny">{c.role ?? "—"}</div>
            </div>
            <div className="muted tiny">{c.lastExchangeDate ? relativeDate(c.lastExchangeDate) : "Jamais"}</div>
            <div className="muted tiny" style={{ color: c.nextFollowupDate && c.nextFollowupDate <= today ? "var(--danger)" : undefined }}>
              {c.nextFollowupDate ? `Relance le ${c.nextFollowupDate}` : "—"}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {c.trustLevel !== null && Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={10} fill={i < (c.trustLevel ?? 0) ? "var(--warn)" : "none"} color={i < (c.trustLevel ?? 0) ? "var(--warn)" : "var(--border-strong)"} />
              ))}
            </div>
            {c.nextFollowupDate ? (
              <button
                className="btn btn--sm btn--primary"
                onClick={e => { e.stopPropagation(); setArchiveTarget(c); }}
              >
                <Send size={11} /> Relancer
              </button>
            ) : (
              <div style={{ width: 80 }} />
            )}
          </div>
        ))}
      </div>
      )}

      {/* Detail Drawer */}
      {selected && (
        <Drawer
          open={true}
          onClose={() => { setSelected(null); setAiMessages(null); }}
          title={`${selected.firstName} ${selected.lastName}`}
          subtitle={selected.role ?? undefined}
          footer={
            <>
              <button className="btn" style={{ color: "var(--danger)" }} onClick={() => setConfirmDelete(true)}>Supprimer</button>
              {selected.nextFollowupDate && (
                <button className="btn btn--full" onClick={() => setArchiveTarget(selected)}>
                  <Send size={13} /> Archiver la relance
                </button>
              )}
            </>
          }
        >
          <div>
            <div className="row gap-2" style={{ marginBottom: 16 }}>
              <TempDot temp={selected.temperature} />
              <Badge tone={selected.temperature === "hot" ? "danger" : selected.temperature === "warm" ? "warn" : "info"}>
                {selected.temperature === "hot" ? "Chaud" : selected.temperature === "warm" ? "Tiède" : "Froid"}
              </Badge>
            </div>

            {selected.lastExchangeSummary && (
              <div style={{ marginBottom: 16 }}>
                <div className="section-title">Dernier échange</div>
                <div className="card" style={{ padding: 12, background: "var(--surface-2)", fontSize: 13 }}>
                  <div className="muted tiny" style={{ marginBottom: 4 }}>{selected.lastExchangeDate ?? "Date inconnue"}</div>
                  {selected.lastExchangeSummary}
                </div>
              </div>
            )}

            {selected.signalDetected && (
              <div className="ai-card" style={{ marginBottom: 16 }}>
                <div className="ai-card__label">Signal détecté</div>
                <div className="ai-card__text">{selected.signalDetected}</div>
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <div className="section-title">Prochaine relance</div>
              <div className="row gap-2">
                <span style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: selected.nextFollowupDate && selected.nextFollowupDate <= today ? "var(--danger)" : undefined,
                }}>
                  {selected.nextFollowupDate ?? "Non définie"}
                </span>
                {selected.nextFollowupDate && selected.nextFollowupDate <= today && (
                  <Badge tone="danger">En retard</Badge>
                )}
              </div>
            </div>

            {/* Historique des relances */}
            <div style={{ marginBottom: 16 }}>
              <div className="section-title" style={{ marginBottom: 8 }}>
                <History size={13} style={{ display: "inline", marginRight: 4 }} />
                Historique des relances
              </div>
              <ContactHistory contactId={selected.id} />
            </div>

            {/* AI Suggestions */}
            <div style={{ marginBottom: 16 }}>
              <div className="row between" style={{ marginBottom: 8 }}>
                <div className="section-title">Suggestions de messages</div>
                <button
                  className="btn btn--sm"
                  onClick={() => loadAIMessages(selected)}
                  disabled={loadingAI}
                >
                  {loadingAI ? "Génération…" : "Générer"}
                </button>
              </div>
              {aiMessages && (
                <div className="col gap-3">
                  {aiMessages.map((m, i) => (
                    <div key={i} style={{ background: "var(--primary-soft)", borderRadius: "var(--r-md)", padding: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--primary-ink)", opacity: 0.7, marginBottom: 6, textTransform: "uppercase" }}>
                        {m.toneLabel}
                      </div>
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
              )}
            </div>

            <div className="divider" />

            <div className="section-title">Modifier</div>
            <ContactForm initial={selected} onSubmit={handleUpdate} onClose={() => setSelected(null)} />
          </div>
        </Drawer>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nouveau contact" size="lg">
        <ContactForm onSubmit={handleCreate} onClose={() => setShowCreate(false)} />
      </Modal>

      {/* Archive Followup Modal */}
      {archiveTarget && (
        <Modal
          open={true}
          onClose={() => setArchiveTarget(null)}
          title="Archiver cette relance"
          size="md"
        >
          <ArchiveFollowupModal
            contact={archiveTarget}
            onArchive={data => handleArchiveFollowup(archiveTarget, data)}
            onClose={() => setArchiveTarget(null)}
          />
        </Modal>
      )}

      <ConfirmDialog
        open={confirmDelete}
        message="Ce contact sera définitivement supprimé. Cette action est irréversible."
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
