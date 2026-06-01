"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Network, Search, Building2, Users, KanbanSquare, CalendarCheck,
  Link2, Unlink, ChevronDown, ChevronUp, Plus, ExternalLink,
} from "lucide-react";
import { Badge, TempDot } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { ListSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
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

type LinkType = "contact" | "application" | "meeting";

export default function OverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showOrphans, setShowOrphans] = useState(true);
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set());
  const [linkModal, setLinkModal] = useState<{ type: LinkType; entityId: string } | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
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
        <div className="page-head">
          <div>
            <h1 className="page-head__title">Vue d&apos;ensemble</h1>
            <p className="page-head__sub">Chargement…</p>
          </div>
        </div>
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

  // Orphans
  const orphanContacts = contacts.filter(c => !c.companyId);
  const orphanApplications = applications.filter(a => !a.companyId);
  const orphanMeetings = meetings.filter(m => !m.companyId);

  // Filter orphans by search
  const filteredOrphanContacts = orphanContacts.filter(c =>
    !search || `${c.firstName} ${c.lastName} ${c.role ?? ""}`.toLowerCase().includes(search.toLowerCase())
  );
  const filteredOrphanApplications = orphanApplications.filter(a =>
    !search || a.jobTitle.toLowerCase().includes(search.toLowerCase())
  );
  const filteredOrphanMeetings = orphanMeetings.filter(m =>
    !search || m.title.toLowerCase().includes(search.toLowerCase())
  );

  function toggleExpand(id: string) {
    setExpandedCompanies(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function linkToCompany() {
    if (!linkModal || !selectedCompanyId) return;
    const { type, entityId } = linkModal;
    const endpoint = type === "contact" ? "contacts" : type === "application" ? "applications" : "meetings";
    await fetch(`/api/${endpoint}/${entityId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId: selectedCompanyId }),
    });
    showToast("Liaison créée ✓");
    setLinkModal(null);
    setSelectedCompanyId("");
    load();
  }

  async function unlinkFromCompany(type: LinkType, entityId: string) {
    const endpoint = type === "contact" ? "contacts" : type === "application" ? "applications" : "meetings";
    await fetch(`/api/${endpoint}/${entityId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId: null }),
    });
    showToast("Liaison supprimée");
    load();
  }

  // Stats
  const totalLinks = contacts.filter(c => c.companyId).length +
    applications.filter(a => a.companyId).length +
    meetings.filter(m => m.companyId).length;
  const totalOrphans = orphanContacts.length + orphanApplications.length + orphanMeetings.length;

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
          <input placeholder="Rechercher dans tout (entreprises, contacts, candidatures)…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Clusters */}
      {clusters.length === 0 && !totalOrphans ? (
        <EmptyState
          icon={Network}
          title="Aucune donnée à interconnecter"
          description="Ajoute des entreprises, contacts et candidatures pour voir leurs connexions ici."
          tone="primary"
        />
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
                      {itemCount > 0 ? `${itemCount} élément${itemCount > 1 ? "s" : ""} lié${itemCount > 1 ? "s" : ""}` : "Aucun élément lié"}
                    </div>
                  </div>
                  <Badge tone={statusColor(company.status) as "info" | "success" | "warn" | "danger" | "neutral" | "plum"}>
                    {statusLabel(company.status)}
                  </Badge>
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {isExpanded && (
                  <div style={{ padding: "0 16px 16px", borderTop: "1px solid var(--border)" }}>
                    {/* Contacts */}
                    {cc.length > 0 && (
                      <div style={{ marginTop: 12 }}>
                        <div className="row gap-2" style={{ marginBottom: 8 }}>
                          <Users size={13} strokeWidth={1.75} />
                          <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--muted)" }}>
                            Contacts ({cc.length})
                          </span>
                        </div>
                        <div className="col gap-1">
                          {cc.map(c => (
                            <div key={c.id} className="row gap-2 between" style={{ padding: "6px 8px", borderRadius: "var(--r-sm)", background: "var(--surface-2)" }}>
                              <div className="row gap-2">
                                <TempDot temp={c.temperature} />
                                <span style={{ fontSize: 12.5, fontWeight: 500 }}>{c.firstName} {c.lastName}</span>
                                {c.role && <span className="muted tiny">· {c.role}</span>}
                              </div>
                              <button className="btn btn--ghost btn--icon" title="Délier" onClick={() => unlinkFromCompany("contact", c.id)}>
                                <Unlink size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Applications */}
                    {ca.length > 0 && (
                      <div style={{ marginTop: 12 }}>
                        <div className="row gap-2" style={{ marginBottom: 8 }}>
                          <KanbanSquare size={13} strokeWidth={1.75} />
                          <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--muted)" }}>
                            Candidatures ({ca.length})
                          </span>
                        </div>
                        <div className="col gap-1">
                          {ca.map(a => (
                            <div key={a.id} className="row gap-2 between" style={{ padding: "6px 8px", borderRadius: "var(--r-sm)", background: "var(--surface-2)" }}>
                              <div>
                                <span style={{ fontSize: 12.5, fontWeight: 500 }}>{a.jobTitle}</span>
                                <span className="muted tiny" style={{ marginLeft: 6 }}>
                                  · {statusLabel(a.status)}
                                </span>
                              </div>
                              <button className="btn btn--ghost btn--icon" title="Délier" onClick={() => unlinkFromCompany("application", a.id)}>
                                <Unlink size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Meetings */}
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
                              <button className="btn btn--ghost btn--icon" title="Délier" onClick={() => unlinkFromCompany("meeting", m.id)}>
                                <Unlink size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {itemCount === 0 && (
                      <div className="muted" style={{ fontSize: 12, textAlign: "center", padding: "12px 0" }}>
                        Aucun contact, candidature ou réunion lié à cette entreprise.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Orphans section */}
          {totalOrphans > 0 && (
            <div style={{ marginTop: 16 }}>
              <button
                onClick={() => setShowOrphans(p => !p)}
                className="row gap-2"
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--warn)", fontWeight: 700, fontSize: 14, padding: "8px 0",
                }}
              >
                <Unlink size={15} />
                Éléments non reliés ({totalOrphans})
                {showOrphans ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showOrphans && (
                <div className="col gap-2" style={{ marginTop: 4 }}>
                  {/* Orphan contacts */}
                  {filteredOrphanContacts.map(c => (
                    <div key={c.id} className="card" style={{ padding: "10px 14px" }}>
                      <div className="row between">
                        <div className="row gap-2">
                          <Users size={14} color="var(--primary)" />
                          <TempDot temp={c.temperature} />
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{c.firstName} {c.lastName}</span>
                          {c.role && <span className="muted tiny">· {c.role}</span>}
                        </div>
                        <button className="btn btn--sm" onClick={() => { setLinkModal({ type: "contact", entityId: c.id }); setSelectedCompanyId(""); }}>
                          <Link2 size={12} /> Relier
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Orphan applications */}
                  {filteredOrphanApplications.map(a => (
                    <div key={a.id} className="card" style={{ padding: "10px 14px" }}>
                      <div className="row between">
                        <div className="row gap-2">
                          <KanbanSquare size={14} color="var(--success)" />
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{a.jobTitle}</span>
                          <Badge tone={statusColor(a.status) as "info" | "success" | "warn" | "danger" | "neutral" | "plum"}>
                            {statusLabel(a.status)}
                          </Badge>
                        </div>
                        <button className="btn btn--sm" onClick={() => { setLinkModal({ type: "application", entityId: a.id }); setSelectedCompanyId(""); }}>
                          <Link2 size={12} /> Relier
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Orphan meetings */}
                  {filteredOrphanMeetings.map(m => (
                    <div key={m.id} className="card" style={{ padding: "10px 14px" }}>
                      <div className="row between">
                        <div className="row gap-2">
                          <CalendarCheck size={14} color="var(--plum)" />
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{m.title}</span>
                          <span className="muted tiny">· {formatDate(m.date)}</span>
                        </div>
                        <button className="btn btn--sm" onClick={() => { setLinkModal({ type: "meeting", entityId: m.id }); setSelectedCompanyId(""); }}>
                          <Link2 size={12} /> Relier
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Link modal */}
      <Modal
        open={!!linkModal}
        onClose={() => setLinkModal(null)}
        title={`Relier à une entreprise`}
        size="sm"
      >
        <div className="field" style={{ marginBottom: 16 }}>
          <label className="label">Choisir l&apos;entreprise</label>
          <select className="input" value={selectedCompanyId} onChange={e => setSelectedCompanyId(e.target.value)}>
            <option value="">— Sélectionner —</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="btn" onClick={() => setLinkModal(null)}>Annuler</button>
          <button className="btn btn--primary" disabled={!selectedCompanyId} onClick={linkToCompany}>
            <Link2 size={13} /> Relier
          </button>
        </div>
      </Modal>
    </div>
  );
}
