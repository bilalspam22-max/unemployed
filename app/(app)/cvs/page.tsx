"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Download, FileText } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Drawer } from "@/components/ui/drawer";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/lib/store";
import type { CV, Sector } from "@/lib/types";

function CVCard({ cv, sector, onClick }: { cv: CV; sector: Sector | undefined; onClick: () => void }) {
  return (
    <div className="cv-card" style={{ cursor: "pointer" }} onClick={onClick}>
      <div className="cv-card__preview">
        {[1, 0.8, 1, 0.6, 1, 0.8, 1, 0.9, 0.7].map((w, i) => (
          <div key={i} className={`cv-card__preview-row ${w < 0.75 ? "short" : w < 0.9 ? "medium" : ""}`} style={{ width: `${Math.round(w * 100)}%` }} />
        ))}
        <div style={{
          position: "absolute", top: 10, right: 10,
          background: sector?.color ?? "var(--primary)",
          color: "white", fontSize: 10, fontWeight: 700,
          padding: "3px 8px", borderRadius: 999,
        }}>
          v{cv.versionNumber}
        </div>
      </div>
      <div style={{ padding: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{sector?.name ?? "CV Général"}</div>
        <div className="muted tiny" style={{ marginBottom: 8 }}>
          {cv.lastUpdated ?? "—"}
        </div>
        <div className="row gap-2" style={{ flexWrap: "wrap" }}>
          {cv.mainKeywords.slice(0, 4).map(k => (
            <span key={k} className="badge badge--primary" style={{ fontSize: 10 }}>{k}</span>
          ))}
        </div>
        <div className="row gap-2" style={{ marginTop: 12 }}>
          {cv.pdfUrl ? (
            <a href={cv.pdfUrl} target="_blank" rel="noopener noreferrer" className="btn btn--sm" onClick={e => e.stopPropagation()}>
              <Download size={12} /> PDF
            </a>
          ) : (
            <span className="badge badge--neutral">Pas de PDF</span>
          )}
        </div>
      </div>
    </div>
  );
}

function CVForm({ sectors, onSubmit, onClose, initial }: {
  sectors: Sector[];
  onSubmit: (d: Partial<CV>) => Promise<void>;
  onClose: () => void;
  initial?: Partial<CV>;
}) {
  const [d, setD] = useState({
    sectorId:             initial?.sectorId ?? "",
    versionNumber:        initial?.versionNumber ?? 1,
    lastUpdated:          initial?.lastUpdated ?? new Date().toISOString().slice(0, 10),
    pdfUrl:               initial?.pdfUrl ?? "",
    mainKeywords:         (initial?.mainKeywords ?? []).join(", "),
    strengthsToHighlight: (initial?.strengthsToHighlight ?? []).join("\n"),
  });
  const [saving, setSaving] = useState(false);
  const up = (k: string, v: unknown) => setD(p => ({ ...p, [k]: v }));

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSubmit({
      sectorId:    d.sectorId || null,
      versionNumber: d.versionNumber,
      lastUpdated:  d.lastUpdated || null,
      pdfUrl:       d.pdfUrl || null,
      mainKeywords:         d.mainKeywords.split(",").map(k => k.trim()).filter(Boolean),
      strengthsToHighlight: d.strengthsToHighlight.split("\n").map(s => s.trim()).filter(Boolean),
    });
    setSaving(false);
    onClose();
  }

  return (
    <form onSubmit={handle}>
      <div className="form-grid">
        <div className="field">
          <label className="label">Secteur</label>
          <select className="input" value={d.sectorId} onChange={e => up("sectorId", e.target.value)}>
            <option value="">— CV Général —</option>
            {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="label">Version</label>
          <input className="input" type="number" min={1} value={d.versionNumber} onChange={e => up("versionNumber", parseInt(e.target.value))} />
        </div>
      </div>
      <div className="form-grid">
        <div className="field">
          <label className="label">Dernière mise à jour</label>
          <input className="input" type="date" value={d.lastUpdated} onChange={e => up("lastUpdated", e.target.value)} />
        </div>
        <div className="field">
          <label className="label">URL PDF</label>
          <input className="input" value={d.pdfUrl} onChange={e => up("pdfUrl", e.target.value)} placeholder="https://..." />
        </div>
      </div>
      <div className="field">
        <label className="label">Mots-clés principaux (séparés par virgules)</label>
        <input className="input" value={d.mainKeywords} onChange={e => up("mainKeywords", e.target.value)} placeholder="EPLAN, AutoCAD, Automation..." />
      </div>
      <div className="field">
        <label className="label">Points forts (un par ligne)</label>
        <textarea className="input" value={d.strengthsToHighlight} onChange={e => up("strengthsToHighlight", e.target.value)} rows={4} placeholder="5 ans d'expérience en automatisme industriel&#10;Maîtrise EPLAN P8..." />
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

export default function CVsPage() {
  const [cvList, setCvList] = useState<CV[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [selected, setSelected] = useState<CV | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { showToast } = useToast();

  const load = useCallback(() => {
    fetch("/api/cvs").then(r => r.json()).then(r => setCvList(r.data ?? []));
    fetch("/api/sectors").then(r => r.json()).then(r => setSectors(r.data ?? []));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(data: Partial<CV>) {
    const resp = await fetch("/api/cvs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const { data: created } = await resp.json();
    setCvList(prev => [created, ...prev]);
    showToast("CV créé ✓");
  }

  async function handleUpdate(data: Partial<CV>) {
    if (!selected) return;
    const resp = await fetch(`/api/cvs/${selected.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const { data: updated } = await resp.json();
    setCvList(prev => prev.map(c => c.id === updated.id ? updated : c));
    setSelected(updated);
    showToast("CV mis à jour ✓");
  }

  async function handleDelete() {
    if (!selected) return;
    await fetch(`/api/cvs/${selected.id}`, { method: "DELETE" });
    setCvList(prev => prev.filter(c => c.id !== selected.id));
    setSelected(null);
    setConfirmDelete(false);
    showToast("CV supprimé");
  }

  const sectorMap = Object.fromEntries(sectors.map(s => [s.id, s]));

  return (
    <div className="main__inner">
      <div className="page-head">
        <div>
          <h1 className="page-head__title">CV par secteur</h1>
          <p className="page-head__sub">{cvList.length} versions adaptées</p>
        </div>
        <button className="btn btn--primary" onClick={() => setShowCreate(true)}>
          <Plus size={14} /> Nouveau CV
        </button>
      </div>

      {cvList.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Crée ta première version de CV"
          description="Adapte ton CV à chaque secteur ciblé. Une version pour l'automatisme, une autre pour l'aérospatial — l'IA t'aidera à mettre en valeur les bons mots-clés."
          action={{ label: "Créer un CV", onClick: () => setShowCreate(true), icon: Plus }}
          tone="info"
        />
      ) : (
        <div className="cv-grid">
          {cvList.map(cv => (
            <CVCard key={cv.id} cv={cv} sector={sectorMap[cv.sectorId ?? ""]} onClick={() => setSelected(cv)} />
          ))}
        </div>
      )}

      {selected && (
        <Drawer
          open={true}
          onClose={() => setSelected(null)}
          title={sectorMap[selected.sectorId ?? ""]?.name ?? "CV Général"}
          subtitle={`Version ${selected.versionNumber} · ${selected.lastUpdated ?? "—"}`}
          footer={
            <>
              <button className="btn" style={{ color: "var(--danger)" }} onClick={() => setConfirmDelete(true)}>Supprimer</button>
              {selected.pdfUrl && (
                <a href={selected.pdfUrl} target="_blank" rel="noopener noreferrer" className="btn">
                  <Download size={13} /> PDF
                </a>
              )}
            </>
          }
        >
          {selected.strengthsToHighlight?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div className="section-title">Points forts</div>
              <ul style={{ paddingLeft: 20, margin: 0 }}>
                {selected.strengthsToHighlight.map((s, i) => (
                  <li key={i} style={{ fontSize: 13, marginBottom: 4 }}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          {selected.mainKeywords?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div className="section-title">Mots-clés</div>
              <div className="row gap-2" style={{ flexWrap: "wrap" }}>
                {selected.mainKeywords.map(k => (
                  <span key={k} className="badge badge--primary">{k}</span>
                ))}
              </div>
            </div>
          )}
          <div className="divider" />
          <div className="section-title">Modifier</div>
          <CVForm sectors={sectors} initial={selected} onSubmit={handleUpdate} onClose={() => setSelected(null)} />
        </Drawer>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nouveau CV" size="lg">
        <CVForm sectors={sectors} onSubmit={handleCreate} onClose={() => setShowCreate(false)} />
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        message="Ce CV sera définitivement supprimé. Cette action est irréversible."
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
