"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Network, Users, KanbanSquare, CalendarCheck,
  Link2, Unlink, ChevronDown, ChevronUp, UserCheck, Plus, X,
} from "lucide-react";
import { Badge, TempDot } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { ListSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/lib/store";
import { formatDate, statusLabel, statusColor } from "@/lib/utils";
import type { Company, Contact, Application, Meeting } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OverviewData {
  companies: Company[];
  contacts: Contact[];
  applications: Application[];
  meetings: Meeting[];
}

type LinkType = "contact" | "application" | "meeting";

interface LinkModal {
  type: LinkType;
  entityId: string;
}

// ─── Quick-create forms (minimal, inline) ─────────────────────────────────────

function QuickAddCompany({ onDone }: { onDone: (c: Company) => void }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  async function handle(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const resp = await fetch("/api/companies", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    const json = await resp.json();
    setSaving(false);
    if (!resp.ok || !json.data) { showToast(json.error ?? "Erreur", "error"); return; }
    setName("");
    onDone(json.data);
    showToast("Entreprise créée ✓");
  }

  return (
    <form onSubmit={handle} className="row gap-2" style={{ marginTop: 8 }}>
      <input className="input" style={{ flex: 1, fontSize: 13 }} placeholder="Nom de l'entreprise…" value={name} onChange={e => setName(e.target.value)} />
      <button type="submit" className="btn btn--primary btn--sm" disabled={saving || !name.trim()}>
        {saving ? "…" : <Plus size={13} />}
      </button>
    </form>
  );
}

function QuickAddContact({ companyId, onDone }: { companyId?: string; onDone: (c: Contact) => void }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  async function handle(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;
    setSaving(true);
    const resp = await fetch("/api/contacts", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim(), companyId: companyId ?? null }),
    });
    const json = await resp.json();
    setSaving(false);
    if (!resp.ok || !json.data) { showToast(json.error ?? "Erreur", "error"); return; }
    setFirstName(""); setLastName("");
    onDone(json.data);
    showToast("Contact créé ✓");
  }

  return (
    <form onSubmit={handle} className="col gap-2" style={{ marginTop: 8 }}>
      <div className="row gap-2">
        <input className="input" style={{ flex: 1, fontSize: 13 }} placeholder="Prénom" value={firstName} onChange={e => setFirstName(e.target.value)} />
        <input className="input" style={{ flex: 1, fontSize: 13 }} placeholder="Nom" value={lastName} onChange={e => setLastName(e.target.value)} />
        <button type="submit" className="btn btn--primary btn--sm" disabled={saving || !firstName.trim() || !lastName.trim()}>
          {saving ? "…" : <Plus size={13} />}
        </button>
      </div>
    </form>
  );
}

function QuickAddApplication({ companyId, contactId, onDone }: { companyId?: string; contactId?: string; onDone: (a: Application) => void }) {
  const [jobTitle, setJobTitle] = useState("");
  const [saving, setSaving]     = useState(false);
  const { showToast } = useToast();

  async function handle(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!jobTitle.trim()) return;
    setSaving(true);
    const resp = await fetch("/api/applications", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobTitle: jobTitle.trim(), companyId: companyId ?? null, contactId: contactId ?? null }),
    });
    const json = await resp.json();
    setSaving(false);
    if (!resp.ok || !json.data) { showToast(json.error ?? "Erreur", "error"); return; }
    setJobTitle("");
    onDone(json.data);
    showToast("Candidature créée ✓");
  }

  return (
    <form onSubmit={handle} className="row gap-2" style={{ marginTop: 8 }}>
      <input className="input" style={{ flex: 1, fontSize: 13 }} placeholder="Intitulé du poste…" value={jobTitle} onChange={e => setJobTitle(e.target.value)} />
      <button type="submit" className="btn btn--primary btn--sm" disabled={saving || !jobTitle.trim()}>
        {saving ? "…" : <Plus size={13} />}
      </button>
    </form>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OverviewPage() {
  const [data, setData]       = useState<OverviewData>({ companies: [], contacts: [], applications: [], meetings: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set());
  const [linkModal, setLinkModal] = useState<LinkModal | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [selectedContactId, setSelectedContactId] = useState("");
  const [showAddCompany, setShowAddCompany]   = useState(false);
  const [showAddContact, setShowAddContact]   = useState<string | null>(null); // companyId or "orphan"
  const [showAddApp, setShowAddApp]           = useState<string | null>(null); // companyId or "orphan"
  const { showToast } = useToast();

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/overview").then(r => r.json());
      if (r.data) {
        setData(r.data);
        if (r.data.companies?.length) {
          setExpandedCompanies(new Set(r.data.companies.slice(0, 5).map((c: Company) => c.id)));
        }
      }
    } catch { /* keep empty */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const { companies, contacts, applications, meetings } = data;

  // Build clusters
  const clusters = companies.map(company => ({
    company,
    contacts: contacts.filter(c => c.companyId === company.id),
    applications: applications.filter(a => a.companyId === company.id),
    meetings: meetings.filter(m => m.companyId === company.id),
  })).filter(cl => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      cl.company.name.toLowerCase().includes(s) ||
      cl.contacts.some(c => `${c.firstName} ${c.lastName}`.toLowerCase().includes(s)) ||
      cl.applications.some(a => a.jobTitle.toLowerCase().includes(s))
    );
  });

  const orphanContacts     = contacts.filter(c => !c.companyId).filter(c => !search || `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase()));
  const orphanApplications = applications.filter(a => !a.companyId).filter(a => !search || a.jobTitle.toLowerCase().includes(search.toLowerCase()));

  function toggleExpand(id: string) {
    setExpandedCompanies(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  async function applyLink() {
    if (!linkModal || !selectedCompanyId) return;
    const { type, entityId } = linkModal;
    const endpoint = type === "contact" ? "contacts" : type === "application" ? "applications" : "meetings";
    const body: Record<string, string | null> = { companyId: selectedCompanyId };
    if (type === "application" && selectedContactId) body.contactId = selectedContactId;
    await fetch(`/api/${endpoint}/${entityId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    showToast("Liaison créée ✓");
    setLinkModal(null); setSelectedCompanyId(""); setSelectedContactId("");
    load();
  }

  async function assignContact(applicationId: string, contactId: string | null) {
    await fetch(`/api/applications/${applicationId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contactId }) });
    showToast(contactId ? "Contact assigné ✓" : "Contact retiré");
    load();
  }

  async function unlinkEntity(type: LinkType, entityId: string) {
    const endpoint = type === "contact" ? "contacts" : type === "application" ? "applications" : "meetings";
    const body: Record<string, null> = { companyId: null };
    if (type === "application") body.contactId = null;
    await fetch(`/api/${endpoint}/${entityId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    showToast("Liaison retirée");
    load();
  }

  const totalOrphans = orphanContacts.length + orphanApplications.length;
  const modalCompanyContacts = selectedCompanyId ? contacts.filter(c => c.companyId === selectedCompanyId) : contacts;

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
            {companies.length} entreprise{companies.length !== 1 ? "s" : ""} · {contacts.length} contact{contacts.length !== 1 ? "s" : ""} · {applications.length} candidature{applications.length !== 1 ? "s" : ""}
            {totalOrphans > 0 && <span style={{ color: "var(--warn)" }}> · {totalOrphans} à relier</span>}
          </p>
        </div>
      </div>

      <div className="toolbar">
        <div className="search" style={{ flex: 1 }}>
          <input placeholder="Rechercher dans tout…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* ── Orphans (contacts/applications not linked to any company) ── */}
      {(orphanContacts.length > 0 || orphanApplications.length > 0) && (
        <div className="card" style={{ marginBottom: 20, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", background: "var(--warn-soft)", borderBottom: "1px solid var(--border)" }}>
            <div className="row gap-2">
              <Unlink size={14} color="var(--warn)" />
              <span style={{ fontWeight: 700, fontSize: 13, color: "var(--warn)" }}>
                Éléments sans entreprise ({totalOrphans}) — relie-les à un cluster ci-dessous
              </span>
            </div>
          </div>
          <div style={{ padding: "12px 16px" }}>
            {orphanContacts.length > 0 && (
              <div style={{ marginBottom: orphanApplications.length > 0 ? 12 : 0 }}>
                <div className="muted tiny" style={{ marginBottom: 6, fontWeight: 700 }}>CONTACTS</div>
                <div className="col gap-1">
                  {orphanContacts.map(c => (
                    <div key={c.id} className="row gap-2 between" style={{ padding: "6px 10px", borderRadius: "var(--r-sm)", background: "var(--surface-2)" }}>
                      <div className="row gap-2">
                        <TempDot temp={c.temperature} />
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{c.firstName} {c.lastName}</span>
                        {c.role && <span className="muted tiny">· {c.role}</span>}
                      </div>
                      <button className="btn btn--sm btn--primary" onClick={() => { setLinkModal({ type: "contact", entityId: c.id }); setSelectedCompanyId(""); setSelectedContactId(""); }}>
                        <Link2 size={12} /> Relier
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {orphanApplications.length > 0 && (
              <div>
                <div className="muted tiny" style={{ marginBottom: 6, fontWeight: 700 }}>CANDIDATURES</div>
                <div className="col gap-1">
                  {orphanApplications.map(a => (
                    <div key={a.id} className="row gap-2 between" style={{ padding: "6px 10px", borderRadius: "var(--r-sm)", background: "var(--surface-2)" }}>
                      <div className="row gap-2">
                        <KanbanSquare size={13} color="var(--success)" />
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{a.jobTitle}</span>
                        <Badge tone={statusColor(a.status) as "info" | "success" | "warn" | "danger" | "neutral" | "plum"}>{statusLabel(a.status)}</Badge>
                      </div>
                      <button className="btn btn--sm btn--primary" onClick={() => { setLinkModal({ type: "application", entityId: a.id }); setSelectedCompanyId(""); setSelectedContactId(""); }}>
                        <Link2 size={12} /> Relier
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Company clusters ── */}
      <div className="col gap-3">
        {clusters.map(({ company, contacts: cc, applications: ca, meetings: cm }) => {
          const isExpanded = expandedCompanies.has(company.id);
          return (
            <div key={company.id} className="card" style={{ overflow: "hidden" }}>
              {/* Header */}
              <button onClick={() => toggleExpand(company.id)} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12,
                padding: "14px 16px", border: "none", background: "none",
                cursor: "pointer", color: "var(--ink)", textAlign: "left",
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: "var(--r-md)", flexShrink: 0,
                  background: "linear-gradient(135deg, var(--primary), var(--primary-hover))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "white", fontWeight: 700, fontSize: 15,
                }}>
                  {company.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{company.name}</div>
                  <div className="muted tiny">
                    {cc.length} contact{cc.length !== 1 ? "s" : ""} · {ca.length} candidature{ca.length !== 1 ? "s" : ""}
                    {company.location ? ` · ${company.location}` : ""}
                  </div>
                </div>
                <Badge tone={statusColor(company.status) as "info" | "success" | "warn" | "danger" | "neutral" | "plum"}>
                  {statusLabel(company.status)}
                </Badge>
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {isExpanded && (
                <div style={{ padding: "0 16px 16px", borderTop: "1px solid var(--border)" }}>

                  {/* ── Contacts ── */}
                  <div style={{ marginTop: 14 }}>
                    <div className="row gap-2 between" style={{ marginBottom: 8 }}>
                      <div className="row gap-2">
                        <Users size={13} strokeWidth={1.75} />
                        <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--muted)" }}>
                          Contacts ({cc.length})
                        </span>
                      </div>
                      <button className="btn btn--ghost btn--icon" title="Ajouter un contact" onClick={() => setShowAddContact(showAddContact === company.id ? null : company.id)}>
                        <Plus size={14} />
                      </button>
                    </div>

                    {cc.length === 0 && showAddContact !== company.id && (
                      <div className="muted" style={{ fontSize: 12, fontStyle: "italic", marginBottom: 6 }}>
                        Aucun contact — clique sur + pour en ajouter un
                      </div>
                    )}

                    <div className="col gap-1">
                      {cc.map(c => {
                        const handledApps = ca.filter(a => a.contactId === c.id);
                        return (
                          <div key={c.id} style={{ padding: "8px 10px", borderRadius: "var(--r-sm)", background: "var(--surface-2)" }}>
                            <div className="row gap-2 between">
                              <div className="row gap-2">
                                <TempDot temp={c.temperature} />
                                <span style={{ fontSize: 12.5, fontWeight: 600 }}>{c.firstName} {c.lastName}</span>
                                {c.role && <span className="muted tiny">· {c.role}</span>}
                              </div>
                              <button className="btn btn--ghost btn--icon" title="Délier" onClick={() => unlinkEntity("contact", c.id)}>
                                <Unlink size={11} />
                              </button>
                            </div>
                            {handledApps.length > 0 && (
                              <div style={{ marginTop: 4, paddingLeft: 14, display: "flex", gap: 4, flexWrap: "wrap" }}>
                                {handledApps.map(a => (
                                  <span key={a.id} style={{ fontSize: 10, fontWeight: 600, padding: "2px 7px", background: "var(--primary-soft)", color: "var(--primary-ink)", borderRadius: "var(--r-full)" }}>
                                    {a.jobTitle}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {showAddContact === company.id && (
                      <QuickAddContact
                        companyId={company.id}
                        onDone={c => { setShowAddContact(null); setData(prev => ({ ...prev, contacts: [c, ...prev.contacts] })); }}
                      />
                    )}
                  </div>

                  {/* ── Candidatures ── */}
                  <div style={{ marginTop: 16 }}>
                    <div className="row gap-2 between" style={{ marginBottom: 8 }}>
                      <div className="row gap-2">
                        <KanbanSquare size={13} strokeWidth={1.75} />
                        <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--muted)" }}>
                          Candidatures ({ca.length})
                        </span>
                      </div>
                      <button className="btn btn--ghost btn--icon" title="Ajouter une candidature" onClick={() => setShowAddApp(showAddApp === company.id ? null : company.id)}>
                        <Plus size={14} />
                      </button>
                    </div>

                    {ca.length === 0 && showAddApp !== company.id && (
                      <div className="muted" style={{ fontSize: 12, fontStyle: "italic", marginBottom: 6 }}>
                        Aucune candidature — clique sur + pour en ajouter une
                      </div>
                    )}

                    <div className="col gap-2">
                      {ca.map(a => {
                        const linkedContact = a.contactId ? contacts.find(c => c.id === a.contactId) : null;
                        return (
                          <div key={a.id} style={{ padding: "10px 12px", borderRadius: "var(--r-md)", background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                            <div className="row gap-2 between" style={{ marginBottom: 8 }}>
                              <div className="row gap-2">
                                <span style={{ fontSize: 13, fontWeight: 600 }}>{a.jobTitle}</span>
                                <Badge tone={statusColor(a.status) as "info" | "success" | "warn" | "danger" | "neutral" | "plum"}>{statusLabel(a.status)}</Badge>
                              </div>
                              <button className="btn btn--ghost btn--icon" title="Délier" onClick={() => unlinkEntity("application", a.id)}>
                                <Unlink size={11} />
                              </button>
                            </div>
                            {/* Contact assignment inline */}
                            <div className="row gap-2" style={{ alignItems: "center" }}>
                              <UserCheck size={12} color={linkedContact ? "var(--success)" : "var(--muted)"} />
                              <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }}>Contact</span>
                              {cc.length > 0 ? (
                                <select
                                  className="input"
                                  style={{ fontSize: 12, padding: "3px 8px", height: "auto", flex: 1, maxWidth: 240 }}
                                  value={a.contactId ?? ""}
                                  onChange={e => assignContact(a.id, e.target.value || null)}
                                >
                                  <option value="">— Aucun —</option>
                                  {cc.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}{c.role ? ` (${c.role})` : ""}</option>)}
                                </select>
                              ) : (
                                <span style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>
                                  Ajoute d&apos;abord un contact à cette entreprise
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {showAddApp === company.id && (
                      <QuickAddApplication
                        companyId={company.id}
                        onDone={a => { setShowAddApp(null); setData(prev => ({ ...prev, applications: [a, ...prev.applications] })); }}
                      />
                    )}
                  </div>

                  {/* Réunions */}
                  {cm.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <div className="row gap-2" style={{ marginBottom: 8 }}>
                        <CalendarCheck size={13} strokeWidth={1.75} />
                        <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--muted)" }}>Réunions ({cm.length})</span>
                      </div>
                      <div className="col gap-1">
                        {cm.map(m => (
                          <div key={m.id} className="row gap-2 between" style={{ padding: "6px 10px", borderRadius: "var(--r-sm)", background: "var(--surface-2)" }}>
                            <div>
                              <span style={{ fontSize: 12.5, fontWeight: 500 }}>{m.title}</span>
                              <span className="muted tiny" style={{ marginLeft: 6 }}>· {formatDate(m.date)}</span>
                            </div>
                            <button className="btn btn--ghost btn--icon" onClick={() => unlinkEntity("meeting", m.id)}><Unlink size={11} /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* ── Add new company ── */}
        <div className="card" style={{ padding: "14px 16px", borderStyle: "dashed", borderColor: "var(--border-strong)", background: "transparent" }}>
          <button
            className="row gap-2"
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--primary)", fontWeight: 600, fontSize: 13, padding: 0 }}
            onClick={() => setShowAddCompany(p => !p)}
          >
            {showAddCompany ? <X size={14} /> : <Plus size={14} />}
            {showAddCompany ? "Annuler" : "Ajouter une entreprise"}
          </button>
          {showAddCompany && (
            <QuickAddCompany
              onDone={c => {
                setShowAddCompany(false);
                setData(prev => ({ ...prev, companies: [...prev.companies, c] }));
                setExpandedCompanies(prev => new Set(prev).add(c.id));
              }}
            />
          )}
        </div>
      </div>

      {/* Empty state — only when absolutely nothing */}
      {companies.length === 0 && !showAddCompany && (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)" }}>
          <Network size={36} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, color: "var(--ink)" }}>Aucune entreprise encore</div>
          <div style={{ fontSize: 13, marginBottom: 16 }}>Commence par créer ta première entreprise ci-dessous, puis ajoute-y des contacts et des candidatures.</div>
          <button className="btn btn--primary" onClick={() => setShowAddCompany(true)}>
            <Plus size={14} /> Ajouter la première entreprise
          </button>
        </div>
      )}

      {/* ── Link modal ── */}
      <Modal
        open={!!linkModal}
        onClose={() => { setLinkModal(null); setSelectedCompanyId(""); setSelectedContactId(""); }}
        title={linkModal?.type === "application" ? "Relier cette candidature" : "Relier à une entreprise"}
        size="sm"
      >
        <div className="col gap-3">
          <div className="field">
            <label className="label">Entreprise *</label>
            <select className="input" value={selectedCompanyId} onChange={e => { setSelectedCompanyId(e.target.value); setSelectedContactId(""); }}>
              <option value="">— Sélectionner —</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {linkModal?.type === "application" && (
            <div className="field">
              <label className="label">Contact responsable (optionnel)</label>
              <select className="input" value={selectedContactId} onChange={e => setSelectedContactId(e.target.value)}>
                <option value="">— Aucun —</option>
                {modalCompanyContacts.map(c => (
                  <option key={c.id} value={c.id}>{c.firstName} {c.lastName}{c.role ? ` · ${c.role}` : ""}</option>
                ))}
              </select>
              {selectedCompanyId && modalCompanyContacts.length === 0 && (
                <span className="muted tiny">Aucun contact dans cette entreprise — ajoutes-en depuis son cluster</span>
              )}
            </div>
          )}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button className="btn" onClick={() => { setLinkModal(null); setSelectedCompanyId(""); setSelectedContactId(""); }}>Annuler</button>
            <button className="btn btn--primary" disabled={!selectedCompanyId} onClick={applyLink}>
              <Link2 size={13} /> Relier
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
