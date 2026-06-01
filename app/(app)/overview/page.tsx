"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Network, Building2, Users, KanbanSquare, CalendarCheck,
  Link2, Unlink, ChevronDown, ChevronUp, UserCheck,
} from "lucide-react";
import { Badge, TempDot } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { ListSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/lib/store";
import { formatDate, statusLabel, statusColor } from "@/lib/utils";
import type { Company, Contact, Application, Meeting } from "@/lib/types";

interface OverviewData {
  companies: Company[];
  contacts: Contact[];
  applications: Application[];
  meetings: Meeting[];
}

interface CompanyCluster {
  company: Company;
  contacts: Contact[];
  applications: Application[];
  meetings: Meeting[];
}

// ─── Link modal state ─────────────────────────────────────────────────────────

type LinkType = "contact" | "application" | "meeting";

interface LinkModal {
  type: LinkType;
  entityId: string;
  currentCompanyId?: string | null; // for in-cluster re-linking
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showOrphans, setShowOrphans] = useState(true);
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set());
  const [linkModal, setLinkModal] = useState<LinkModal | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [selectedContactId, setSelectedContactId] = useState("");
  const { showToast } = useToast();

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/overview").then(r => r.json());
      setData(r.data ?? { companies: [], contacts: [], applications: [], meetings: [] });
      if (r.data?.companies?.length) {
        setExpandedCompanies(new Set(r.data.companies.slice(0, 3).map((c: Company) => c.id)));
      }
    } catch {
      setData({ companies: [], contacts: [], applications: [], meetings: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="main__inner">
        <div className="page-head"><div><h1 className="page-head__title">Vue d&apos;ensemble</h1><p className="page-head__sub">Chargement…</p></div></div>
        <ListSkeleton rows={6} />
      </div>
    );
  }

  if (!data) return null;

  const { companies, contacts, applications, meetings } = data;

  // Build clusters
  const clusters: CompanyCluster[] = companies
    .map(company => ({
      company,
      contacts: contacts.filter(c => c.companyId === company.id),
      applications: applications.filter(a => a.companyId === company.id),
      meetings: meetings.filter(m => m.companyId === company.id),
    }))
    .filter(cluster => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        cluster.company.name.toLowerCase().includes(s) ||
        cluster.contacts.some(c => `${c.firstName} ${c.lastName}`.toLowerCase().includes(s)) ||
        cluster.applications.some(a => a.jobTitle.toLowerCase().includes(s))
      );
    });

  const orphanContacts     = contacts.filter(c => !c.companyId);
  const orphanApplications = applications.filter(a => !a.companyId);
  const orphanMeetings     = meetings.filter(m => !m.companyId);

  const filteredOrphanContacts     = orphanContacts.filter(c => !search || `${c.firstName} ${c.lastName} ${c.role ?? ""}`.toLowerCase().includes(search.toLowerCase()));
  const filteredOrphanApplications = orphanApplications.filter(a => !search || a.jobTitle.toLowerCase().includes(search.toLowerCase()));
  const filteredOrphanMeetings     = orphanMeetings.filter(m => !search || m.title.toLowerCase().includes(search.toLowerCase()));

  function toggleExpand(id: string) {
    setExpandedCompanies(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function openLinkModal(type: LinkType, entityId: string, currentCompanyId?: string | null) {
    setLinkModal({ type, entityId, currentCompanyId });
    setSelectedCompanyId(currentCompanyId ?? "");
    setSelectedContactId("");
  }

  async function applyLink() {
    if (!linkModal) return;
    const { type, entityId } = linkModal;
    const endpoint = type === "contact" ? "contacts" : type === "application" ? "applications" : "meetings";
    const body: Record<string, string | null> = {};

    if (selectedCompanyId) body.companyId = selectedCompanyId;

    // For applications, also link contact if selected
    if (type === "application" && selectedContactId) body.contactId = selectedContactId;

    await fetch(`/api/${endpoint}/${entityId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    showToast("Liaison créée ✓");
    setLinkModal(null);
    setSelectedCompanyId("");
    setSelectedContactId("");
    load();
  }

  async function assignContact(applicationId: string, contactId: string | null) {
    await fetch(`/api/applications/${applicationId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId }),
    });
    showToast(contactId ? "Contact assigné ✓" : "Contact retiré");
    load();
  }

  async function unlinkEntity(type: LinkType, entityId: string) {
    const endpoint = type === "contact" ? "contacts" : type === "application" ? "applications" : "meetings";
    const body: Record<string, null> = { companyId: null };
    if (type === "application") body.contactId = null;
    await fetch(`/api/${endpoint}/${entityId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    showToast("Liaison retirée");
    load();
  }

  const totalLinks = contacts.filter(c => c.companyId).length + applications.filter(a => a.companyId).length + meetings.filter(m => m.companyId).length;
  const totalOrphans = orphanContacts.length + orphanApplications.length + orphanMeetings.length;

  // Contacts available in selected company (for the link modal)
  const modalCompanyContacts = selectedCompanyId
    ? contacts.filter(c => c.companyId === selectedCompanyId)
    : contacts;

  return (
    <div className="main__inner">
      <div className="page-head">
        <div>
          <h1 className="page-head__title">Vue d&apos;ensemble</h1>
          <p className="page-head__sub">
            {companies.length} entreprise{companies.length !== 1 ? "s" : ""} · {totalLinks} liaison{totalLinks !== 1 ? "s" : ""} · {totalOrphans} orphelin{totalOrphans !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="toolbar">
        <div className="search" style={{ flex: 1 }}>
          <input placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* ── Orphans ── */}
      {totalOrphans > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div className="row gap-2 between" style={{ marginBottom: 10 }}>
            <div className="row gap-2">
              <Unlink size={15} color="var(--warn)" />
              <span style={{ fontWeight: 700, fontSize: 14, color: "var(--warn)" }}>
                À relier — {totalOrphans} élément{totalOrphans > 1 ? "s" : ""} sans entreprise
              </span>
            </div>
            <button onClick={() => setShowOrphans(p => !p)} className="btn btn--sm">
              {showOrphans ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {showOrphans ? "Réduire" : "Afficher"}
            </button>
          </div>

          {showOrphans && (
            <div className="col gap-2">
              {filteredOrphanContacts.map(c => (
                <div key={c.id} className="card" style={{ padding: "10px 14px", borderLeft: "3px solid var(--primary)" }}>
                  <div className="row between">
                    <div className="row gap-2">
                      <Users size={14} color="var(--primary)" />
                      <TempDot temp={c.temperature} />
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{c.firstName} {c.lastName}</span>
                      {c.role && <span className="muted tiny">· {c.role}</span>}
                    </div>
                    <button className="btn btn--sm btn--primary" onClick={() => openLinkModal("contact", c.id)}>
                      <Link2 size={12} /> Relier à une entreprise
                    </button>
                  </div>
                </div>
              ))}
              {filteredOrphanApplications.map(a => (
                <div key={a.id} className="card" style={{ padding: "10px 14px", borderLeft: "3px solid var(--success)" }}>
                  <div className="row between">
                    <div className="row gap-2" style={{ flexWrap: "wrap" }}>
                      <KanbanSquare size={14} color="var(--success)" />
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{a.jobTitle}</span>
                      <Badge tone={statusColor(a.status) as "info" | "success" | "warn" | "danger" | "neutral" | "plum"}>
                        {statusLabel(a.status)}
                      </Badge>
                    </div>
                    <button className="btn btn--sm btn--primary" onClick={() => openLinkModal("application", a.id)}>
                      <Link2 size={12} /> Relier (entreprise + contact)
                    </button>
                  </div>
                </div>
              ))}
              {filteredOrphanMeetings.map(m => (
                <div key={m.id} className="card" style={{ padding: "10px 14px", borderLeft: "3px solid var(--plum)" }}>
                  <div className="row between">
                    <div className="row gap-2">
                      <CalendarCheck size={14} color="var(--plum)" />
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{m.title}</span>
                      <span className="muted tiny">· {formatDate(m.date)}</span>
                    </div>
                    <button className="btn btn--sm btn--primary" onClick={() => openLinkModal("meeting", m.id)}>
                      <Link2 size={12} /> Relier à une entreprise
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Clusters ── */}
      {clusters.length === 0 && !totalOrphans ? (
        <div>
          <div className="card card__pad-lg" style={{ textAlign: "center", maxWidth: 560, margin: "0 auto" }}>
            <Network size={32} color="var(--primary)" style={{ margin: "0 auto 12px" }} />
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Prêt à construire ton réseau ?</div>
            <div className="muted" style={{ fontSize: 13, marginBottom: 20 }}>
              Commence par créer tes secteurs, entreprises, contacts et candidatures. Ils apparaîtront ici liés ensemble.
            </div>
            <div className="row gap-2" style={{ justifyContent: "center", flexWrap: "wrap" }}>
              <a href="/sectors" className="btn btn--primary" style={{ textDecoration: "none" }}><Building2 size={13} /> Secteurs</a>
              <a href="/companies" className="btn btn--primary" style={{ textDecoration: "none" }}><Building2 size={13} /> Entreprises</a>
              <a href="/contacts" className="btn btn--primary" style={{ textDecoration: "none" }}><Users size={13} /> Contacts</a>
              <a href="/applications" className="btn btn--primary" style={{ textDecoration: "none" }}><KanbanSquare size={13} /> Candidatures</a>
            </div>
          </div>
        </div>
      ) : (
        <div className="col gap-3">
          {clusters.map(({ company, contacts: cc, applications: ca, meetings: cm }) => {
            const isExpanded = expandedCompanies.has(company.id);
            const itemCount = cc.length + ca.length + cm.length;

            return (
              <div key={company.id} className="card" style={{ overflow: "hidden" }}>
                {/* Company header */}
                <button
                  onClick={() => toggleExpand(company.id)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 12,
                    padding: "14px 16px", border: "none", background: "none",
                    cursor: "pointer", color: "var(--ink)", textAlign: "left",
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: "var(--r-md)",
                    background: "linear-gradient(135deg, var(--primary), var(--primary-hover))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "white", fontWeight: 700, fontSize: 14, flexShrink: 0,
                  }}>
                    {company.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{company.name}</div>
                    <div className="muted tiny">
                      {company.location ?? ""}
                      {company.location && itemCount > 0 ? " · " : ""}
                      {itemCount > 0
                        ? `${cc.length} contact${cc.length !== 1 ? "s" : ""} · ${ca.length} candidature${ca.length !== 1 ? "s" : ""}`
                        : "Aucun élément lié"}
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
                    {cc.length > 0 && (
                      <div style={{ marginTop: 12 }}>
                        <div className="row gap-2" style={{ marginBottom: 8 }}>
                          <Users size={13} strokeWidth={1.75} />
                          <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--muted)" }}>
                            Contacts ({cc.length})
                          </span>
                        </div>
                        <div className="col gap-1">
                          {cc.map(c => {
                            const handledApps = ca.filter(a => a.contactId === c.id);
                            return (
                              <div key={c.id} style={{ padding: "8px 10px", borderRadius: "var(--r-sm)", background: "var(--surface-2)" }}>
                                <div className="row gap-2 between">
                                  <div className="row gap-2">
                                    <TempDot temp={c.temperature} />
                                    <span style={{ fontSize: 12.5, fontWeight: 500 }}>{c.firstName} {c.lastName}</span>
                                    {c.role && <span className="muted tiny">· {c.role}</span>}
                                  </div>
                                  <button className="btn btn--ghost btn--icon" title="Délier" onClick={() => unlinkEntity("contact", c.id)}>
                                    <Unlink size={12} />
                                  </button>
                                </div>
                                {handledApps.length > 0 && (
                                  <div style={{ marginTop: 6, paddingLeft: 16, display: "flex", gap: 6, flexWrap: "wrap" }}>
                                    {handledApps.map(a => (
                                      <span key={a.id} style={{
                                        fontSize: 10, fontWeight: 600, padding: "2px 8px",
                                        background: "var(--primary-soft)", color: "var(--primary-ink)",
                                        borderRadius: "var(--r-full)",
                                      }}>
                                        {a.jobTitle}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* ── Candidatures ── */}
                    {ca.length > 0 && (
                      <div style={{ marginTop: 12 }}>
                        <div className="row gap-2" style={{ marginBottom: 8 }}>
                          <KanbanSquare size={13} strokeWidth={1.75} />
                          <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--muted)" }}>
                            Candidatures ({ca.length})
                          </span>
                        </div>
                        <div className="col gap-2">
                          {ca.map(a => {
                            const linkedContact = a.contactId ? contacts.find(c => c.id === a.contactId) : null;
                            return (
                              <div key={a.id} style={{
                                padding: "10px 12px", borderRadius: "var(--r-md)",
                                background: "var(--surface-2)",
                                border: "1px solid var(--border)",
                              }}>
                                {/* Title + status + unlink */}
                                <div className="row gap-2 between" style={{ marginBottom: 8 }}>
                                  <div className="row gap-2">
                                    <span style={{ fontSize: 13, fontWeight: 600 }}>{a.jobTitle}</span>
                                    <Badge tone={statusColor(a.status) as "info" | "success" | "warn" | "danger" | "neutral" | "plum"}>
                                      {statusLabel(a.status)}
                                    </Badge>
                                  </div>
                                  <button className="btn btn--ghost btn--icon" title="Délier de l'entreprise" onClick={() => unlinkEntity("application", a.id)}>
                                    <Unlink size={12} />
                                  </button>
                                </div>

                                {/* Contact assignment */}
                                <div className="row gap-2" style={{ alignItems: "center" }}>
                                  <UserCheck size={13} color={linkedContact ? "var(--success)" : "var(--muted)"} />
                                  <span style={{ fontSize: 12, color: "var(--muted)" }}>Contact responsable :</span>
                                  {cc.length > 0 ? (
                                    <select
                                      className="input"
                                      style={{ fontSize: 12, padding: "3px 8px", height: "auto", flex: 1, maxWidth: 220 }}
                                      value={a.contactId ?? ""}
                                      onChange={e => assignContact(a.id, e.target.value || null)}
                                    >
                                      <option value="">— Aucun —</option>
                                      {cc.map(c => (
                                        <option key={c.id} value={c.id}>{c.firstName} {c.lastName}{c.role ? ` (${c.role})` : ""}</option>
                                      ))}
                                    </select>
                                  ) : linkedContact ? (
                                    <span style={{ fontSize: 12, fontWeight: 600 }}>{linkedContact.firstName} {linkedContact.lastName}</span>
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
                      </div>
                    )}

                    {/* ── Réunions ── */}
                    {cm.length > 0 && (
                      <div style={{ marginTop: 12 }}>
                        <div className="row gap-2" style={{ marginBottom: 8 }}>
                          <CalendarCheck size={13} strokeWidth={1.75} />
                          <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--muted)" }}>
                            Réunions ({cm.length})
                          </span>
                        </div>
                        <div className="col gap-1">
                          {cm.map(m => (
                            <div key={m.id} className="row gap-2 between" style={{ padding: "6px 8px", borderRadius: "var(--r-sm)", background: "var(--surface-2)" }}>
                              <div>
                                <span style={{ fontSize: 12.5, fontWeight: 500 }}>{m.title}</span>
                                <span className="muted tiny" style={{ marginLeft: 6 }}>· {formatDate(m.date)}</span>
                              </div>
                              <button className="btn btn--ghost btn--icon" title="Délier" onClick={() => unlinkEntity("meeting", m.id)}>
                                <Unlink size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {itemCount === 0 && (
                      <div className="muted" style={{ fontSize: 12, textAlign: "center", padding: "16px 0" }}>
                        Aucun élément lié à cette entreprise.{" "}
                        <span style={{ color: "var(--primary)" }}>
                          Relie des contacts et candidatures depuis la section &quot;À relier&quot; ci-dessus.
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Link Modal ── */}
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
              <select
                className="input"
                value={selectedContactId}
                onChange={e => setSelectedContactId(e.target.value)}
                disabled={!selectedCompanyId && modalCompanyContacts.length === 0}
              >
                <option value="">— Aucun —</option>
                {modalCompanyContacts.map(c => (
                  <option key={c.id} value={c.id}>{c.firstName} {c.lastName}{c.role ? ` · ${c.role}` : ""}</option>
                ))}
                {selectedCompanyId && modalCompanyContacts.length === 0 && (
                  <option disabled value="">Aucun contact dans cette entreprise</option>
                )}
              </select>
              <span className="muted tiny" style={{ marginTop: 4 }}>
                {selectedCompanyId ? `${modalCompanyContacts.length} contact(s) dans cette entreprise` : "Sélectionne d'abord une entreprise pour filtrer les contacts"}
              </span>
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
