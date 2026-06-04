"use client";

import { useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import {
  Plus, CalendarCheck, Search, ChevronDown, ChevronUp,
  Building2, User, Briefcase, Smile, Meh, Frown,
  MessageSquare, ClipboardList, ArrowRight, Trash2,
  Copy, Download,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
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
      clientInfo:    initial?.clientInfo ?? "",
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
  function updateQuestion(idx: number, question: string) {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, question } : q));
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
    try {
      await onSubmit({
        ...d,
        companyId: d.companyId || null,
        contactId: d.contactId || null,
        applicationId: d.applicationId || null,
        companyInfo: d.companyInfo || null,
        myPitch: d.myPitch || null,
        jobMentioned: d.jobMentioned || null,
        sentimentNotes: d.sentimentNotes || null,
        clientInfo: d.clientInfo || null,
        nextSteps: d.nextSteps || null,
        notes: d.notes || null,
        questionsData: questions,
      });
      doneRef.current = true;
      if (isCreate) clearDraft("meeting");
      onClose();
    } catch {
      // L'erreur est déjà signalée par un toast dans le handler ;
      // on garde le formulaire ouvert pour ne pas perdre la saisie.
    } finally {
      setSaving(false); // ne reste JAMAIS bloqué sur « Enregistrement… »
    }
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

      {/* Client info */}
      <SectionHeader id="client" icon={User} label="Infos client" />
      {expandedSection === "client" && (
        <div className="field" style={{ paddingBottom: 8 }}>
          <textarea className="input" value={d.clientInfo} onChange={e => up("clientInfo", e.target.value)}
            rows={3} placeholder="Le client final mentionné : nom, secteur, besoin, contexte, contact…" />
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
                    style={{ accentColor: "var(--success)", cursor: "pointer", flexShrink: 0 }}
                  />
                  <input
                    className="input"
                    value={q.question}
                    onChange={e => updateQuestion(i, e.target.value)}
                    placeholder="Question…"
                    style={{ flex: 1, fontSize: 12.5, fontWeight: 500, padding: "4px 8px", height: "auto", background: "transparent", border: "1px solid transparent" }}
                    onFocus={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--surface)"; }}
                    onBlur={e => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.background = "transparent"; }}
                  />
                  <button type="button" onClick={() => removeQuestion(i)} className="btn btn--ghost btn--icon" style={{ opacity: 0.5, flexShrink: 0 }}>
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

// One content block of the report: icon + title + body, with a colored left accent.
function ReportSection({ icon: Icon, label, accent, children }: {
  icon: React.ElementType; label: string; accent: string; children: ReactNode;
}) {
  return (
    <section className="mtg-section" style={{ borderLeftColor: accent }}>
      <div className="mtg-section__title">
        <Icon size={13} color={accent} /> {label}
      </div>
      <div className="mtg-section__body">{children}</div>
    </section>
  );
}

function MeetingDetail({ meeting, companyName, contactName, applicationName }: {
  meeting: Meeting;
  companyName?: string | null;
  contactName?: string | null;
  applicationName?: string | null;
}) {
  const sentimentCfg = meeting.sentiment ? SENTIMENT_CFG[meeting.sentiment] : null;
  const SentimentIcon = sentimentCfg?.icon ?? Meh;
  const qs = meeting.questionsData ?? [];
  const askedCount = qs.filter(q => q.asked).length;

  const meta: Array<{ icon: React.ElementType; label: string; value: string }> = [];
  if (companyName)     meta.push({ icon: Building2, label: "Entreprise",  value: companyName });
  if (contactName)     meta.push({ icon: User,      label: "Contact",     value: contactName });
  if (applicationName) meta.push({ icon: Briefcase, label: "Candidature", value: applicationName });

  return (
    <div className="mtg-detail">
      {/* En-tête : date + ressenti + métadonnées */}
      <div className="mtg-header">
        <div className="row gap-2" style={{ flexWrap: "wrap", alignItems: "center" }}>
          <Badge tone="info">{formatDate(meeting.date)}</Badge>
          {sentimentCfg && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              fontSize: 12, fontWeight: 700, color: sentimentCfg.color,
              background: sentimentCfg.bg, padding: "3px 10px", borderRadius: "var(--r-full)",
            }}>
              <SentimentIcon size={13} /> {sentimentCfg.label}
            </span>
          )}
          {qs.length > 0 && (
            <span className="badge badge--neutral">{askedCount}/{qs.length} questions posées</span>
          )}
        </div>
        {meta.length > 0 && (
          <div className="mtg-meta">
            {meta.map((m, i) => (
              <div key={i} className="mtg-meta__item">
                <m.icon size={13} className="mtg-meta__icon" />
                <div>
                  <div className="mtg-meta__label">{m.label}</div>
                  <div className="mtg-meta__value">{m.value}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {meeting.companyInfo && (
        <ReportSection icon={Building2} label="Infos entreprise reçues" accent="var(--info)">
          {meeting.companyInfo}
        </ReportSection>
      )}
      {meeting.myPitch && (
        <ReportSection icon={MessageSquare} label="Mon pitch de présentation" accent="var(--primary)">
          {meeting.myPitch}
        </ReportSection>
      )}
      {meeting.jobMentioned && (
        <ReportSection icon={Briefcase} label="Offres d'emploi mentionnées" accent="var(--warn)">
          {meeting.jobMentioned}
        </ReportSection>
      )}
      {meeting.clientInfo && (
        <ReportSection icon={User} label="Infos client" accent="var(--plum)">
          {meeting.clientInfo}
        </ReportSection>
      )}
      {meeting.sentimentNotes && (
        <ReportSection icon={Smile} label="Notes sur le ressenti" accent={sentimentCfg?.color ?? "var(--muted)"}>
          {meeting.sentimentNotes}
        </ReportSection>
      )}

      {qs.length > 0 && (
        <ReportSection icon={ClipboardList} label="Questions & réponses" accent="var(--success)">
          <div className="mtg-qa">
            {qs.map((q, i) => (
              <div key={i} className={`mtg-qa__item ${q.asked ? "is-asked" : ""}`}>
                <div className="mtg-qa__q">
                  <span className="mtg-qa__check">{q.asked ? "✓" : "○"}</span>
                  <span>{q.question}</span>
                </div>
                {q.answer && q.answer.trim() && (
                  <div className="mtg-qa__a">{q.answer}</div>
                )}
              </div>
            ))}
          </div>
        </ReportSection>
      )}

      {meeting.nextSteps && (
        <ReportSection icon={ArrowRight} label="Prochaines étapes" accent="var(--primary)">
          {meeting.nextSteps}
        </ReportSection>
      )}
      {meeting.notes && (
        <ReportSection icon={MessageSquare} label="Notes libres" accent="var(--border-strong)">
          {meeting.notes}
        </ReportSection>
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

  // Fetch with a 15s timeout so a stuck request never hangs the form forever.
  async function postJson(url: string, method: string, data: unknown): Promise<{ data?: Meeting; error?: string } | null> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    try {
      const resp = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data), signal: ctrl.signal,
      });
      const json = await resp.json().catch(() => null);
      if (!resp.ok) return { error: json?.error ?? `Erreur ${resp.status}` };
      return json;
    } catch (e) {
      const aborted = e instanceof DOMException && e.name === "AbortError";
      return { error: aborted ? "La requête a expiré (serveur trop lent)." : "Échec réseau." };
    } finally {
      clearTimeout(timer);
    }
  }

  async function handleCreate(data: Partial<Meeting>) {
    const json = await postJson("/api/meetings", "POST", data);
    if (!json?.data) { showToast(json?.error ?? "Erreur lors de la création", "error"); throw new Error("create failed"); }
    setMeetings(prev => [json.data!, ...prev]);
    showToast("Réunion créée ✓");
  }

  async function handleUpdate(data: Partial<Meeting>) {
    if (!selected) return;
    const json = await postJson(`/api/meetings/${selected.id}`, "PUT", data);
    if (!json?.data) { showToast(json?.error ?? "Erreur lors de la mise à jour", "error"); throw new Error("update failed"); }
    setMeetings(prev => prev.map(m => m.id === json.data!.id ? json.data! : m));
    setSelected(json.data!);
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

  // ── Export du compte rendu (texte/markdown, pour ChatGPT, etc.) ──
  function buildMeetingExport(m: Meeting): string {
    const company = getCompanyName(m.companyId);
    const contact = getContactName(m.contactId);
    const appName = m.applicationId ? (applications.find(a => a.id === m.applicationId)?.jobTitle ?? null) : null;
    const sentimentLabel = m.sentiment ? (SENTIMENT_CFG[m.sentiment]?.label ?? m.sentiment) : null;

    const out: string[] = [];
    out.push(`# Compte rendu de réunion — ${m.title}`);
    out.push("");
    out.push(`Date : ${formatDate(m.date)}`);
    if (company) out.push(`Entreprise : ${company}`);
    if (contact) out.push(`Contact : ${contact}`);
    if (appName) out.push(`Candidature liée : ${appName}`);
    if (sentimentLabel) out.push(`Ressenti : ${sentimentLabel}`);
    out.push("");

    const sec = (title: string, content: string | null | undefined) => {
      if (content && content.trim()) { out.push(`## ${title}`); out.push(content.trim()); out.push(""); }
    };
    sec("Infos entreprise reçues", m.companyInfo);
    sec("Mon pitch de présentation", m.myPitch);
    sec("Offres d'emploi mentionnées", m.jobMentioned);
    sec("Infos client", m.clientInfo);

    const qs = m.questionsData ?? [];
    if (qs.some(q => q.asked || (q.answer && q.answer.trim()))) {
      out.push("## Questions & réponses");
      for (const q of qs) {
        out.push(`- ${q.asked ? "[posée]" : "[non posée]"} ${q.question}`);
        if (q.answer && q.answer.trim()) out.push(`  → ${q.answer.trim()}`);
      }
      out.push("");
    }

    sec("Notes sur le ressenti", m.sentimentNotes);
    sec("Prochaines étapes", m.nextSteps);
    sec("Notes libres", m.notes);
    return out.join("\n").trim() + "\n";
  }

  async function copyMeetingExport(m: Meeting) {
    try {
      await navigator.clipboard.writeText(buildMeetingExport(m));
      showToast("Compte rendu copié ✓");
    } catch {
      showToast("Impossible de copier", "error");
    }
  }

  function downloadMeetingExport(m: Meeting) {
    const text = buildMeetingExport(m);
    const slug = (m.title || "reunion").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `compte-rendu-${slug}-${m.date}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast("Compte rendu téléchargé ✓");
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

      {/* Detail Modal (large, redimensionnable) */}
      {selected && !showEdit && (
        <Modal
          open={true}
          onClose={() => setSelected(null)}
          title={selected.title}
          size="lg"
          footer={
            <>
              <button className="btn" style={{ color: "var(--danger)" }} onClick={() => setConfirmDelete(true)}>Supprimer</button>
              <button className="btn btn--primary btn--full" onClick={() => setShowEdit(true)}>Modifier</button>
            </>
          }
        >
          {/* Export du compte rendu */}
          <div className="mtg-export">
            <div className="mtg-export__label">
              Exporter le compte rendu <span className="muted tiny">(à coller dans ChatGPT pour générer un PV)</span>
            </div>
            <div className="row gap-2" style={{ flexWrap: "wrap" }}>
              <button className="btn btn--sm btn--primary" onClick={() => copyMeetingExport(selected)}>
                <Copy size={13} /> Copier
              </button>
              <button className="btn btn--sm" onClick={() => downloadMeetingExport(selected)}>
                <Download size={13} /> Télécharger (.md)
              </button>
            </div>
          </div>
          <MeetingDetail
            meeting={selected}
            companyName={getCompanyName(selected.companyId)}
            contactName={getContactName(selected.contactId)}
            applicationName={selected.applicationId ? (applications.find(a => a.id === selected.applicationId)?.jobTitle ?? null) : null}
          />
        </Modal>
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
