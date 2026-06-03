"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  DndContext, DragEndEvent, DragStartEvent, DragOverlay,
  PointerSensor, useSensor, useSensors, useDroppable, useDraggable,
} from "@dnd-kit/core";
import { Plus, ChevronRight, GripVertical, Inbox } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/lib/store";
import { getDraft, clearDraft, saveDraft, type DraftEntry } from "@/lib/drafts";
import { DraftBanner } from "@/components/ui/draft-banner";
import { statusLabel } from "@/lib/utils";
import type { Sector, Company, Application } from "@/lib/types";

const SECTOR_COLORS = [
  "#3D5BE3", "#2A9D6E", "#E08A2B", "#8B5CB8", "#D44A5C", "#3B83C9",
];

function SectorCard({ sector, companies, applications, onEdit }: {
  sector: Sector;
  companies: Company[];
  applications: Application[];
  onEdit: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `sector:${sector.id}` });
  const sectorCompanies  = companies.filter(c => c.sectorId === sector.id);
  const activeCompanies  = sectorCompanies.filter(c => c.status !== "rejected");
  const hotOpportunities = sectorCompanies.filter(c => c.status === "hot_opportunity");
  const sectorApps       = applications.filter(a => a.sectorId === sector.id);

  // Funnel: sent → in_discussion → interview → won
  const sent       = sectorApps.length;
  const responded  = sectorApps.filter(a => ["in_discussion", "interview", "waiting", "won"].includes(a.status)).length;
  const interviews = sectorApps.filter(a => ["interview", "won"].includes(a.status)).length;
  const won        = sectorApps.filter(a => a.status === "won").length;

  const responseRate    = sent > 0 ? Math.round((responded  / sent)   * 100) : 0;
  const interviewRate   = sent > 0 ? Math.round((interviews / sent)   * 100) : 0;

  return (
    <div ref={setNodeRef} className={`sector-card ${isOver ? "is-drop-target" : ""}`} onClick={onEdit}>
      <div className="sector-card__strip" style={{ background: sector.color }} />
      <div className="sector-card__body">
        <div className="row between">
          <div className="sector-card__title">{sector.name}</div>
          <ChevronRight size={16} color="var(--ink-3)" />
        </div>

        <div className="sector-card__stats">
          <div>
            <div className="sector-card__stat-num">{sectorCompanies.length}</div>
            <div className="sector-card__stat-lbl">Entreprises</div>
          </div>
          <div>
            <div className="sector-card__stat-num">{activeCompanies.length}</div>
            <div className="sector-card__stat-lbl">Actives</div>
          </div>
          <div>
            <div className="sector-card__stat-num" style={{ color: sector.color }}>{hotOpportunities.length}</div>
            <div className="sector-card__stat-lbl">Opportunités</div>
          </div>
        </div>

        {/* Mini funnel: only if there are applications */}
        {sent > 0 && (
          <div style={{ marginTop: 16 }}>
            <div className="muted tiny" style={{ marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
              <span>Pipeline ({sent} candidature{sent > 1 ? "s" : ""})</span>
              <span style={{ color: sector.color, fontWeight: 700 }}>{responseRate}% réponse · {interviewRate}% entretien</span>
            </div>
            <FunnelBars sent={sent} responded={responded} interviews={interviews} won={won} color={sector.color} />
          </div>
        )}
      </div>
    </div>
  );
}

function FunnelBars({ sent, responded, interviews, won, color }: {
  sent: number; responded: number; interviews: number; won: number; color: string;
}) {
  const bars = [
    { label: "Envoyé",    count: sent,       width: 100 },
    { label: "En discussion", count: responded,  width: sent > 0 ? (responded / sent) * 100 : 0 },
    { label: "Entretien", count: interviews, width: sent > 0 ? (interviews / sent) * 100 : 0 },
    { label: "Gagné",     count: won,        width: sent > 0 ? (won / sent) * 100 : 0 },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {bars.map((b, i) => (
        <div key={i} style={{
          height: 16,
          background: "var(--surface-2)",
          borderRadius: 3,
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{
            height: "100%",
            width: `${Math.max(b.width, b.count > 0 ? 4 : 0)}%`,
            background: color,
            opacity: 0.3 + (0.2 * i),
            transition: "width 0.4s ease",
          }} />
          <div style={{
            position: "absolute",
            top: 0,
            left: 8,
            height: "100%",
            display: "flex",
            alignItems: "center",
            fontSize: 10,
            fontWeight: 600,
            color: "var(--ink-2)",
          }}>
            {b.label} {b.count > 0 && <span style={{ marginLeft: 6, fontVariantNumeric: "tabular-nums" }}>· {b.count}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function SectorForm({ onSubmit, onClose, initial, draftEnabled }: {
  onSubmit: (d: Partial<Sector>) => Promise<void>;
  onClose: () => void;
  initial?: Partial<Sector>;
  draftEnabled?: boolean;
}) {
  const isCreate = draftEnabled && !initial?.id;
  const saved = isCreate ? getDraft("sector") : null;

  const [name, setName]         = useState((saved?.data?.name as string) ?? initial?.name ?? "");
  const [color, setColor]       = useState((saved?.data?.color as string) ?? initial?.color ?? SECTOR_COLORS[0]);
  const [priority, setPriority] = useState((saved?.data?.priority as number) ?? initial?.priority ?? 2);
  const [saving, setSaving]     = useState(false);
  const doneRef = useRef(false);
  const isDirtyRef = useRef(false);
  const firstRenderRef = useRef(true);
  const dataRef = useRef({ name, color, priority });
  useEffect(() => { dataRef.current = { name, color, priority }; });

  useEffect(() => {
    if (firstRenderRef.current) { firstRenderRef.current = false; return; }
    isDirtyRef.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, color, priority]);
  useEffect(() => {
    if (!isCreate || !isDirtyRef.current) return;
    const t = setTimeout(() => saveDraft("sector", dataRef.current, dataRef.current.name || "Nouveau secteur"), 1200);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, color, priority]);
  useEffect(() => () => {
    if (!isCreate || !isDirtyRef.current || doneRef.current) return;
    saveDraft("sector", dataRef.current, dataRef.current.name || "Nouveau secteur");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSubmit({ name, color, priority });
    doneRef.current = true;
    if (isCreate) clearDraft("sector");
    setSaving(false);
    onClose();
  }

  return (
    <form onSubmit={handle}>
      <div className="field">
        <label className="label">Nom du secteur *</label>
        <input className="input" value={name} onChange={e => setName(e.target.value)} required placeholder="Automation, Énergie..." />
      </div>
      <div className="field">
        <label className="label">Couleur</label>
        <div className="row gap-2">
          {SECTOR_COLORS.map(c => (
            <button key={c} type="button" onClick={() => setColor(c)} style={{
              width: 28, height: 28, borderRadius: 8, background: c, border: "none",
              outline: color === c ? `3px solid ${c}` : "none",
              outlineOffset: 2, cursor: "pointer",
            }} />
          ))}
        </div>
      </div>
      <div className="field">
        <label className="label">Priorité</label>
        <select className="input" value={priority} onChange={e => setPriority(parseInt(e.target.value))}>
          <option value={1}>Haute</option>
          <option value={2}>Moyenne</option>
          <option value={3}>Basse</option>
        </select>
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button type="button" className="btn" onClick={() => { doneRef.current = true; if (isCreate) clearDraft("sector"); onClose(); }}>Annuler</button>
        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? "Enregistrement…" : initial ? "Mettre à jour" : "Créer"}
        </button>
      </div>
    </form>
  );
}

// ─── Draggable application chip (triage tray) ─────────────────────────────────

function DraggableApp({ app, companyName }: { app: Application; companyName: string | null }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `app:${app.id}` });
  return (
    <div
      ref={setNodeRef}
      className={`triage-chip ${isDragging ? "is-dragging" : ""}`}
      title="Glisse-moi sur un secteur"
      {...attributes}
      {...listeners}
    >
      <GripVertical size={12} className="triage-chip__grip" />
      <span className="triage-chip__title">{app.jobTitle}</span>
      {companyName && <span className="muted tiny" style={{ flexShrink: 0 }}>· {companyName}</span>}
      <span className="triage-chip__status">{statusLabel(app.status)}</span>
    </div>
  );
}

// ─── Triage tray (droppable to un-sort) ───────────────────────────────────────

function TriageTray({ apps, companyMap, hasSectors }: {
  apps: Application[]; companyMap: Record<string, string>; hasSectors: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "unsorted" });
  return (
    <div ref={setNodeRef} className={`triage-tray ${isOver ? "is-drop-target" : ""}`}>
      <div className="triage-tray__head">
        <Inbox size={15} color="var(--warn)" />
        <span>Candidatures à trier ({apps.length})</span>
        {hasSectors && apps.length > 0 && (
          <span className="muted tiny" style={{ marginLeft: "auto", fontWeight: 500 }}>
            Glisse une candidature sur le secteur qui lui correspond
          </span>
        )}
      </div>
      {apps.length === 0 ? (
        <div className="triage-tray__empty">
          ✓ Toutes tes candidatures sont classées dans un secteur.
        </div>
      ) : (
        <div className="triage-tray__items">
          {apps.map(a => (
            <DraggableApp key={a.id} app={a} companyName={a.companyId ? (companyMap[a.companyId] ?? null) : null} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SectorsPage() {
  const [sectors, setSectors]     = useState<Sector[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [editing, setEditing]     = useState<Sector | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [activeApp, setActiveApp] = useState<Application | null>(null);
  const [draft, setDraft] = useState<DraftEntry | null>(null);
  const { showToast } = useToast();

  useEffect(() => { setDraft(getDraft("sector")); }, []);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const load = useCallback(() => {
    fetch("/api/sectors").then(r => r.json()).then(r => setSectors(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    fetch("/api/companies").then(r => r.json()).then(r => setCompanies(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    fetch("/api/applications").then(r => r.json()).then(r => setApplications(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(data: Partial<Sector>) {
    const resp = await fetch("/api/sectors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const json = await resp.json();
    if (!resp.ok || !json.data) { showToast(json.error ?? "Erreur lors de la création", "error"); return; }
    setSectors(prev => [...prev, json.data]);
    showToast("Secteur créé ✓");
  }

  async function handleUpdate(data: Partial<Sector>) {
    if (!editing) return;
    const resp = await fetch(`/api/sectors/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const json = await resp.json();
    if (!resp.ok || !json.data) { showToast(json.error ?? "Erreur lors de la mise à jour", "error"); return; }
    setSectors(prev => prev.map(s => s.id === json.data.id ? json.data : s));
    setEditing(null);
    showToast("Secteur mis à jour ✓");
  }

  async function handleDelete() {
    if (!editing) return;
    const resp = await fetch(`/api/sectors/${editing.id}`, { method: "DELETE" });
    if (!resp.ok) { showToast("Erreur lors de la suppression", "error"); return; }
    setSectors(prev => prev.filter(s => s.id !== editing.id));
    setEditing(null);
    showToast("Secteur supprimé");
  }

  // ── Triage : candidatures sans secteur ──
  const companyMap = Object.fromEntries(companies.map(c => [c.id, c.name]));
  const unsortedApps = applications.filter(a => !a.sectorId);

  async function assignSector(appId: string, sectorId: string | null) {
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, sectorId } : a));
    const resp = await fetch(`/api/applications/${appId}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sectorId }),
    });
    if (!resp.ok) { showToast("Erreur lors du tri", "error"); load(); return; }
    const sectorName = sectorId ? (sectors.find(s => s.id === sectorId)?.name ?? "") : null;
    showToast(sectorName ? `Classé dans « ${sectorName} » ✓` : "Remis dans les non triées");
  }

  function handleDragStart(e: DragStartEvent) {
    const id = String(e.active.id).replace("app:", "");
    setActiveApp(applications.find(a => a.id === id) ?? null);
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveApp(null);
    const { active, over } = e;
    if (!over) return;
    const appId = String(active.id).replace("app:", "");
    const overId = String(over.id);
    if (overId === "unsorted") { assignSector(appId, null); return; }
    if (overId.startsWith("sector:")) assignSector(appId, overId.replace("sector:", ""));
  }

  return (
    <div className="main__inner">
      <div className="page-head">
        <div>
          <h1 className="page-head__title">Secteurs</h1>
          <p className="page-head__sub">Organisez votre recherche par domaine</p>
        </div>
        <button className="btn btn--primary" onClick={() => setShowCreate(true)}>
          <Plus size={14} /> Nouveau secteur
        </button>
      </div>

      {draft && (
        <DraftBanner
          draft={draft}
          onResume={() => { setDraft(null); setShowCreate(true); }}
          onDiscard={() => { clearDraft("sector"); setDraft(null); }}
        />
      )}

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {/* ── Bac : candidatures à trier (sans secteur) ── */}
        <TriageTray apps={unsortedApps} companyMap={companyMap} hasSectors={sectors.length > 0} />

        <div className="sector-grid">
          {sectors.map(s => (
            <SectorCard key={s.id} sector={s} companies={companies} applications={applications} onEdit={() => setEditing(s)} />
          ))}
          {sectors.length === 0 && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "48px 0" }} className="muted">
              Créez votre premier secteur pour organiser votre recherche
            </div>
          )}
        </div>

        <DragOverlay>
          {activeApp ? (
            <div className="triage-chip" style={{ boxShadow: "var(--sh-3)", opacity: 0.95 }}>
              <GripVertical size={12} className="triage-chip__grip" />
              <span className="triage-chip__title">{activeApp.jobTitle}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Edit Modal */}
      {editing && (
        <Modal open={true} onClose={() => setEditing(null)} title={`Modifier : ${editing.name}`}>
          <SectorForm initial={editing} onSubmit={handleUpdate} onClose={() => setEditing(null)} />
          <div className="divider" style={{ margin: "16px 0 12px" }} />
          <button
            className="btn btn--full"
            style={{ color: "var(--danger)", borderColor: "var(--danger-soft)" }}
            onClick={handleDelete}
          >
            Supprimer ce secteur
          </button>
        </Modal>
      )}

      <Modal open={showCreate} onClose={() => { setShowCreate(false); setTimeout(() => setDraft(getDraft("sector")), 50); }} title="Nouveau secteur">
        <SectorForm draftEnabled onSubmit={handleCreate} onClose={() => { setShowCreate(false); setTimeout(() => setDraft(getDraft("sector")), 50); }} />
      </Modal>
    </div>
  );
}
