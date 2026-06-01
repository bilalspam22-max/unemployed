"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Globe, MapPin } from "lucide-react";
import { KanbanBoard } from "@/components/ui/kanban";
import { StatusBadge, TempDot, Badge } from "@/components/ui/badge";
import { Drawer } from "@/components/ui/drawer";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Avatar } from "@/components/ui/avatar";
import { KanbanSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/lib/store";
import type { Company, Sector } from "@/lib/types";

const COLUMNS = [
  { id: "to_contact",       title: "À contacter",        dotColor: "var(--ink-3)" },
  { id: "contacted",        title: "Contactée",           dotColor: "var(--info)" },
  { id: "followed_up",      title: "Relancée",            dotColor: "var(--warn)" },
  { id: "interview",        title: "Entretien",           dotColor: "var(--success)" },
  { id: "rejected",         title: "Refus",               dotColor: "var(--danger)" },
  { id: "hot_opportunity",  title: "Opportunité chaude",  dotColor: "var(--plum)" },
];

function CompanyCard({ company }: { company: Company }) {
  return (
    <div>
      <div className="row gap-3 between" style={{ marginBottom: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 14, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {company.name}
        </div>
        {company._bestTemperature && <TempDot temp={company._bestTemperature} />}
      </div>
      {company.location && (
        <div className="row gap-2 muted tiny" style={{ marginBottom: 4 }}>
          <MapPin size={10} /> {company.location}
        </div>
      )}
      <div className="row gap-2" style={{ marginTop: 6, flexWrap: "wrap" }}>
        {company.technologies?.slice(0, 3).map(t => (
          <span key={t} className="badge badge--primary" style={{ fontSize: 10 }}>{t}</span>
        ))}
      </div>
    </div>
  );
}

function CompanyForm({ sectors, onSubmit, onClose, initial }: {
  sectors: Sector[];
  onSubmit: (data: Partial<Company>) => Promise<void>;
  onClose: () => void;
  initial?: Partial<Company>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [sectorId, setSectorId] = useState(initial?.sectorId ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [website, setWebsite] = useState(initial?.website ?? "");
  const [techs, setTechs] = useState((initial?.technologies ?? []).join(", "));
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [saving, setSaving] = useState(false);

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSubmit({
      name, sectorId: sectorId || null, location: location || null,
      website: website || null,
      technologies: techs.split(",").map(t => t.trim()).filter(Boolean),
      notes: notes || null,
    });
    setSaving(false);
    onClose();
  }

  return (
    <form onSubmit={handle}>
      <div className="field">
        <label className="label">Nom de l'entreprise *</label>
        <input className="input" value={name} onChange={e => setName(e.target.value)} required />
      </div>
      <div className="field">
        <label className="label">Secteur</label>
        <select className="input" value={sectorId} onChange={e => setSectorId(e.target.value)}>
          <option value="">— Choisir —</option>
          {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div className="form-grid">
        <div className="field">
          <label className="label">Ville</label>
          <input className="input" value={location} onChange={e => setLocation(e.target.value)} placeholder="Paris" />
        </div>
        <div className="field">
          <label className="label">Site web</label>
          <input className="input" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://..." />
        </div>
      </div>
      <div className="field">
        <label className="label">Technologies (séparées par virgules)</label>
        <input className="input" value={techs} onChange={e => setTechs(e.target.value)} placeholder="EPLAN, AutoCAD, PLC..." />
      </div>
      <div className="field">
        <label className="label">Notes</label>
        <textarea className="input" value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
        <button type="button" className="btn" onClick={onClose}>Annuler</button>
        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? "Enregistrement…" : initial ? "Mettre à jour" : "Créer"}
        </button>
      </div>
    </form>
  );
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [selected, setSelected] = useState<Company | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const loadData = useCallback(async () => {
    try {
      const [cRes, sRes] = await Promise.all([
        fetch("/api/companies").then(r => r.json()),
        fetch("/api/sectors").then(r => r.json()),
      ]);
      setCompanies(Array.isArray(cRes.data) ? cRes.data : []);
      setSectors(Array.isArray(sRes.data) ? sRes.data : []);
    } catch { /* keep empty */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleStatusChange(id: string, newStatus: string) {
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, status: newStatus as Company["status"] } : c));
    await fetch(`/api/companies/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) });
  }

  async function handleCreate(data: Partial<Company>) {
    const resp = await fetch("/api/companies", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const json = await resp.json();
    if (!resp.ok || !json.data) { showToast(json.error ?? "Erreur lors de la création", "error"); return; }
    setCompanies(prev => [json.data, ...prev]);
    showToast("Entreprise créée ✓");
  }

  async function handleUpdate(data: Partial<Company>) {
    if (!selected) return;
    const resp = await fetch(`/api/companies/${selected.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const json = await resp.json();
    if (!resp.ok || !json.data) { showToast(json.error ?? "Erreur lors de la mise à jour", "error"); return; }
    setCompanies(prev => prev.map(c => c.id === json.data.id ? json.data : c));
    setSelected(json.data);
    showToast("Entreprise mise à jour ✓");
  }

  async function handleDelete() {
    if (!selected) return;
    const resp = await fetch(`/api/companies/${selected.id}`, { method: "DELETE" });
    if (!resp.ok) { showToast("Erreur lors de la suppression", "error"); return; }
    setCompanies(prev => prev.filter(c => c.id !== selected.id));
    setSelected(null);
    setConfirmDelete(false);
    showToast("Entreprise supprimée");
  }

  const filtered = companies.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()));
  const sectorMap = Object.fromEntries(sectors.map(s => [s.id, s]));

  return (
    <div className="main__inner--wide main__inner">
      {/* Header */}
      <div className="page-head">
        <div>
          <h1 className="page-head__title">Entreprises</h1>
          <p className="page-head__sub">{companies.length} entreprises suivies</p>
        </div>
        <button className="btn btn--primary" onClick={() => setShowCreate(true)}>
          <Plus size={14} /> Nouvelle entreprise
        </button>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search">
          <input
            placeholder="Rechercher une entreprise…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Kanban */}
      {loading ? (
        <KanbanSkeleton columns={6} cardsPerCol={2} />
      ) : (
        <KanbanBoard
          items={filtered}
          columns={COLUMNS}
          onStatusChange={handleStatusChange}
          renderCard={(company) => (
            <div onClick={() => setSelected(company)}>
              <CompanyCard company={company} />
            </div>
          )}
        />
      )}

      {/* Detail Drawer */}
      {selected && (
        <Drawer
          open={true}
          onClose={() => setSelected(null)}
          title={selected.name}
          subtitle={`${selected.location ?? ""}${selected.location && sectorMap[selected.sectorId ?? ""]?.name ? " · " : ""}${sectorMap[selected.sectorId ?? ""]?.name ?? ""}`}
          footer={
            <>
              <button className="btn btn--full" style={{ color: "var(--danger)", borderColor: "var(--danger-soft)" }} onClick={() => setConfirmDelete(true)}>
                Supprimer
              </button>
              <button className="btn btn--primary btn--full" onClick={() => setSelected(null)}>
                Fermer
              </button>
            </>
          }
        >
          <div>
            <StatusBadge status={selected.status} />

            {selected.website && (
              <a href={selected.website} target="_blank" rel="noopener noreferrer" className="row gap-2 muted" style={{ marginTop: 12, fontSize: 13 }}>
                <Globe size={13} /> {selected.website}
              </a>
            )}

            {selected.notes && (
              <div style={{ marginTop: 16 }}>
                <div className="section-title">Notes</div>
                <div className="card" style={{ padding: 12, background: "var(--surface-2)", fontSize: 13 }}>
                  {selected.notes}
                </div>
              </div>
            )}

            {selected.technologies?.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div className="section-title">Stack technique</div>
                <div className="row gap-2" style={{ flexWrap: "wrap" }}>
                  {selected.technologies.map(t => (
                    <Badge key={t} tone="primary">{t}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="divider" />

            <div className="section-title">Modifier</div>
            <CompanyForm
              sectors={sectors}
              initial={selected}
              onSubmit={handleUpdate}
              onClose={() => setSelected(null)}
            />
          </div>
        </Drawer>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nouvelle entreprise">
        <CompanyForm sectors={sectors} onSubmit={handleCreate} onClose={() => setShowCreate(false)} />
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        message="Cette entreprise sera définitivement supprimée. Cette action est irréversible."
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
