"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Calendar, ExternalLink, Filter, X } from "lucide-react";
import { KanbanBoard } from "@/components/ui/kanban";
import { StatusBadge } from "@/components/ui/badge";
import { Drawer } from "@/components/ui/drawer";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { KanbanSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/lib/store";
import { celebrate } from "@/lib/confetti";
import { formatDateShort } from "@/lib/utils";
import { getDraft, clearDraft, saveDraft, type DraftEntry } from "@/lib/drafts";
import { DraftBanner } from "@/components/ui/draft-banner";
import type { Application, Company, Sector, CV } from "@/lib/types";

interface AppFormData extends Partial<Application> {
  companyName?: string | null;
}

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

function AppForm({ companies, sectors, cvList, onSubmit, onClose, initial, initialCompanyName, draftEnabled }: {
  companies: Company[];
  sectors: Sector[];
  cvList: CV[];
  onSubmit: (d: AppFormData) => Promise<void>;
  onClose: () => void;
  initial?: Partial<Application>;
  initialCompanyName?: string;
  draftEnabled?: boolean;
}) {
  const isCreate = draftEnabled && !initial?.id;

  const matched = initialCompanyName
    ? companies.find(c => c.name.toLowerCase() === initialCompanyName.toLowerCase())
    : null;

  const [d, setD] = useState(() => {
    const base = {
      jobTitle:     initial?.jobTitle    ?? "",
      companyId:    initial?.companyId   ?? matched?.id ?? "",
      companyName:  matched ? "" : (initialCompanyName ?? ""),
      sectorId:     initial?.sectorId    ?? "",
      cvUsedId:     initial?.cvUsedId    ?? "",
      sentDate:     initial?.sentDate    ?? "",
      sourceUrl:    initial?.sourceUrl   ?? "",
      messageSent:  initial?.messageSent ?? "",
      sentVia:      initial?.sentVia     ?? "email",
      status:       initial?.status      ?? "to_prepare",
      nextAction:   initial?.nextAction  ?? "",
    };
    if (isCreate) {
      const saved = getDraft("application");
      if (saved?.data) return { ...base, ...(saved.data as typeof base) };
    }
    return base;
  });
  const [isNewCompany, setIsNewCompany] = useState(!!initialCompanyName && !matched);
  const [saving, setSaving] = useState(false);
  const up = (k: string, v: unknown) => setD(p => ({ ...p, [k]: v }));
  const doneRef = useRef(false);
  const isDirtyRef = useRef(false);
  const dRef = useRef(d);
  const firstRenderRef = useRef(true);

  useEffect(() => { dRef.current = d; }, [d]);
  useEffect(() => {
    if (firstRenderRef.current) { firstRenderRef.current = false; return; }
    isDirtyRef.current = true;
  }, [d]);
  useEffect(() => {
    if (!isCreate || !isDirtyRef.current) return;
    const t = setTimeout(() => saveDraft("application", dRef.current, dRef.current.jobTitle || "Nouvelle candidature"), 1200);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d]);
  useEffect(() => () => {
    if (!isCreate || !isDirtyRef.current || doneRef.current) return;
    saveDraft("application", dRef.current, dRef.current.jobTitle || "Nouvelle candidature");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSubmit({
      jobTitle:    d.jobTitle,
      status:      d.status as Application["status"],
      sentVia:     d.sentVia as Application["sentVia"],
      companyId:   isNewCompany ? null : (d.companyId || null),
      companyName: isNewCompany ? (d.companyName || null) : undefined,
      sectorId:    d.sectorId  || null,
      cvUsedId:    d.cvUsedId  || null,
      sentDate:    d.sentDate  || null,
      sourceUrl:   d.sourceUrl || null,
      messageSent: d.messageSent || null,
      nextAction:  d.nextAction  || null,
    });
    doneRef.current = true;
    if (isCreate) clearDraft("application");
    setSaving(false);
    onClose();
  }

  return (
    <form onSubmit={handle}>
      <div className="field">
        <label className="label">Intitulé du poste *</label>
        <input className="input" value={d.jobTitle} onChange={e => up("jobTitle", e.target.value)} required autoFocus />
      </div>

      <div className="form-grid">
        <div className="field">
          <label className="label">Entreprise</label>
          <select
            className="input"
            value={isNewCompany ? "__new__" : d.companyId}
            onChange={e => {
              if (e.target.value === "__new__") { setIsNewCompany(true); }
              else { setIsNewCompany(false); up("companyId", e.target.value); }
            }}
          >
            <option value="">— Choisir —</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            <option value="__new__">＋ Nouvelle société…</option>
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

      {isNewCompany && (
        <div className="field">
          <label className="label">Nom de la nouvelle société *</label>
          <input
            className="input"
            value={d.companyName}
            onChange={e => up("companyName", e.target.value)}
            placeholder="Airbus, Capgemini…"
          />
          <span className="muted tiny" style={{ marginTop: 3 }}>Sera créée et liée automatiquement.</span>
        </div>
      )}

      <div className="field">
        <label className="label">Lien de l&apos;offre</label>
        <input className="input" value={d.sourceUrl} onChange={e => up("sourceUrl", e.target.value)} placeholder="https://linkedin.com/jobs/…" />
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
          <label className="label">Date d&apos;envoi</label>
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
        <button type="button" className="btn" onClick={() => { doneRef.current = true; if (isCreate) clearDraft("application"); onClose(); }}>Annuler</button>
        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? "Enregistrement…" : initial?.id ? "Mettre à jour" : "Créer"}
        </button>
      </div>
    </form>
  );
}

// Reads ?new=1&title=&company=&url=&via= and opens a prefilled create modal.
// Wrapped in <Suspense> by the page (Next.js 16 requires it for useSearchParams).
interface AppPrefill { jobTitle?: string; companyName?: string; sourceUrl?: string; sentVia?: string; sentDate?: string }

function PrefillReader({ onNew }: { onNew: (p: AppPrefill) => void }) {
  const params = useSearchParams();
  useEffect(() => {
    if (params.get("new") === "1") {
      const g = (k: string) => { const v = params.get(k); return v && v.trim() ? v.trim() : undefined; };
      onNew({
        jobTitle:    g("title"),
        companyName: g("company"),
        sourceUrl:   g("url"),
        sentVia:     g("via"),
        sentDate:    g("sent"),
      });
    }
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

export default function ApplicationsPage() {
  const [apps, setApps]           = useState<Application[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [sectors, setSectors]     = useState<Sector[]>([]);
  const [cvList, setCvList]       = useState<CV[]>([]);
  const [selected, setSelected]   = useState<Application | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [prefill, setPrefill]     = useState<AppPrefill | null>(null);
  const [aiAction, setAiAction]   = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<DraftEntry | null>(null);
  // ── Filtres ──
  const [fSearch, setFSearch]   = useState("");
  const [fCompany, setFCompany] = useState("");
  const [fSector, setFSector]   = useState("");
  const [fFrom, setFFrom]       = useState("");
  const [fTo, setFTo]           = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const { showToast } = useToast();

  useEffect(() => { setDraft(getDraft("application")); }, []);

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

  async function handleCreate(data: AppFormData) {
    const resp = await fetch("/api/applications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const json = await resp.json();
    if (!resp.ok || !json.data) { showToast(json.error ?? "Erreur lors de la création", "error"); return; }
    setApps(prev => [json.data, ...prev]);
    if (data.companyName) load(); // refresh companies list if a new one was created
    celebrate();
    showToast("🎉 Candidature ajoutée !");
  }

  async function handleUpdate(data: AppFormData) {
    if (!selected) return;
    const resp = await fetch(`/api/applications/${selected.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const json = await resp.json();
    if (!resp.ok || !json.data) { showToast(json.error ?? "Erreur lors de la mise à jour", "error"); return; }
    setApps(prev => prev.map(a => a.id === json.data.id ? json.data : a));
    setSelected(json.data);
    if (data.companyName) load();
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

  // ── Application des filtres ──
  const s = fSearch.trim().toLowerCase();
  const filteredApps = apps.filter(a => {
    if (fCompany && a.companyId !== fCompany) return false;
    if (fSector && a.sectorId !== fSector) return false;
    if (s) {
      const company = a.companyId ? (companyMap[a.companyId]?.name ?? "") : "";
      if (!`${a.jobTitle} ${company}`.toLowerCase().includes(s)) return false;
    }
    if (fFrom && (!a.sentDate || a.sentDate.slice(0, 10) < fFrom)) return false;
    if (fTo && (!a.sentDate || a.sentDate.slice(0, 10) > fTo)) return false;
    return true;
  });
  const activeFilters = !!(fSearch || fCompany || fSector || fFrom || fTo);
  function resetFilters() { setFSearch(""); setFCompany(""); setFSector(""); setFFrom(""); setFTo(""); }

  function openPrefilled(p: AppPrefill) {
    setPrefill(p);
    setShowCreate(true);
  }

  return (
    <div className="main__inner--wide main__inner">
      <Suspense fallback={null}>
        <PrefillReader onNew={openPrefilled} />
      </Suspense>

      <div className="page-head">
        <div>
          <h1 className="page-head__title">Candidatures</h1>
          <p className="page-head__sub">
            {activeFilters ? `${filteredApps.length} / ${apps.length}` : apps.length} candidature{apps.length !== 1 ? "s" : ""} {activeFilters ? "filtrées" : "suivies"}
          </p>
        </div>
        <button className="btn btn--primary" onClick={() => { setPrefill(null); setShowCreate(true); }}>
          <Plus size={14} /> Nouvelle candidature
        </button>
      </div>

      {/* ── Barre de filtres ── */}
      <div className="toolbar" style={{ flexWrap: "wrap" }}>
        <div className="search" style={{ flex: "1 1 220px" }}>
          <input placeholder="Rechercher (poste, société)…" value={fSearch} onChange={e => setFSearch(e.target.value)} />
        </div>
        <button className={`chip ${showFilters || activeFilters ? "chip--active" : ""}`} onClick={() => setShowFilters(v => !v)}>
          <Filter size={13} /> Filtres{activeFilters ? " ●" : ""}
        </button>
        {activeFilters && (
          <button className="chip" onClick={resetFilters}><X size={13} /> Réinitialiser</button>
        )}
      </div>

      {(showFilters || activeFilters) && (
        <div className="card card__pad" style={{ marginBottom: 16 }}>
          <div className="form-grid">
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Société</label>
              <select className="input" value={fCompany} onChange={e => setFCompany(e.target.value)}>
                <option value="">— Toutes —</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Secteur</label>
              <select className="input" value={fSector} onChange={e => setFSector(e.target.value)}>
                <option value="">— Tous —</option>
                {sectors.map(s2 => <option key={s2.id} value={s2.id}>{s2.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-grid" style={{ marginBottom: 0 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Envoyée du</label>
              <input className="input" type="date" value={fFrom} onChange={e => setFFrom(e.target.value)} />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">au</label>
              <input className="input" type="date" value={fTo} onChange={e => setFTo(e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {draft && (
        <DraftBanner
          draft={draft}
          onResume={() => { setDraft(null); setPrefill(null); setShowCreate(true); }}
          onDiscard={() => { clearDraft("application"); setDraft(null); }}
        />
      )}

      {loading ? (
        <KanbanSkeleton columns={8} cardsPerCol={2} />
      ) : (
        <KanbanBoard
          items={filteredApps}
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

            <div className="row gap-4" style={{ marginTop: 12, flexWrap: "wrap" }}>
              {selected.sentDate && <span className="muted tiny"><Calendar size={11} /> {formatDateShort(selected.sentDate)}</span>}
              {selected.sentVia && <span className="badge badge--neutral">{selected.sentVia}</span>}
              {selected.sourceUrl && (
                <a href={selected.sourceUrl} target="_blank" rel="noopener noreferrer" className="badge badge--info" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <ExternalLink size={11} /> Voir l&apos;offre
                </a>
              )}
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

      <Modal open={showCreate} onClose={() => { setShowCreate(false); setPrefill(null); setTimeout(() => setDraft(getDraft("application")), 50); }} title="Nouvelle candidature" size="lg">
        <AppForm
          key={prefill ? "prefilled" : "blank"}
          companies={companies}
          sectors={sectors}
          cvList={cvList}
          initial={prefill ? { jobTitle: prefill.jobTitle, sourceUrl: prefill.sourceUrl, sentVia: (prefill.sentVia as Application["sentVia"]) ?? undefined, sentDate: prefill.sentDate } : undefined}
          initialCompanyName={prefill?.companyName}
          draftEnabled
          onSubmit={handleCreate}
          onClose={() => { setShowCreate(false); setPrefill(null); setTimeout(() => setDraft(getDraft("application")), 50); }}
        />
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
