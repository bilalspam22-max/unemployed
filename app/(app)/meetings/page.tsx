"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Plus, CalendarCheck, Search, ChevronDown, ChevronUp,
  Building2, User, Briefcase, Smile, Meh, Frown,
  MessageSquare, ClipboardList, ArrowRight, Trash2,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Drawer } from "@/components/ui/drawer";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ListSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/lib/store";
import { formatDate } from "@/lib/utils";
import { getDraft, clearDraft, saveDraft, type DraftEntry } from "@/lib/drafts";
import { DraftBanner } from "@/components/ui/draft-banner";
import type { Meeting, QuestionItem, Company, Contact, Application } from "@/lib/types";

// ─── Default questions ──────────────────────────────────────────────────────

const DEFAULT_QUESTIONS: QuestionItem[] = [
  { question: "Est-ce une création de poste ou un remplacement ?", asked: false, answer: "" },
  { question: "Quelle est l'urgence de ce recrutement ?", asked: false, answer: "" },
  { question: "Quelle est la timeline du processus ? À quand puis-je m'attendre à un retour ?", asked: false, answer: "" },
  { question: "Avez-vous la job description officielle sous la main ?", asked: false, answer: "" },
  { question: "Combien de candidats sont actuellement en lice ?", asked: false, answer: "" },
  { question: "Quelle est la composition de l'équipe que je rejoindrais ?", asked: false, answer: "" },
  { question: "Quels sont les principaux défis du poste ?", asked: false, answer: "" },
  { question: "Y a-t-il une fourchette de rémunération définie ?", asked: false, answer: "" },
  { question: "Quel est le mode de travail (présentiel / hybride / remote) ?", asked: false, answer: "" },
  { question: "Quelles sont les prochaines étapes du processus ?", asked: false, answer: "" },
];

// ─── Sentiment helpers ──────────────────────────────────────────────────────

const SENTIMENT_CFG = {
  positive: { icon: Smile, label: "Positif", color: "var(--success)", bg: "var(--success-soft)" },
  neutral:  { icon: Meh, label: "Neutre", color: "var(--warn)", bg: "var(--warn-soft)" },
  negative: { icon: Frown, label: "Négatif", color: "var(--danger)", bg: "var(--danger-soft)" },
} as const;

type Filter = "all" | "positive" | "neutral" | "negative";

// ─── Meeting Form ───────────────────────────────────────────────────────────

function MeetingForm({ onSubmit, onClose, initial, companies, contacts, applications, draftEnabled }: {
  onSubmit: (data: Partial<Meeting>) => Promise<void>;
  onClose: () => void;
  initial?: Partial<Meeting>;
  companies: Company[];
  contacts: Contact[];
  applications: Application[];
  draftEnabled?: boolean;
}) {
  const isCreate = draftEnabled && !initial?.id;
  const saved = isCreate ? getDraft("meeting") : null;

  const [d, setD] = useState(() => {
    const base = {
      title:         initial?.title ?? "",
      date:          initial?.date ?? new Date().toISOString().slice(0, 10),
      companyId:     initial?.companyId ?? "",
      contactId:     initial?.contactId ?? "",
      applicationId: initial?.applicationId ?? "",
      companyInfo:   initial?.companyInfo ?? "",
      myPitch:       initial?.myPitch ?? "",
      jobMentioned:  initial?.jobMentioned ?? "",
      sentiment:     initial?.sentiment ?? "neutral",
      sentimentNotes: initial?.sentimentNotes ?? "",
      nextSteps:     initial?.nextSteps ?? "",
      notes:         initial?.notes ?? "",
    };
    if (saved?.data) return { ...base, ...(saved.data as typeof base) };
    return base;
  });

  const [questions, setQuestions] = useState<QuestionItem[]>(() => {
    if (saved?.data?.questionsData) return saved.data.questionsData as QuestionItem[];
    return initial?.questionsData?.length ? initial.questionsData : DEFAULT_QUESTIONS.map(q => ({ ...q }));
  });
  const [customQ, setCustomQ] = useState("");
  const [saving, setSaving] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>("info");
  const doneRef = useRef(false);
  const isDirtyRef = useRef(false);
  const firstRenderRef = useRef(true);
  const dRef = useRef(d);
  const questionsRef = useRef(questions);
  useEffect(() => { dRef.current = d; }, [d]);
  useEffect(() => { questionsRef.current = questions; }, [questions]);
  useEffect(() => {
    if (firstRenderRef.current) { firstRenderRef.current = false; return; }
    isDirtyRef.current = true;
  }, [d, questions]);
  useEffect(() => {
    if (!isCreate || !isDirtyRef.current) return;
    const t = setTimeout(() => saveDraft("meeting", { ...dRef.current, questionsData: questionsRef.current }, dRef.current.title || "Nouvelle réunion"), 1200);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, questions]);
  useEffect(() => () => {
    if (!isCreate || !isDirtyRef.current || doneRef.current) return;
    saveDraft("meeting", { ...dRef.current, questionsData: questionsRef.current }, dRef.current.title || "Nouvelle réunion");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function up(key: string, val: unknown) { setD(prev => ({ ...prev, [key]: val })); }

  function toggleQuestion(idx: number) {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, asked: !q.asked } : q));
  }
  function updateAnswer(idx: number, answer: string) {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, answer } : q));
  }
  function addCustomQuestion() {
    if (!customQ.trim()) return;
    setQuestions(prev => [...prev, { question: customQ.trim(), asked: false, answer: "" }]);
    setCustomQ("");
  }
  function removeQuestion(idx: number) {
    setQuestions(prev => prev.filter((_, i) => i !== idx));
  }

  function toggleSection(section: string) {
    setExpandedSection(prev => prev === section ? null : section);
  }

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSubmit({
      ...d,
      companyId: d.companyId || null,
      contactId: d.contactId || null,
      applicationId: d.applicationId || null,
      companyInfo: d.companyInfo || null,
      myPitch: d.myPitch || null,
      jobMentioned: d.jobMentioned || null,
      sentimentNotes: d.sentimentNotes || null,
      nextSteps: d.nextSteps || null,
      notes: d.notes || null,
      questionsData: questions,
    });
    doneRef.current = true;
    if (isCreate) clearDraft("meeting");
    setSaving(false);
    onClose();
  }

  const SectionHeader = ({ id, icon: Icon, label }: { id: string; icon: React.ElementType; label: string }) => (
    <button
      type="button"
      className="row between"
      onClick={() => toggleSection(id)}
      style={{
        width: "100%", padding: "10px 0", border: "none", background: "none",
        cursor: "pointer", color: "var(--ink)", fontWeight: 600, fontSize: 13,
      }}
    >
      <span className="row gap-2"><Icon size={14} strokeWidth={1.75} /> {label}</span>
      {expandedSection === id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
    </button>
  );

  return (
    <form onSubmit={handle} style={{ maxHeight: "70vh", overflowY: "auto" }}>
      {/* Basic info — always visible */}
      <div className="form-grid">
        <div className="field">
          <label className="label">Titre de la réunion *</label>
          <input className="input" value={d.title} onChange={e => up("title", e.target.value)} required placeholder="Ex: Entretien RH Airbus" />
        </div>
        <div className="field">
          <label className="label">Date *</label>
          <input className="input" type="date" value={d.date} onChange={e => up("date", e.target.value)} required />
        </div>
      </div>
      <div className="form-grid">
        <div className="field">
          <label className="label">Entreprise</label>
          <select className="input" value={d.companyId} onChange={e => up("companyId", e.target.value)}>
            <option value="">— Aucune —</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="label">Contact</label>
          <select className="input" value={d.contactId} onChange={e => up("contactId", e.target.value)}>
            <option value="">— Aucun —</option>
            {contacts.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
          </select>
        </div>
      </div>
      <div className="field">
        <label className="label">Candidature liée</label>
        <select className="input" value={d.applicationId} onChange={e => up("applicationId", e.target.value)}>
          <option value="">— Aucune —</option>
          {applications.map(a => <option key={a.id} value={a.id}>{a.jobTitle}</option>)}
        </select>
      </div>

      <div className="divider" style={{ margin: "16px 0 8px" }} />

      {/* Collapsible sections */}

      {/* Company Info */}
      <SectionHeader id="info" icon={Building2} label="Infos entreprise reçues" />
      {expandedSection === "info" && (
        <div className="field" style={{ paddingBottom: 8 }}>
          <textarea className="input" value={d.companyInfo} onChange={e => up("companyInfo", e.target.value)}
            rows={3} placeholder="Ce que ton interlocuteur t'a dit sur l'entreprise (culture, projets, équipe…)" />
        </div>
      )}

      {/* My Pitch */}
      <SectionHeader id="pitch" icon={MessageSquare} label="Mon pitch de présentation" />
      {expandedSection === "pitch" && (
        <div className="field" style={{ paddingBottom: 8 }}>
          <textarea className="input" value={d.myPitch} onChange={e => up("myPitch", e.target.value)}
            rows={3} placeholder="Le speech de présentation que tu as donné…" />
        </div>
      )}

      {/* Job mentioned */}
      <SectionHeader id="job" icon={Briefcase} label="Offres d'emploi mentionnées" />
      {expandedSection === "job" && (
        <div className="field" style={{ paddingBottom: 8 }}>
          <textarea className="input" value={d.jobMentioned} onChange={e => up("jobMentioned", e.target.value)}
            rows={3} placeholder="Postes/offres dont ton interlocuteur a parlé (titre, description, lien…)" />
        </div>
      )}

      {/* Sentiment */}
      <SectionHeader id="sentiment" icon={Smile} label="Sentiment / Feeling" />
      {expandedSection === "sentiment" && (
        <div style={{ paddingBottom: 8 }}>
          <div className="row gap-2" style={{ marginBottom: 8 }}>
            {(["positive", "neutral", "negative"] as const).map(s => {
              const cfg = SENTIMENT_CFG[s];
              const Icon = cfg.icon;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => up("sentiment", s)}
                  style={{
                    flex: 1, padding: "8px 12px", borderRadius: "var(--r-md)", border: "2px solid",
                    borderColor: d.sentiment === s ? cfg.color : "var(--border)",
                    background: d.sentiment === s ? cfg.bg : "transparent",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    fontSize: 12, fontWeight: 600, color: d.sentiment === s ? cfg.color : "var(--muted)",
                    transition: "all .15s ease",
                  }}
                >
                  <Icon size={16} /> {cfg.label}
                </button>
              );
            })}
          </div>
          <div className="field">
            <textarea className="input" value={d.sentimentNotes} onChange={e => up("sentimentNotes", e.target.value)}
              rows={2} placeholder="Notes sur ton ressenti…" />
          </div>
        </div>
      )}

      {/* Questions */}
      <SectionHeader id="questions" icon={ClipboardList} label="Questions à poser / Réponses" />
      {expandedSection === "questions" && (
        <div style={{ paddingBottom: 8 }}>
          <div className="col gap-2">
            {questions.map((q, i) => (
              <div key={i} style={{
                background: q.asked ? "var(--success-soft)" : "var(--surface-2)",
                borderRadius: "var(--r-md)", padding: "10px 12px",
                border: "1px solid", borderColor: q.asked ? "var(--success)" : "var(--border)",
                transition: "all .15s ease",
              }}>
                <div className="row gap-2" style={{ marginBottom: q.asked ? 8 : 0 }}>
                  <input
                    type="checkbox"
                    checked={q.asked}
                    onChange={() => toggleQuestion(i)}
                    style={{ accentColor: "var(--success)", cursor: "pointer" }}
                  />
                  <span style={{ flex: 1, fontSize: 12.5, fontWeight: 500 }}>{q.question}</span>
                  <button type="button" onClick={() => removeQuestion(i)} className="btn btn--ghost btn--icon" style={{ opacity: 0.5 }}>
                    <Trash2 size={12} />
                  </button>
                </div>
                {q.asked && (
                  <textarea
                    className="input"
                    value={q.answer}
                    onChange={e => updateAnswer(i, e.target.value)}
                    rows={2}
                    placeholder="Réponse obtenue…"
                    style={{ fontSize: 12, marginTop: 4 }}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="row gap-2" style={{ marginTop: 8 }}>
            <input
              className="input"
              value={customQ}
              onChange={e => setCustomQ(e.target.value)}
              placeholder="Ajouter une question personnalisée…"
              style={{ flex: 1, fontSize: 12 }}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustomQuestion(); } }}
            />
            <button type="button" className="btn btn--sm" onClick={addCustomQuestion}>
              <Plus size={12} /> Ajouter
            </button>
          </div>
        </div>
      )}

      {/* Next steps */}
      <SectionHeader id="next" icon={ArrowRight} label="Prochaines étapes" />
      {expandedSection === "next" && (
        <div className="field" style={{ paddingBottom: 8 }}>
          <textarea className="input" value={d.nextSteps} onChange={e => up("nextSteps", e.target.value)}
            rows={2} placeholder="Ce qui a été convenu comme suite (2e entretien le…, envoi du CV adapté…)" />
        </div>
      )}

      {/* Notes */}
      <div className="field" style={{ marginTop: 8 }}>
        <label className="label">Notes libres</label>
        <textarea className="input" value={d.notes} onChange={e => up("notes", e.target.value)}
          rows={2} placeholder="Toute autre remarque…" />
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
        <button type="button" className="btn" onClick={() => { doneRef.current = true; if (isCreate) clearDraft("meeting"); onClose(); }}>Annuler</button>
        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? "Enregistrement…" : initial?.id ? "Mettre à jour" : "Créer"}
        </button>
      </div>
    </form>
  );
}

// ─── Meeting Detail ─────────────────────────────────────────────────────────

function MeetingDetail({ meeting }: { meeting: Meeting }) {
  const sentimentCfg = meeting.sentiment ? SENTIMENT_CFG[meeting.sentiment] : null;
  const SentimentIcon = sentimentCfg?.icon ?? Meh;

  return (
    <div className="col gap-4">
      {/* Date + Sentiment */}
      <div className="row gap-3">
        <Badge tone="info">{formatDate(meeting.date)}</Badge>
        {sentimentCfg && (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            fontSize: 12, fontWeight: 600, color: sentimentCfg.color,
            background: sentimentCfg.bg, padding: "3px 10px", borderRadius: "var(--r-full)",
          }}>
            <SentimentIcon size={13} /> {sentimentCfg.label}
          </span>
        )}
      </div>

      {/* Company info */}
      {meeting.companyInfo && (
        <div>
          <div className="section-title"><Building2 size={13} style={{ display: "inline", marginRight: 4 }} /> Infos entreprise</div>
          <div className="card" style={{ padding: 12, background: "var(--surface-2)", fontSize: 13, whiteSpace: "pre-wrap" }}>
            {meeting.companyInfo}
          </div>
        </div>
      )}

      {/* Pitch */}
      {meeting.myPitch && (
        <div>
          <div className="section-title"><MessageSquare size={13} style={{ display: "inline", marginRight: 4 }} /> Mon pitch</div>
          <div className="card" style={{ padding: 12, background: "var(--primary-soft)", fontSize: 13, whiteSpace: "pre-wrap" }}>
            {meeting.myPitch}
          </div>
        </div>
      )}

      {/* Job mentioned */}
      {meeting.jobMentioned && (
        <div>
          <div className="section-title"><Briefcase size={13} style={{ display: "inline", marginRight: 4 }} /> Offres d&apos;emploi mentionnées</div>
          <div className="card" style={{ padding: 12, background: "var(--warn-soft)", fontSize: 13, whiteSpace: "pre-wrap" }}>
            {meeting.jobMentioned}
          </div>
        </div>
      )}

      {/* Sentiment notes */}
      {meeting.sentimentNotes && (
        <div>
          <div className="section-title"><Smile size={13} style={{ display: "inline", marginRight: 4 }} /> Notes sentiment</div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>{meeting.sentimentNotes}</div>
        </div>
      )}

      {/* Questions & Answers */}
      {meeting.questionsData?.length > 0 && (
        <div>
          <div className="section-title"><ClipboardList size={13} style={{ display: "inline", marginRight: 4 }} /> Questions &amp; Réponses</div>
          <div className="col gap-2">
            {meeting.questionsData.map((q, i) => (
              <div key={i} style={{
                padding: "8px 12px", borderRadius: "var(--r-md)", fontSize: 12.5,
                background: q.asked ? "var(--success-soft)" : "var(--surface-2)",
                border: "1px solid", borderColor: q.asked ? "var(--success)" : "var(--border)",
                opacity: q.asked ? 1 : 0.6,
              }}>
                <div style={{ fontWeight: 600, marginBottom: q.answer ? 4 : 0 }}>
                  {q.asked ? "✅" : "⬜"} {q.question}
                </div>
                {q.answer && (
                  <div style={{ color: "var(--muted)", paddingLeft: 20, whiteSpace: "pre-wrap" }}>{q.answer}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next steps */}
      {meeting.nextSteps && (
        <div>
          <div className="section-title"><ArrowRight size={13} style={{ display: "inline", marginRight: 4 }} /> Prochaines étapes</div>
          <div className="card" style={{ padding: 12, background: "var(--primary-soft)", fontSize: 13, whiteSpace: "pre-wrap" }}>
            {meeting.nextSteps}
          </div>
        </div>
      )}

      {/* Free notes */}
      {meeting.notes && (
        <div>
          <div className="section-title">Notes libres</div>
          <div style={{ fontSize: 13, color: "var(--muted)", whiteSpace: "pre-wrap" }}>{meeting.notes}</div>
        </div>
      )}
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selected, setSelected] = useState<Meeting | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<DraftEntry | null>(null);
  const { showToast } = useToast();

  useEffect(() => { setDraft(getDraft("meeting")); }, []);

  // Load each list independently so one failing endpoint never blanks the others
  // (a single Promise.all that rejects used to wipe all dropdowns on the server).
  const load = useCallback(() => {
    fetch("/api/meetings").then(r => r.json())
      .then(r => setMeetings(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
    fetch("/api/companies").then(r => r.json()).then(r => setCompanies(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    fetch("/api/contacts").then(r => r.json()).then(r => setContacts(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    fetch("/api/applications").then(r => r.json()).then(r => setApplications(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(data: Partial<Meeting>) {
    const resp = await fetch("/api/meetings", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const { data: created } = await resp.json();
    setMeetings(prev => [created, ...prev]);
    showToast("Réunion créée ✓");
  }

  async function handleUpdate(data: Partial<Meeting>) {
    if (!selected) return;
    const resp = await fetch(`/api/meetings/${selected.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const { data: updated } = await resp.json();
    setMeetings(prev => prev.map(m => m.id === updated.id ? updated : m));
    setSelected(updated);
    setShowEdit(false);
    showToast("Réunion mise à jour ✓");
  }

  async function handleDelete() {
    if (!selected) return;
    await fetch(`/api/meetings/${selected.id}`, { method: "DELETE" });
    setMeetings(prev => prev.filter(m => m.id !== selected.id));
    setSelected(null);
    setConfirmDelete(false);
    showToast("Réunion supprimée");
  }

  // Helpers
  function getCompanyName(id: string | null) {
    if (!id) return null;
    return companies.find(c => c.id === id)?.name ?? null;
  }
  function getContactName(id: string | null) {
    if (!id) return null;
    const c = contacts.find(c => c.id === id);
    return c ? `${c.firstName} ${c.lastName}` : null;
  }

  const filtered = meetings.filter(m => {
    if (search && !`${m.title} ${getCompanyName(m.companyId) ?? ""}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter !== "all" && m.sentiment !== filter) return false;
    return true;
  });

  const FILTERS: Array<{ id: Filter; label: string }> = [
    { id: "all",      label: "Toutes" },
    { id: "positive", label: "😊 Positives" },
    { id: "neutral",  label: "😐 Neutres" },
    { id: "negative", label: "😔 Négatives" },
  ];

  return (
    <div className="main__inner">
      <div className="page-head">
        <div>
          <h1 className="page-head__title">Réunions</h1>
          <p className="page-head__sub">{meetings.length} réunion{meetings.length !== 1 ? "s" : ""} enregistrée{meetings.length !== 1 ? "s" : ""}</p>
        </div>
        <button className="btn btn--primary" onClick={() => setShowCreate(true)}>
          <Plus size={14} /> Nouvelle réunion
        </button>
      </div>

      {draft && (
        <DraftBanner
          draft={draft}
          onResume={() => { setDraft(null); setShowCreate(true); }}
          onDiscard={() => { clearDraft("meeting"); setDraft(null); }}
        />
      )}

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search">
          <input placeholder="Rechercher une réunion…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {FILTERS.map(f => (
          <button key={f.id} className={`chip ${filter === f.id ? "chip--active" : ""}`} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Meetings list */}
      {loading ? (
        <ListSkeleton rows={5} />
      ) : (
        <div className="col gap-2">
          {filtered.length === 0 && (
            search || filter !== "all" ? (
              <EmptyState icon={Search} title="Aucune réunion trouvée" description="Aucune réunion ne correspond à ta recherche." tone="neutral" />
            ) : (
              <EmptyState
                icon={CalendarCheck}
                title="Prépare tes réunions"
                description="Ajoute ta première réunion pour structurer tes notes, poser les bonnes questions et ne rien oublier."
                action={{ label: "Nouvelle réunion", onClick: () => setShowCreate(true), icon: Plus }}
                tone="primary"
              />
            )
          )}
          {filtered.map(m => {
            const sentCfg = m.sentiment ? SENTIMENT_CFG[m.sentiment] : null;
            const SIcon = sentCfg?.icon ?? Meh;
            const companyName = getCompanyName(m.companyId);
            const contactName = getContactName(m.contactId);
            const answeredCount = (m.questionsData ?? []).filter(q => q.asked).length;
            const totalQ = (m.questionsData ?? []).length;

            return (
              <div key={m.id} className="contact-row" onClick={() => setSelected(m)} style={{ cursor: "pointer" }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "var(--r-md)", flexShrink: 0,
                  background: sentCfg?.bg ?? "var(--surface-2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <SIcon size={18} color={sentCfg?.color ?? "var(--muted)"} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {m.title}
                  </div>
                  <div className="muted tiny">
                    {formatDate(m.date)}
                    {companyName && ` · ${companyName}`}
                    {contactName && ` · ${contactName}`}
                  </div>
                </div>
                {totalQ > 0 && (
                  <Badge tone={answeredCount === totalQ ? "success" : "warn"}>
                    {answeredCount}/{totalQ} Q
                  </Badge>
                )}
                {m.nextSteps && (
                  <Badge tone="info">Next steps</Badge>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Drawer */}
      {selected && !showEdit && (
        <Drawer
          open={true}
          onClose={() => setSelected(null)}
          title={selected.title}
          subtitle={`${formatDate(selected.date)}${getCompanyName(selected.companyId) ? ` · ${getCompanyName(selected.companyId)}` : ""}`}
          footer={
            <>
              <button className="btn" style={{ color: "var(--danger)" }} onClick={() => setConfirmDelete(true)}>Supprimer</button>
              <button className="btn btn--primary btn--full" onClick={() => setShowEdit(true)}>Modifier</button>
            </>
          }
        >
          <MeetingDetail meeting={selected} />
        </Drawer>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); setTimeout(() => setDraft(getDraft("meeting")), 50); }} title="Nouvelle réunion" size="lg">
        <MeetingForm
          draftEnabled
          onSubmit={handleCreate}
          onClose={() => { setShowCreate(false); setTimeout(() => setDraft(getDraft("meeting")), 50); }}
          companies={companies}
          contacts={contacts}
          applications={applications}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Modifier la réunion" size="lg">
        <MeetingForm
          initial={selected ?? undefined}
          onSubmit={handleUpdate}
          onClose={() => setShowEdit(false)}
          companies={companies}
          contacts={contacts}
          applications={applications}
        />
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        message="Cette réunion sera définitivement supprimée. Cette action est irréversible."
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
