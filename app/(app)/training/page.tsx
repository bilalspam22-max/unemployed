"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, GraduationCap } from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/lib/store";
import type { Training, Sector } from "@/lib/types";

const ROI_LABEL = { high: "ROI Élevé", medium: "ROI Moyen", low: "ROI Faible" };
const ROI_TONE  = { high: "success" as const, medium: "warn" as const, low: "danger" as const };

function TrainingCard({ training, sector, onEdit }: { training: Training; sector: Sector | undefined; onEdit: () => void }) {
  return (
    <div className="card card__pad-lg" style={{ cursor: "pointer" }} onClick={onEdit}>
      <div className="row between" style={{ marginBottom: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{training.name}</div>
        <StatusBadge status={training.status} />
      </div>
      {sector && (
        <span className="badge" style={{ background: sector.color + "22", color: sector.color, marginBottom: 8 }}>
          {sector.name}
        </span>
      )}
      <div className="row gap-3 muted tiny" style={{ marginBottom: 8 }}>
        {training.durationHours && <span>{training.durationHours}h</span>}
        {training.price && <span>{training.price}€</span>}
        {training.certificationAvailable && <span>🎓 Certification</span>}
      </div>
      {training.roiEstimated && (
        <StatusBadge status={training.roiEstimated === "high" ? "won" : training.roiEstimated === "medium" ? "waiting" : "rejected"} />
      )}
    </div>
  );
}

function TrainingForm({ sectors, onSubmit, onClose, initial }: {
  sectors: Sector[];
  onSubmit: (d: Partial<Training>) => Promise<void>;
  onClose: () => void;
  initial?: Partial<Training>;
}) {
  const [d, setD] = useState({
    name:                   initial?.name ?? "",
    sectorId:               initial?.sectorId ?? "",
    provider:               initial?.provider ?? "",
    durationHours:          initial?.durationHours ?? "",
    price:                  initial?.price ?? "",
    certificationAvailable: initial?.certificationAvailable ?? false,
    marketRecognition:      initial?.marketRecognition ?? "medium",
    priority:               initial?.priority ?? 2,
    status:                 initial?.status ?? "to_analyze",
    roiEstimated:           initial?.roiEstimated ?? "medium",
  });
  const [saving, setSaving] = useState(false);
  const up = (k: string, v: unknown) => setD(p => ({ ...p, [k]: v }));

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSubmit({
      name:                   d.name,
      sectorId:               d.sectorId || null,
      provider:               d.provider || null,
      durationHours:          d.durationHours ? parseFloat(String(d.durationHours)) : null,
      price:                  d.price ? parseFloat(String(d.price)) : null,
      certificationAvailable: d.certificationAvailable,
      marketRecognition:      d.marketRecognition as Training["marketRecognition"],
      priority:               Number(d.priority),
      status:                 d.status as Training["status"],
      roiEstimated:           d.roiEstimated as Training["roiEstimated"],
    });
    setSaving(false);
    onClose();
  }

  return (
    <form onSubmit={handle}>
      <div className="field">
        <label className="label">Nom de la formation *</label>
        <input className="input" value={d.name} onChange={e => up("name", e.target.value)} required placeholder="EPLAN, Prince2, SCADA..." />
      </div>
      <div className="form-grid">
        <div className="field">
          <label className="label">Secteur</label>
          <select className="input" value={d.sectorId} onChange={e => up("sectorId", e.target.value)}>
            <option value="">— Transversal —</option>
            {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="label">Organisme</label>
          <input className="input" value={d.provider} onChange={e => up("provider", e.target.value)} />
        </div>
      </div>
      <div className="form-grid">
        <div className="field">
          <label className="label">Durée (heures)</label>
          <input className="input" type="number" value={d.durationHours} onChange={e => up("durationHours", e.target.value)} />
        </div>
        <div className="field">
          <label className="label">Prix (€)</label>
          <input className="input" type="number" value={d.price} onChange={e => up("price", e.target.value)} />
        </div>
      </div>
      <div className="form-grid form-grid--3">
        <div className="field">
          <label className="label">Statut</label>
          <select className="input" value={d.status} onChange={e => up("status", e.target.value)}>
            <option value="to_analyze">À analyser</option>
            <option value="to_do">À faire</option>
            <option value="in_progress">En cours</option>
            <option value="done">Terminée</option>
          </select>
        </div>
        <div className="field">
          <label className="label">ROI estimé</label>
          <select className="input" value={d.roiEstimated} onChange={e => up("roiEstimated", e.target.value)}>
            <option value="high">Élevé</option>
            <option value="medium">Moyen</option>
            <option value="low">Faible</option>
          </select>
        </div>
        <div className="field">
          <label className="label">Priorité</label>
          <select className="input" value={d.priority} onChange={e => up("priority", e.target.value)}>
            <option value={1}>Haute</option>
            <option value={2}>Moyenne</option>
            <option value={3}>Basse</option>
          </select>
        </div>
      </div>
      <div className="field">
        <label className="label" style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input type="checkbox" checked={d.certificationAvailable} onChange={e => up("certificationAvailable", e.target.checked)} />
          Certification disponible
        </label>
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

export default function TrainingPage() {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [sectors, setSectors]     = useState<Sector[]>([]);
  const [editing, setEditing]     = useState<Training | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const { showToast } = useToast();

  const load = useCallback(() => {
    fetch("/api/trainings").then(r => r.json()).then(r => setTrainings(r.data ?? []));
    fetch("/api/sectors").then(r => r.json()).then(r => setSectors(r.data ?? []));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(data: Partial<Training>) {
    const resp = await fetch("/api/trainings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const { data: created } = await resp.json();
    setTrainings(prev => [created, ...prev]);
    showToast("Formation ajoutée ✓");
  }

  async function handleUpdate(data: Partial<Training>) {
    if (!editing) return;
    const resp = await fetch(`/api/trainings/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const { data: updated } = await resp.json();
    setTrainings(prev => prev.map(t => t.id === updated.id ? updated : t));
    setEditing(null);
    showToast("Formation mise à jour ✓");
  }

  async function handleDelete() {
    if (!editing) return;
    await fetch(`/api/trainings/${editing.id}`, { method: "DELETE" });
    setTrainings(prev => prev.filter(t => t.id !== editing.id));
    setEditing(null);
    showToast("Formation supprimée");
  }

  const sectorMap = Object.fromEntries(sectors.map(s => [s.id, s]));

  return (
    <div className="main__inner">
      <div className="page-head">
        <div>
          <h1 className="page-head__title">Formations</h1>
          <p className="page-head__sub">Compétences à acquérir pour booster votre profil</p>
        </div>
        <button className="btn btn--primary" onClick={() => setShowCreate(true)}>
          <Plus size={14} /> Nouvelle formation
        </button>
      </div>

      <div className="sector-grid">
        {trainings.map(t => (
          <TrainingCard key={t.id} training={t} sector={sectorMap[t.sectorId ?? ""]} onEdit={() => setEditing(t)} />
        ))}
        {trainings.length === 0 && (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "48px 0" }} className="muted">
            <GraduationCap size={32} strokeWidth={1.5} style={{ margin: "0 auto 8px", display: "block" }} />
            Ajoutez des formations pour structurer votre montée en compétences
          </div>
        )}
      </div>

      {editing && (
        <Modal open={true} onClose={() => setEditing(null)} title={`Modifier : ${editing.name}`} size="lg">
          <TrainingForm sectors={sectors} initial={editing} onSubmit={handleUpdate} onClose={() => setEditing(null)} />
          <div className="divider" style={{ margin: "16px 0 12px" }} />
          <button className="btn btn--full" style={{ color: "var(--danger)", borderColor: "var(--danger-soft)" }} onClick={handleDelete}>
            Supprimer
          </button>
        </Modal>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nouvelle formation" size="lg">
        <TrainingForm sectors={sectors} onSubmit={handleCreate} onClose={() => setShowCreate(false)} />
      </Modal>
    </div>
  );
}
