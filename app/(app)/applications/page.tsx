"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Calendar } from "lucide-react";
import { KanbanBoard } from "@/components/ui/kanban";
import { StatusBadge } from "@/components/ui/badge";
import { Drawer } from "@/components/ui/drawer";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { KanbanSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/lib/store";
import { celebrate } from "@/lib/confetti";
import { formatDateShort } from "@/lib/utils";
import type { Application, Company, Sector, CV } from "@/lib/types";

const COLUMNS = [
  { id: "to_prepare",       title: "À préparer",     dotColor: "var(--ink-3)"  },
  { id: "cv_sent",          title: "CV envoyé",       dotColor: "var(--info)"   },
  { id: "followup_planned", title: "Relance prévue",  dotColor: "var(--warn)"   },
  { id: "in_discussion",    title: "En discussion",   dotColor: "var(--primary)"},
  { id: "interview",        title: "Entretien",       dotColor: "var(--success)"},
  { id: "waiting",          title: "En attente",      dotColor: "var(--warn)"   },
  { id: "rejected",         title: "Refus",           dotColor: "var(--danger)" },
  { id: "won",              title: "Gagnée",          dotColor: "var(--success)"},
];

function AppCard({ app, companies }: { app: Application; companies: Company[] }) {
  const company = companies.find(c => c.id === app.companyId);
  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{app.jobTitle}</div>
      <div className="muted tiny">{company?.name ?? "—"}</div>
      {app.sentDate && (
        <div className="row gap-2 muted tiny" style={{ marginTop: 4 }}>
          <Calendar size={10} /> {formatDateShort(app.sentDate)}
        </div>
      )}
      {app.nextAction && (
        <div style={{ marginTop: 6, padding: "4px 8px", background: "var(--warn-soft)", borderRadius: 6, fontSize: 11, color: "#95571a" }}>
          {app.nextAction}
        </div>
      )}
    </div>
  );
}

function AppForm({ companies, sectors, cvList, onSubmit, onClose, initial }: {
  companies: Company[];
  sectors: Sector[];
  cvList: CV[];
  onSubmit: (d: Partial<Application>) => Promise<void>;
  onClose: () => void;
  initial?: Partial<Application>;
}) {
  const [d, setD] = useState({
    jobTitle:     initial?.jobTitle    ?? "",
    companyId:    initial?.companyId   ?? "",
    sectorId:     initial?.sectorId    ?? "",
    cvUsedId:     initial?.cvUsedId    ?? "",
    sentDate:     initial?.sentDate    ?? "",
    messageSent:  initial?.messageSent ?? "",
    sentVia:      initial?.sentVia     ?? "email",
    status:       initial?.status      ?? "to_prepare",
    nextAction:   initial?.nextAction  ?? "",
  });
  const [saving, setSaving] = useState(false);
  const up = (k: string, v: unknown) => setD(p => ({ ...p, [k]: v }));

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSubmit({
      ...d,
      companyId: d.companyId || null,
      sectorId:  d.sectorId  || null,
      cvUsedId:  d.cvUsedId  || null,
      sentDate:  d.sentDate  || null,
      messageSent: d.messageSent || null,
      nextAction:  d.nextAction  || null,
    });
    setSaving(false);
    onClose();
  }

  return (
    <form onSubmit={handle}>
      <div className="field">
        <label className="label">Intitulé du poste *</label>
        <input className="input" value={d.jobTitle} onChange={e => up("jobTitle", e.target.value)} required />
      </div>
      <div className="form-grid">
        <div className="field">
          <label className="label">Entreprise</label>
          <select className="input" value={d.companyId} onChange={e => up("companyId", e.target.value)}>
            <option value="">— Choisir —</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="label">Secteur</label>
          <select className="input" value={d.sectorId} onChange={e => up("sectorId", e.target.value)}>
            <option value="">— Choisir —</option>
            {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>
      <div className="form-grid">
        <div className="field">
          <label className="label">CV utilisé</label>
          <select className="input" value={d.cvUsedId} onChange={e => up("cvUsedId", e.target.value)}>
            <option value="">— Choisir —</option>
            {cvList.map(cv => <option key={cv.id} value={cv.id}>CV v{cv.versionNumber}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="label">Date d'envoi</label>
          <input className="input" type="date" value={d.sentDate} onChange={e => up("sentDate", e.target.value)} />
        </div>
      </div>
      <div className="form-grid">
        <div className="field">
          <label className="label">Envoyé via</label>
          <select className="input" value={d.sentVia} onChange={e => up("sentVia", e.target.value)}>
            <option value="email">Email</option>
            <option value="linkedin">LinkedIn</option>
            <option value="referral">Référence</option>
            <option value="direct">Direct</option>
          </select>
        </div>
        <div className="field">
          <label className="label">Statut</label>
          <select className="input" value={d.status} onChange={e => up("status", e.target.value)}>
            {COLUMNS.map(col => <option key={col.id} value={col.id}>{col.title}</option>)}
          </select>
        </div>
      </div>
      <div className="field">
        <label className="label">Message envoyé</label>
        <textarea className="input" value={d.messageSent} onChange={e => up("messageSent", e.target.value)} rows={3} />
      </div>
      <div className="field">
        <label className="label">Prochaine action</label>
        <input className="input" value={d.nextAction} onChange={e => up("nextAction", e.target.value)} placeholder="Relancer le 15 mai..." />
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

export default function ApplicationsPage() {
  const [apps, setApps]           = useState<Application[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [sectors, setSectors]     = useState<Sector[]>([]);
  const [cvList, setCvList]       = useState<CV[]>([]);
  const [selected, setSelected]   = useState<Application | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [aiAction, setAiAction]   = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const load = useCallback(async () => {
    try {
      const [a, c, s, cv] = await Promise.all([
        fetch("/api/applications").then(r => r.json()),
        fetch("/api/companies").then(r => r.json()),
        fetch("/api/sectors").then(r => r.json()),
        fetch("/api/cvs").then(r => r.json()),
      ]);
      setApps(Array.isArray(a.data) ? a.data : []);
      setCompanies(Array.isArray(c.data) ? c.data : []);
      setSectors(Array.isArray(s.data) ? s.data : []);
      setCvList(Array.isArray(cv.data) ? cv.data : []);
    } catch { /* keep empty */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleStatusChange(id: string, newStatus: string) {
    const previous = apps.find(a => a.id === id);
    setApps(prev => prev.map(a => a.id === id ? { ...a, status: newStatus as Application["status"] } : a));
    await fetch(`/api/applications/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) });
    if (newStatus === "won" && previous?.status !== "won") {
      celebrate();
      showToast("🎉 Bravo pour cette victoire !");
    }
  }

  async function handleCreate(data: Partial<Application>) {
    const resp = await fetch("/api/applications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const json = await resp.json();
    if (!resp.ok || !json.data) { showToast(json.error ?? "Erreur lors de la création", "error"); return; }
    setApps(prev => [json.data, ...prev]);
    showToast("Candidature créée ✓");
  }

  async function handleUpdate(data: Partial<Application>) {
    if (!selected) return;
    const resp = await fetch(`/api/applications/${selected.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const json = await resp.json();
    if (!resp.ok || !json.data) { showToast(json.error ?? "Erreur lors de la mise à jour", "error"); return; }
    setApps(prev => prev.map(a => a.id === json.data.id ? json.data : a));
    setSelected(json.data);
    showToast("Candidature mise à jour ✓");
  }

  async function handleDelete() {
    if (!selected) return;
    const resp = await fetch(`/api/applications/${selected.id}`, { method: "DELETE" });
    if (!resp.ok) { showToast("Erreur lors de la suppression", "error"); return; }
    setApps(prev => prev.filter(a => a.id !== selected.id));
    setSelected(null);
    setConfirmDelete(false);
    showToast("Candidature supprimée");
  }

  async function loadAIAction(app: Application) {
    setLoadingAI(true);
    const company = companies.find(c => c.id === app.companyId);
    const resp = await fetch("/api/ai/suggest-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobTitle: app.jobTitle,
        companyName: company?.name ?? null,
        status: app.status,
        sentDate: app.sentDate,
        feedbackReceived: app.feedbackReceived,
      }),
    });
    const { data } = await resp.json();
    setAiAction(data);
    setLoadingAI(false);
  }

  const companyMap = Object.fromEntries(companies.map(c => [c.id, c]));

  return (
    <div className="main__inner--wide main__inner">
      <div className="page-head">
        <div>
          <h1 className="page-head__title">Candidatures</h1>
          <p className="page-head__sub">{apps.length} candidatures suivies</p>
        </div>
        <button className="btn btn--primary" onClick={() => setShowCreate(true)}>
          <Plus size={14} /> Nouvelle candidature
        </button>
      </div>

      {loading ? (
        <KanbanSkeleton columns={8} cardsPerCol={2} />
      ) : (
        <KanbanBoard
          items={apps}
          columns={COLUMNS}
          onStatusChange={handleStatusChange}
          renderCard={(app) => (
            <div onClick={() => setSelected(app)}>
              <AppCard app={app} companies={companies} />
            </div>
          )}
        />
      )}

      {/* Detail Drawer */}
      {selected && (
        <Drawer
          open={true}
          onClose={() => { setSelected(null); setAiAction(null); }}
          title={selected.jobTitle}
          subtitle={companyMap[selected.companyId ?? ""]?.name ?? "—"}
          footer={
            <>
              <button className="btn" style={{ color: "var(--danger)" }} onClick={() => setConfirmDelete(true)}>Supprimer</button>
              <button className="btn btn--primary btn--full" onClick={() => setSelected(null)}>Fermer</button>
            </>
          }
        >
          <div>
            <StatusBadge status={selected.status} />

            <div className="row gap-4" style={{ marginTop: 12 }}>
              {selected.sentDate && <span className="muted tiny"><Calendar size={11} /> {formatDateShort(selected.sentDate)}</span>}
              {selected.sentVia && <span className="badge badge--neutral">{selected.sentVia}</span>}
            </div>

            {/* AI action */}
            <div style={{ margin: "16px 0" }}>
              <div className="row between" style={{ marginBottom: 8 }}>
                <div className="section-title">Prochaine action (IA)</div>
                <button className="btn btn--sm" onClick={() => loadAIAction(selected)} disabled={loadingAI}>
                  {loadingAI ? "…" : "Suggérer"}
                </button>
              </div>
              {aiAction && (
                <div className="ai-card">
                  <div className="ai-card__label">Recommandation</div>
                  <div className="ai-card__text">{aiAction}</div>
                </div>
              )}
              {selected.nextAction && !aiAction && (
                <div style={{ fontSize: 13, padding: "8px 12px", background: "var(--warn-soft)", borderRadius: "var(--r-md)", color: "#95571a" }}>
                  {selected.nextAction}
                </div>
              )}
            </div>

            {selected.messageSent && (
              <div style={{ marginBottom: 16 }}>
                <div className="section-title">Message envoyé</div>
                <div className="card" style={{ padding: 12, background: "var(--surface-2)", fontSize: 12.5, fontFamily: "var(--f-mono)", lineHeight: 1.6 }}>
                  {selected.messageSent}
                </div>
              </div>
            )}

            {selected.feedbackReceived && (
              <div style={{ marginBottom: 16 }}>
                <div className="section-title">Feedback reçu</div>
                <div className="card" style={{ padding: 12, background: "var(--danger-soft)", fontSize: 13 }}>
                  {selected.feedbackReceived}
                </div>
              </div>
            )}

            <div className="divider" />
            <div className="section-title">Modifier</div>
            <AppForm companies={companies} sectors={sectors} cvList={cvList} initial={selected} onSubmit={handleUpdate} onClose={() => setSelected(null)} />
          </div>
        </Drawer>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nouvelle candidature" size="lg">
        <AppForm companies={companies} sectors={sectors} cvList={cvList} onSubmit={handleCreate} onClose={() => setShowCreate(false)} />
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        message="Cette candidature sera définitivement supprimée. Cette action est irréversible."
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
