"use client";

import { useEffect, useState, useCallback } from "react";
import {
  DndContext, DragEndEvent, DragStartEvent, DragOverlay,
  PointerSensor, useSensor, useSensors, useDroppable, useDraggable,
} from "@dnd-kit/core";
import {
  Network, Users, KanbanSquare, CalendarCheck, Unlink, UserCheck,
  Pencil, Link2, ChevronDown, ChevronUp, GripVertical, RefreshCw,
} from "lucide-react";
import { Badge, TempDot } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Drawer } from "@/components/ui/drawer";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ListSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/lib/store";
import { formatDate, statusLabel, statusColor } from "@/lib/utils";
import type { Company, Contact, Application, Meeting, Sector } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OverviewData {
  companies: Company[];
  contacts: Contact[];
  applications: Application[];
  meetings: Meeting[];
}

type EntityType = "contact" | "application" | "meeting";
const UNLINKED = "__unlinked__";

const TYPE_CFG = {
  contact:     { color: "var(--primary)", icon: Users,         label: "Contact" },
  application: { color: "var(--success)", icon: KanbanSquare,  label: "Candidature" },
  meeting:     { color: "var(--plum)",    icon: CalendarCheck, label: "Réunion" },
} as const;

// ─── Draggable chip ───────────────────────────────────────────────────────────

function DraggableItem({ dragId, type, children, onDoubleClick }: {
  dragId: string; type: EntityType; children: React.ReactNode; onDoubleClick?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: dragId });
  const style = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : undefined;
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`ov-item ov-item--${type} ${isDragging ? "is-dragging" : ""}`}
      title={onDoubleClick ? "Double-cliquer pour éditer" : undefined}
      onDoubleClick={onDoubleClick}
      {...attributes}
      {...listeners}
    >
      <GripVertical size={12} className="ov-item__grip" />
      {children}
    </div>
  );
}

// ─── Droppable zone wrapper ───────────────────────────────────────────────────

function DropZone({ id, children, className }: { id: string; children: React.ReactNode; className?: string }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`${className ?? ""} ${isOver ? "is-drop-target" : ""}`}>
      {children}
    </div>
  );
}

// ─── Company edit drawer ──────────────────────────────────────────────────────

// ─── Quick edit modals (double-click on an item) ──────────────────────────────

const APP_STATUS_OPTS: Array<{ id: Application["status"]; label: string }> = [
  { id: "to_prepare", label: "À préparer" },
  { id: "cv_sent", label: "CV envoyé" },
  { id: "followup_planned", label: "Relance prévue" },
  { id: "in_discussion", label: "En discussion" },
  { id: "interview", label: "Entretien" },
  { id: "waiting", label: "En attente" },
  { id: "rejected", label: "Refus" },
  { id: "won", label: "Gagnée" },
];

function ContactQuickEdit({ contact, companies, sectors, onClose, onSaved }: {
  contact: Contact; companies: Company[]; sectors: Sector[]; onClose: () => void; onSaved: () => void;
}) {
  const [d, setD] = useState({
    firstName: contact.firstName, lastName: contact.lastName,
    role: contact.role ?? "", email: contact.email ?? "",
    temperature: contact.temperature ?? "cold",
    nextFollowupDate: contact.nextFollowupDate ?? "",
    companyId: contact.companyId ?? "",
    companyName: "",
    companySectorId: "",
  });
  const [isNewCompany, setIsNewCompany] = useState(false);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();
  const up = (k: string, v: unknown) => setD(p => ({ ...p, [k]: v }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const body: Record<string, unknown> = {
      firstName: d.firstName, lastName: d.lastName,
      role: d.role || null, email: d.email || null,
      temperature: d.temperature, nextFollowupDate: d.nextFollowupDate || null,
    };
    if (isNewCompany) {
      body.companyName = d.companyName || null;
      body.companySectorId = d.companySectorId || null;
    } else {
      body.companyId = d.companyId || null;
    }
    const resp = await fetch(`/api/contacts/${contact.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    const json = await resp.json();
    setSaving(false);
    if (!resp.ok || !json.data) { showToast(json.error ?? "Erreur", "error"); return; }
    showToast("Contact mis à jour ✓");
    onSaved(); onClose();
  }

  return (
    <form onSubmit={save}>
      <div className="form-grid">
        <div className="field"><label className="label">Prénom *</label>
          <input className="input" value={d.firstName} onChange={e => up("firstName", e.target.value)} required autoFocus /></div>
        <div className="field"><label className="label">Nom *</label>
          <input className="input" value={d.lastName} onChange={e => up("lastName", e.target.value)} required /></div>
      </div>
      <div className="form-grid">
        <div className="field"><label className="label">Rôle</label>
          <input className="input" value={d.role} onChange={e => up("role", e.target.value)} placeholder="DRH, CTO…" /></div>
        <div className="field"><label className="label">Température</label>
          <select className="input" value={d.temperature} onChange={e => up("temperature", e.target.value)}>
            <option value="cold">Froid</option><option value="warm">Tiède</option><option value="hot">Chaud</option>
          </select></div>
      </div>

      {/* Société (existante ou nouvelle) */}
      <div className="field">
        <label className="label">Société</label>
        <select
          className="input"
          value={isNewCompany ? "__new__" : d.companyId}
          onChange={e => {
            if (e.target.value === "__new__") { setIsNewCompany(true); }
            else { setIsNewCompany(false); up("companyId", e.target.value); }
          }}
        >
          <option value="">— Aucune —</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          <option value="__new__">＋ Nouvelle société…</option>
        </select>
      </div>
      {isNewCompany && (
        <div className="form-grid">
          <div className="field"><label className="label">Nom de la nouvelle société *</label>
            <input className="input" value={d.companyName} onChange={e => up("companyName", e.target.value)} placeholder="Airbus, Capgemini…" /></div>
          <div className="field"><label className="label">Secteur</label>
            <select className="input" value={d.companySectorId} onChange={e => up("companySectorId", e.target.value)}>
              <option value="">— Aucun —</option>
              {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select></div>
        </div>
      )}

      <div className="form-grid">
        <div className="field"><label className="label">Email</label>
          <input className="input" type="email" value={d.email} onChange={e => up("email", e.target.value)} /></div>
        <div className="field"><label className="label">Prochaine relance</label>
          <input className="input" type="date" value={d.nextFollowupDate} onChange={e => up("nextFollowupDate", e.target.value)} /></div>
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button type="button" className="btn" onClick={onClose}>Annuler</button>
        <button type="submit" className="btn btn--primary" disabled={saving}>{saving ? "…" : "Enregistrer"}</button>
      </div>
    </form>
  );
}

function ApplicationQuickEdit({ application, onClose, onSaved }: {
  application: Application; onClose: () => void; onSaved: () => void;
}) {
  const [d, setD] = useState({
    jobTitle: application.jobTitle,
    status: application.status,
    sentDate: application.sentDate ?? "",
    sourceUrl: application.sourceUrl ?? "",
    nextAction: application.nextAction ?? "",
  });
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();
  const up = (k: string, v: unknown) => setD(p => ({ ...p, [k]: v }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const resp = await fetch(`/api/applications/${application.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobTitle: d.jobTitle, status: d.status,
        sentDate: d.sentDate || null, sourceUrl: d.sourceUrl || null, nextAction: d.nextAction || null,
      }),
    });
    const json = await resp.json();
    setSaving(false);
    if (!resp.ok || !json.data) { showToast(json.error ?? "Erreur", "error"); return; }
    showToast("Candidature mise à jour ✓");
    onSaved(); onClose();
  }

  return (
    <form onSubmit={save}>
      <div className="field"><label className="label">Intitulé du poste *</label>
        <input className="input" value={d.jobTitle} onChange={e => up("jobTitle", e.target.value)} required autoFocus /></div>
      <div className="form-grid">
        <div className="field"><label className="label">Statut</label>
          <select className="input" value={d.status} onChange={e => up("status", e.target.value)}>
            {APP_STATUS_OPTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select></div>
        <div className="field"><label className="label">Date d&apos;envoi</label>
          <input className="input" type="date" value={d.sentDate} onChange={e => up("sentDate", e.target.value)} /></div>
      </div>
      <div className="field"><label className="label">Lien de l&apos;offre</label>
        <input className="input" value={d.sourceUrl} onChange={e => up("sourceUrl", e.target.value)} placeholder="https://…" /></div>
      <div className="field"><label className="label">Prochaine action</label>
        <input className="input" value={d.nextAction} onChange={e => up("nextAction", e.target.value)} placeholder="Relancer le…" /></div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button type="button" className="btn" onClick={onClose}>Annuler</button>
        <button type="submit" className="btn btn--primary" disabled={saving}>{saving ? "…" : "Enregistrer"}</button>
      </div>
    </form>
  );
}

function CompanyEditDrawer({ company, sectors, onClose, onSaved, onDeleted }: {
  company: Company; sectors: Sector[]; onClose: () => void; onSaved: () => void; onDeleted: () => void;
}) {
  const [name, setName]         = useState(company.name);
  const [sectorId, setSectorId] = useState(company.sectorId ?? "");
  const [location, setLocation] = useState(company.location ?? "");
  const [status, setStatus]     = useState(company.status);
  const [saving, setSaving]     = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { showToast } = useToast();

  async function save() {
    setSaving(true);
    const resp = await fetch(`/api/companies/${company.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, sectorId: sectorId || null, location: location || null, status }),
    });
    const json = await resp.json();
    setSaving(false);
    if (!resp.ok || !json.data) { showToast(json.error ?? "Erreur", "error"); return; }
    showToast("Société mise à jour ✓");
    onSaved();
    onClose();
  }

  async function remove() {
    const resp = await fetch(`/api/companies/${company.id}`, { method: "DELETE" });
    if (!resp.ok) { showToast("Erreur lors de la suppression", "error"); return; }
    showToast("Société supprimée");
    setConfirmDelete(false);
    onDeleted();
    onClose();
  }

  const STATUS_OPTS = ["to_contact","contacted","followed_up","interview","rejected","hot_opportunity"];

  return (
    <Drawer
      open={true}
      onClose={onClose}
      title={`Éditer ${company.name}`}
      footer={
        <>
          <button className="btn" style={{ color: "var(--danger)" }} onClick={() => setConfirmDelete(true)}>
            Supprimer
          </button>
          <button className="btn btn--primary btn--full" onClick={save} disabled={saving}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </>
      }
    >
      <div className="field">
        <label className="label">Nom de la société</label>
        <input className="input" value={name} onChange={e => setName(e.target.value)} autoFocus />
      </div>
      <div className="field">
        <label className="label">Secteur</label>
        <select className="input" value={sectorId} onChange={e => setSectorId(e.target.value)}>
          <option value="">— Aucun —</option>
          {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div className="field">
        <label className="label">Localisation</label>
        <input className="input" value={location} onChange={e => setLocation(e.target.value)} placeholder="Paris, Remote…" />
      </div>
      <div className="field">
        <label className="label">Statut</label>
        <select className="input" value={status} onChange={e => setStatus(e.target.value as Company["status"])}>
          {STATUS_OPTS.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
        </select>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        message={`Supprimer « ${company.name} » ? Ses contacts, candidatures et réunions ne seront pas supprimés — ils repasseront simplement en « non reliés ».`}
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </Drawer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OverviewPage() {
  const [data, setData]       = useState<OverviewData>({ companies: [], contacts: [], applications: [], meetings: [] });
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch]   = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [activeDrag, setActiveDrag] = useState<{ type: EntityType; label: string } | null>(null);
  const [linkPicker, setLinkPicker] = useState<{ type: EntityType; id: string } | null>(null);
  const [editCompany, setEditCompany] = useState<Company | null>(null);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [editApp, setEditApp] = useState<Application | null>(null);
  const { showToast } = useToast();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  // Load each entity from its own endpoint (the same ones the working pages use),
  // so the board never blanks out just because the combined /api/overview fails.
  const load = useCallback(async () => {
    setLoadError(null);
    async function getList<T>(url: string): Promise<T[]> {
      try {
        const r = await fetch(url).then(res => res.json());
        return Array.isArray(r.data) ? r.data : [];
      } catch {
        return [];
      }
    }
    try {
      const [companies, contacts, applications, meetings, secs] = await Promise.all([
        getList<Company>("/api/companies"),
        getList<Contact>("/api/contacts"),
        getList<Application>("/api/applications"),
        getList<Meeting>("/api/meetings"),
        getList<Sector>("/api/sectors"),
      ]);
      setData({ companies, contacts, applications, meetings });
      setSectors(secs);
    } catch (e) {
      console.error("[Overview] load error:", e);
      setLoadError("Impossible de charger les données. Réessaie.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const { companies, contacts, applications, meetings } = data;
  const sectorMap = Object.fromEntries(sectors.map(s => [s.id, s]));

  // ── Link / unlink ──
  async function linkEntity(type: EntityType, id: string, companyId: string | null) {
    const endpoint = type === "contact" ? "contacts" : type === "application" ? "applications" : "meetings";
    const body: Record<string, string | null> = { companyId };
    if (type === "application" && companyId === null) body.contactId = null;

    // optimistic update
    setData(prev => {
      const apply = <T extends { id: string }>(arr: T[]) =>
        arr.map(item => item.id === id ? { ...item, ...body } : item);
      if (type === "contact")     return { ...prev, contacts: apply(prev.contacts) };
      if (type === "application") return { ...prev, applications: apply(prev.applications) };
      return { ...prev, meetings: apply(prev.meetings) };
    });

    const resp = await fetch(`/api/${endpoint}/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    if (!resp.ok) { showToast("Erreur lors de la liaison", "error"); load(); return; }
    showToast(companyId ? "Relié ✓" : "Détaché");
  }

  async function assignContact(applicationId: string, contactId: string | null) {
    setData(prev => ({
      ...prev,
      applications: prev.applications.map(a => a.id === applicationId ? { ...a, contactId } : a),
    }));
    const resp = await fetch(`/api/applications/${applicationId}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contactId }),
    });
    if (!resp.ok) { showToast("Erreur", "error"); load(); return; }
    showToast(contactId ? "Responsable assigné ✓" : "Responsable retiré");
  }

  // ── Drag handlers ──
  function handleDragStart(e: DragStartEvent) {
    const [type, id] = String(e.active.id).split(":") as [EntityType, string];
    let label = "";
    if (type === "contact")     { const c = contacts.find(x => x.id === id); label = c ? `${c.firstName} ${c.lastName}` : ""; }
    if (type === "application") { const a = applications.find(x => x.id === id); label = a?.jobTitle ?? ""; }
    if (type === "meeting")     { const m = meetings.find(x => x.id === id); label = m?.title ?? ""; }
    setActiveDrag({ type, label });
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveDrag(null);
    const { active, over } = e;
    if (!over) return;
    const [type, id] = String(active.id).split(":") as [EntityType, string];
    const target = String(over.id);
    if (target === UNLINKED) {
      linkEntity(type, id, null);
    } else if (companies.some(c => c.id === target)) {
      linkEntity(type, id, target);
    }
  }

  function toggleCollapse(id: string) {
    setCollapsed(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  // ── Filtering ──
  const s = search.toLowerCase();
  const matchCompany = (c: Company) => !s || c.name.toLowerCase().includes(s);

  const orphanContacts     = contacts.filter(c => !c.companyId).filter(c => !s || `${c.firstName} ${c.lastName}`.toLowerCase().includes(s));
  const orphanApplications = applications.filter(a => !a.companyId).filter(a => !s || a.jobTitle.toLowerCase().includes(s));
  const orphanMeetings     = meetings.filter(m => !m.companyId).filter(m => !s || m.title.toLowerCase().includes(s));
  const totalOrphans = orphanContacts.length + orphanApplications.length + orphanMeetings.length;

  const visibleCompanies = companies.filter(matchCompany);

  if (loading) return (
    <div className="main__inner">
      <div className="page-head"><div><h1 className="page-head__title">Overview</h1><p className="page-head__sub">Chargement…</p></div></div>
      <ListSkeleton rows={5} />
    </div>
  );

  return (
    <div className="main__inner">
      <div className="page-head">
        <div>
          <h1 className="page-head__title">Overview</h1>
          <p className="page-head__sub">
            {companies.length} société{companies.length !== 1 ? "s" : ""} · {contacts.length} contact{contacts.length !== 1 ? "s" : ""} · {applications.length} candidature{applications.length !== 1 ? "s" : ""}
            {totalOrphans > 0 && <span style={{ color: "var(--warn)" }}> · {totalOrphans} à relier</span>}
          </p>
        </div>
      </div>

      <div className="toolbar">
        <div className="search" style={{ flex: 1 }}>
          <input placeholder="Rechercher une société…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="btn" onClick={() => load()} title="Recharger les données">
          <RefreshCw size={14} /> Actualiser
        </button>
      </div>

      {loadError && (
        <div className="card" style={{ padding: "12px 16px", marginBottom: 16, background: "var(--danger-soft)", border: "1px solid var(--danger)" }}>
          <div className="row gap-2" style={{ color: "var(--danger)", fontWeight: 600, fontSize: 13 }}>
            ⚠ {loadError}
            <button className="btn btn--sm" style={{ marginLeft: "auto" }} onClick={() => load()}>Réessayer</button>
          </div>
        </div>
      )}

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>

        {/* ── Bac non reliés ── */}
        {totalOrphans > 0 && (
          <DropZone id={UNLINKED} className="ov-tray">
            <div className="ov-tray__head">
              <Unlink size={14} color="var(--warn)" />
              <span>Non reliés ({totalOrphans}) — glisse-les sur une société, ou clique « Relier »</span>
            </div>
            <div className="ov-tray__items">
              {orphanContacts.map(c => (
                <DraggableItem key={c.id} dragId={`contact:${c.id}`} type="contact" onDoubleClick={() => setEditContact(c)}>
                  <TempDot temp={c.temperature} />
                  <span className="ov-item__label">{c.firstName} {c.lastName}</span>
                  <button className="ov-item__link" title="Relier à une société" onClick={() => setLinkPicker({ type: "contact", id: c.id })}>
                    <Link2 size={12} />
                  </button>
                </DraggableItem>
              ))}
              {orphanApplications.map(a => (
                <DraggableItem key={a.id} dragId={`application:${a.id}`} type="application" onDoubleClick={() => setEditApp(a)}>
                  <KanbanSquare size={12} color="var(--success)" />
                  <span className="ov-item__label">{a.jobTitle}</span>
                  <button className="ov-item__link" title="Relier à une société" onClick={() => setLinkPicker({ type: "application", id: a.id })}>
                    <Link2 size={12} />
                  </button>
                </DraggableItem>
              ))}
              {orphanMeetings.map(m => (
                <DraggableItem key={m.id} dragId={`meeting:${m.id}`} type="meeting">
                  <CalendarCheck size={12} color="var(--plum)" />
                  <span className="ov-item__label">{m.title}</span>
                  <button className="ov-item__link" title="Relier à une société" onClick={() => setLinkPicker({ type: "meeting", id: m.id })}>
                    <Link2 size={12} />
                  </button>
                </DraggableItem>
              ))}
            </div>
          </DropZone>
        )}

        {/* ── Grille des sociétés ── */}
        {companies.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--muted)" }}>
            <Network size={36} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, color: "var(--ink)" }}>Aucune société pour l&apos;instant</div>
            <div style={{ fontSize: 13, marginBottom: 4 }}>
              Une société se crée depuis la fiche <a href="/contacts" style={{ color: "var(--primary)", fontWeight: 600 }}>Contact</a> :
              ouvre un contact, déroule le champ « Société » et choisis « ＋ Nouvelle société ».
            </div>
            {(contacts.length > 0 || applications.length > 0) && (
              <div style={{ fontSize: 12.5, color: "var(--warn)", marginTop: 8 }}>
                Tu as déjà {contacts.length} contact{contacts.length !== 1 ? "s" : ""} et {applications.length} candidature{applications.length !== 1 ? "s" : ""} — ils apparaissent dans « Non reliés » ci-dessus, prêts à être rattachés à une société.
              </div>
            )}
          </div>
        ) : (
          <div className="overview-board">
            {visibleCompanies.map(company => {
              const cc = contacts.filter(c => c.companyId === company.id);
              const ca = applications.filter(a => a.companyId === company.id);
              const cm = meetings.filter(m => m.companyId === company.id);
              const sector = company.sectorId ? sectorMap[company.sectorId] : null;
              const isCollapsed = collapsed.has(company.id);

              return (
                <DropZone key={company.id} id={company.id} className="ov-company">
                  {/* Header */}
                  <div className="ov-company__head">
                    <div className="ov-company__avatar">{company.name.charAt(0).toUpperCase()}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="ov-company__name">{company.name}</div>
                      <div className="ov-company__meta">
                        {sector && (
                          <span className="ov-sector-chip">
                            <span className="ov-sector-dot" style={{ background: sector.color }} />
                            {sector.name}
                          </span>
                        )}
                        <span className="muted tiny">{cc.length}👤 · {ca.length}📄 · {cm.length}📅</span>
                      </div>
                    </div>
                    <button className="btn btn--ghost btn--icon" title="Éditer la société" onClick={() => setEditCompany(company)}>
                      <Pencil size={13} />
                    </button>
                    <button className="btn btn--ghost btn--icon" title={isCollapsed ? "Déplier" : "Replier"} onClick={() => toggleCollapse(company.id)}>
                      {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                    </button>
                  </div>

                  {!isCollapsed && (
                    <div className="ov-company__body">
                      {/* Contacts */}
                      <div className="ov-section">
                        <div className="ov-section__title"><Users size={11} /> Contacts ({cc.length})</div>
                        {cc.length === 0 && <div className="ov-empty">Glisse un contact ici</div>}
                        {cc.map(c => (
                          <DraggableItem key={c.id} dragId={`contact:${c.id}`} type="contact" onDoubleClick={() => setEditContact(c)}>
                            <TempDot temp={c.temperature} />
                            <span className="ov-item__label">{c.firstName} {c.lastName}{c.role ? ` · ${c.role}` : ""}</span>
                            <button className="ov-item__link" title="Détacher" onClick={() => linkEntity("contact", c.id, null)}>
                              <Unlink size={11} />
                            </button>
                          </DraggableItem>
                        ))}
                      </div>

                      {/* Candidatures */}
                      <div className="ov-section">
                        <div className="ov-section__title"><KanbanSquare size={11} /> Candidatures ({ca.length})</div>
                        {ca.length === 0 && <div className="ov-empty">Glisse une candidature ici</div>}
                        {ca.map(a => {
                          const resp = a.contactId ? contacts.find(c => c.id === a.contactId) : null;
                          return (
                            <div key={a.id} className="ov-app">
                              <DraggableItem dragId={`application:${a.id}`} type="application" onDoubleClick={() => setEditApp(a)}>
                                <KanbanSquare size={12} color="var(--success)" />
                                <span className="ov-item__label">{a.jobTitle}</span>
                                <Badge tone={statusColor(a.status) as "info" | "success" | "warn" | "danger" | "neutral" | "plum"}>{statusLabel(a.status)}</Badge>
                                <button className="ov-item__link" title="Détacher" onClick={() => linkEntity("application", a.id, null)}>
                                  <Unlink size={11} />
                                </button>
                              </DraggableItem>
                              <div className="ov-app__resp">
                                <UserCheck size={11} color={resp ? "var(--success)" : "var(--muted)"} />
                                {cc.length > 0 ? (
                                  <select
                                    className="input ov-app__select"
                                    value={a.contactId ?? ""}
                                    onChange={e => assignContact(a.id, e.target.value || null)}
                                  >
                                    <option value="">Responsable…</option>
                                    {cc.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
                                  </select>
                                ) : (
                                  <span className="muted tiny" style={{ fontStyle: "italic" }}>Ajoute un contact d&apos;abord</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Réunions */}
                      {cm.length > 0 && (
                        <div className="ov-section">
                          <div className="ov-section__title"><CalendarCheck size={11} /> Réunions ({cm.length})</div>
                          {cm.map(m => (
                            <DraggableItem key={m.id} dragId={`meeting:${m.id}`} type="meeting">
                              <CalendarCheck size={12} color="var(--plum)" />
                              <span className="ov-item__label">{m.title} · {formatDate(m.date)}</span>
                              <button className="ov-item__link" title="Détacher" onClick={() => linkEntity("meeting", m.id, null)}>
                                <Unlink size={11} />
                              </button>
                            </DraggableItem>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </DropZone>
              );
            })}
          </div>
        )}

        {/* Drag overlay (ghost) */}
        <DragOverlay>
          {activeDrag ? (
            <div className={`ov-item ov-item--${activeDrag.type}`} style={{ boxShadow: "var(--sh-3)", opacity: 0.95 }}>
              <GripVertical size={12} className="ov-item__grip" />
              <span className="ov-item__label">{activeDrag.label}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Link picker modal (touch fallback) */}
      <Modal
        open={!!linkPicker}
        onClose={() => setLinkPicker(null)}
        title="Relier à une société"
        size="sm"
      >
        <div className="col gap-2">
          {companies.length === 0 && (
            <div className="muted" style={{ fontSize: 13 }}>Aucune société. Crée-en une depuis la fiche Contact.</div>
          )}
          {companies.map(c => (
            <button
              key={c.id}
              className="btn btn--full"
              style={{ justifyContent: "flex-start" }}
              onClick={() => { if (linkPicker) linkEntity(linkPicker.type, linkPicker.id, c.id); setLinkPicker(null); }}
            >
              {c.name}
            </button>
          ))}
        </div>
      </Modal>

      {/* Company edit drawer */}
      {editCompany && (
        <CompanyEditDrawer
          company={editCompany}
          sectors={sectors}
          onClose={() => setEditCompany(null)}
          onSaved={load}
          onDeleted={load}
        />
      )}

      {/* Quick edit (double-click) */}
      <Modal open={!!editContact} onClose={() => setEditContact(null)} title="Éditer le contact" size="md">
        {editContact && (
          <ContactQuickEdit
            contact={editContact}
            companies={companies}
            sectors={sectors}
            onClose={() => setEditContact(null)}
            onSaved={load}
          />
        )}
      </Modal>
      <Modal open={!!editApp} onClose={() => setEditApp(null)} title="Éditer la candidature" size="md">
        {editApp && (
          <ApplicationQuickEdit application={editApp} onClose={() => setEditApp(null)} onSaved={load} />
        )}
      </Modal>
    </div>
  );
}
