"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, ChevronRight } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/lib/store";
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
    <div className="sector-card" onClick={onEdit}>
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

function SectorForm({ onSubmit, onClose, initial }: {
  onSubmit: (d: Partial<Sector>) => Promise<void>;
  onClose: () => void;
  initial?: Partial<Sector>;
}) {
  const [name, setName]       = useState(initial?.name ?? "");
  const [color, setColor]     = useState(initial?.color ?? SECTOR_COLORS[0]);
  const [priority, setPriority] = useState(initial?.priority ?? 2);
  const [saving, setSaving]   = useState(false);

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSubmit({ name, color, priority });
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
        <button type="button" className="btn" onClick={onClose}>Annuler</button>
        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? "Enregistrement…" : initial ? "Mettre à jour" : "Créer"}
        </button>
      </div>
    </form>
  );
}

export default function SectorsPage() {
  const [sectors, setSectors]     = useState<Sector[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [editing, setEditing]     = useState<Sector | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const { showToast } = useToast();

  const load = useCallback(() => {
    fetch("/api/sectors").then(r => r.json()).then(r => setSectors(r.data ?? []));
    fetch("/api/companies").then(r => r.json()).then(r => setCompanies(r.data ?? []));
    fetch("/api/applications").then(r => r.json()).then(r => setApplications(r.data ?? []));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(data: Partial<Sector>) {
    const resp = await fetch("/api/sectors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const { data: created } = await resp.json();
    setSectors(prev => [...prev, created]);
    showToast("Secteur créé ✓");
  }

  async function handleUpdate(data: Partial<Sector>) {
    if (!editing) return;
    const resp = await fetch(`/api/sectors/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const { data: updated } = await resp.json();
    setSectors(prev => prev.map(s => s.id === updated.id ? updated : s));
    setEditing(null);
    showToast("Secteur mis à jour ✓");
  }

  async function handleDelete() {
    if (!editing) return;
    await fetch(`/api/sectors/${editing.id}`, { method: "DELETE" });
    setSectors(prev => prev.filter(s => s.id !== editing.id));
    setEditing(null);
    showToast("Secteur supprimé");
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

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nouveau secteur">
        <SectorForm onSubmit={handleCreate} onClose={() => setShowCreate(false)} />
      </Modal>
    </div>
  );
}
