import { eq, and, not, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  applications,
  contacts,
  companies,
  followups,
  cvs,
  sectors,
} from "@/lib/db/schema";
import type { Insight } from "@/lib/types";

// ─── Data loader ─────────────────────────────────────────────────────────────

interface UserData {
  userId: string;
  applications: Awaited<ReturnType<typeof loadApplications>>;
  contacts: Awaited<ReturnType<typeof loadContacts>>;
  companies: Awaited<ReturnType<typeof loadCompanies>>;
  followups: Awaited<ReturnType<typeof loadFollowups>>;
  cvs: Awaited<ReturnType<typeof loadCVs>>;
  sectors: Awaited<ReturnType<typeof loadSectors>>;
}

async function loadApplications(userId: string) {
  return db.select().from(applications).where(eq(applications.userId, userId));
}
async function loadContacts(userId: string) {
  return db.select().from(contacts).where(eq(contacts.userId, userId));
}
async function loadCompanies(userId: string) {
  return db.select().from(companies).where(eq(companies.userId, userId));
}
async function loadFollowups(userId: string) {
  return db.select().from(followups).where(eq(followups.userId, userId));
}
async function loadCVs(userId: string) {
  return db.select().from(cvs).where(eq(cvs.userId, userId));
}
async function loadSectors(userId: string) {
  return db.select().from(sectors).where(eq(sectors.userId, userId));
}

export async function loadUserData(userId: string): Promise<UserData> {
  const [apps, cts, comps, fups, cvList, sects] = await Promise.all([
    loadApplications(userId),
    loadContacts(userId),
    loadCompanies(userId),
    loadFollowups(userId),
    loadCVs(userId),
    loadSectors(userId),
  ]);
  return {
    userId,
    applications: apps,
    contacts: cts,
    companies: comps,
    followups: fups,
    cvs: cvList,
    sectors: sects,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysSince(dateStr: string | null | undefined): number {
  if (!dateStr) return Infinity;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return Infinity;
  return Math.floor((Date.now() - d.getTime()) / 86_400_000);
}

function daysSinceTimestamp(ts: Date | null | undefined): number {
  if (!ts) return Infinity;
  return Math.floor((Date.now() - ts.getTime()) / 86_400_000);
}

function isPastDate(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  return d.getTime() < Date.now();
}

const ACTIVE_APP_STATUSES = ["to_prepare", "cv_sent", "followup_planned", "in_discussion", "interview", "waiting"];
const POSITIVE_APP_STATUSES = ["in_discussion", "interview", "won"];

// ─── Rules ───────────────────────────────────────────────────────────────────

type Rule = (data: UserData) => Insight[];

/** Rule 1: Candidatures dormantes (pas de mise à jour > 14j, statut actif) */
const dormantApplication: Rule = (data) => {
  const dormant = data.applications.filter(
    (a) => ACTIVE_APP_STATUSES.includes(a.status) && daysSinceTimestamp(a.updatedAt) > 14
  );
  if (dormant.length === 0) return [];
  const names = dormant
    .slice(0, 3)
    .map((a) => a.jobTitle)
    .join(", ");
  const extra = dormant.length > 3 ? ` et ${dormant.length - 3} autre(s)` : "";
  return [{
    id: `dormant_app_${dormant.length}`,
    ruleId: "dormant_application",
    category: "followup",
    severity: "warning",
    icon: "clock",
    title: `${dormant.length} candidature${dormant.length > 1 ? "s" : ""} dormante${dormant.length > 1 ? "s" : ""}`,
    body: `${names}${extra} — aucune activité depuis 14+ jours.`,
    actionLabel: "Voir les candidatures",
    actionUrl: "/applications",
    score: Math.min(90, 50 + dormant.length * 8),
    relatedIds: dormant.map((a) => a.id),
  }];
};

/** Rule 2: Contacts en refroidissement (hot/warm sans échange > 21j) */
const coolingContact: Rule = (data) => {
  const cooling = data.contacts.filter(
    (c) =>
      (c.temperature === "hot" || c.temperature === "warm") &&
      daysSince(c.lastExchangeDate) > 21
  );
  if (cooling.length === 0) return [];
  const names = cooling
    .slice(0, 3)
    .map((c) => `${c.firstName} ${c.lastName}`)
    .join(", ");
  return [{
    id: `cooling_contact_${cooling.length}`,
    ruleId: "cooling_contact",
    category: "followup",
    severity: "warning",
    icon: "thermometer",
    title: `${cooling.length} contact${cooling.length > 1 ? "s" : ""} en refroidissement`,
    body: `${names} — température ${cooling[0].temperature} mais aucun échange depuis 21+ jours.`,
    actionLabel: "Voir les contacts",
    actionUrl: "/contacts",
    score: Math.min(85, 45 + cooling.length * 10),
    relatedIds: cooling.map((c) => c.id),
  }];
};

/** Rule 3: Engagement non tenu (nextAction avec date passée) */
const brokenCommitment: Rule = (data) => {
  const broken = data.applications.filter((a) => {
    if (!a.nextAction) return false;
    if (!ACTIVE_APP_STATUSES.includes(a.status)) return false;
    // Check if nextAction contains a date-like string that's in the past
    const dateMatch = a.nextAction.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.]?(\d{2,4})?/);
    if (dateMatch) {
      return daysSinceTimestamp(a.updatedAt) > 3;
    }
    // If no date found, check if the application hasn't been updated in 7+ days
    return daysSinceTimestamp(a.updatedAt) > 7;
  });
  if (broken.length === 0) return [];
  return [{
    id: `broken_commit_${broken.length}`,
    ruleId: "broken_commitment",
    category: "action",
    severity: "action",
    icon: "alert-triangle",
    title: `${broken.length} action${broken.length > 1 ? "s" : ""} en retard`,
    body: `Des prochaines actions définies n'ont pas été suivies : ${broken.slice(0, 2).map((a) => `"${a.nextAction}" (${a.jobTitle})`).join(", ")}`,
    actionLabel: "Voir les candidatures",
    actionUrl: "/applications",
    score: Math.min(95, 60 + broken.length * 10),
    relatedIds: broken.map((a) => a.id),
  }];
};

/** Rule 4: Risque d'oubli hebdomadaire */
const weeklyForgottenRisk: Rule = (data) => {
  const atRisk = data.companies.filter(
    (c) =>
      c.status !== "rejected" &&
      daysSinceTimestamp(c.updatedAt) > 14
  );
  if (atRisk.length < 2) return [];
  return [{
    id: `weekly_risk_${atRisk.length}`,
    ruleId: "weekly_forgotten_risk",
    category: "followup",
    severity: "info",
    icon: "eye-off",
    title: `${atRisk.length} entreprise${atRisk.length > 1 ? "s" : ""} risquent d'être oubliées`,
    body: `${atRisk.slice(0, 3).map((c) => c.name).join(", ")} — aucune mise à jour depuis 14+ jours.`,
    actionLabel: "Voir les entreprises",
    actionUrl: "/companies",
    score: Math.min(70, 30 + atRisk.length * 5),
    relatedIds: atRisk.map((c) => c.id),
  }];
};

/** Rule 5: Relance nommée avec contexte */
const namedFollowup: Rule = (data) => {
  const today = new Date().toISOString().slice(0, 10);
  const pending = data.followups.filter(
    (f) => f.status === "pending" && f.scheduledDate <= today
  );
  if (pending.length === 0) return [];
  const contactMap = new Map(data.contacts.map((c) => [c.id, c]));
  const companyMap = new Map(data.companies.map((c) => [c.id, c]));
  const insights: Insight[] = [];

  for (const f of pending.slice(0, 3)) {
    const contact = f.contactId ? contactMap.get(f.contactId) : null;
    if (!contact) continue;
    const company = contact.companyId ? companyMap.get(contact.companyId) : null;
    const daysLate = daysSince(f.scheduledDate);
    const lateStr = daysLate > 0 ? ` (${daysLate}j de retard)` : "";
    insights.push({
      id: `followup_${f.id}`,
      ruleId: "named_followup",
      category: "action",
      severity: "action",
      icon: "send",
      title: `Relance ${contact.firstName} ${contact.lastName}${lateStr}`,
      body: company
        ? `${contact.role ?? "Contact"} chez ${company.name}. Dernier échange : ${contact.lastExchangeSummary?.slice(0, 80) ?? "non renseigné"}.`
        : `Dernier échange : ${contact.lastExchangeSummary?.slice(0, 80) ?? "non renseigné"}.`,
      actionLabel: "Voir le contact",
      actionUrl: "/contacts",
      score: 80 + Math.min(15, daysLate * 2),
      relatedIds: [f.id, contact.id],
    });
  }
  return insights;
};

/** Rule 6: Entreprises sans contact */
const companiesWithoutContact: Rule = (data) => {
  const companyIdsWithContacts = new Set(
    data.contacts.filter((c) => c.companyId).map((c) => c.companyId)
  );
  const orphans = data.companies.filter((c) => !companyIdsWithContacts.has(c.id));
  if (orphans.length === 0) return [];
  return [{
    id: `no_contact_${orphans.length}`,
    ruleId: "companies_without_contact",
    category: "quality",
    severity: "info",
    icon: "user-x",
    title: `${orphans.length} entreprise${orphans.length > 1 ? "s" : ""} sans contact identifié`,
    body: `${orphans.slice(0, 3).map((c) => c.name).join(", ")} — ajoute un contact pour améliorer tes chances.`,
    actionLabel: "Voir les entreprises",
    actionUrl: "/companies",
    score: Math.min(55, 25 + orphans.length * 5),
    relatedIds: orphans.map((c) => c.id),
  }];
};

/** Rule 7: Entretiens sans compte-rendu */
const interviewsWithoutFeedback: Rule = (data) => {
  const missing = data.applications.filter(
    (a) => a.status === "interview" && !a.feedbackReceived
  );
  if (missing.length === 0) return [];
  return [{
    id: `no_feedback_${missing.length}`,
    ruleId: "interviews_without_feedback",
    category: "quality",
    severity: "warning",
    icon: "file-text",
    title: `${missing.length} entretien${missing.length > 1 ? "s" : ""} sans compte-rendu`,
    body: `${missing.slice(0, 3).map((a) => a.jobTitle).join(", ")} — documente tes échanges pour ne rien perdre.`,
    actionLabel: "Voir les candidatures",
    actionUrl: "/applications",
    score: Math.min(75, 40 + missing.length * 10),
    relatedIds: missing.map((a) => a.id),
  }];
};

/** Rule 8: Mise à jour de statut en retard */
const staleStatusUpdate: Rule = (data) => {
  const stale = data.applications.filter(
    (a) => ACTIVE_APP_STATUSES.includes(a.status) && daysSinceTimestamp(a.updatedAt) > 7
  );
  // Only show if there are many (> 3) stale ones, otherwise dormantApplication handles it
  if (stale.length < 4) return [];
  return [{
    id: `stale_status_${stale.length}`,
    ruleId: "stale_status_update",
    category: "quality",
    severity: "info",
    icon: "refresh-cw",
    title: `${stale.length} candidatures à mettre à jour`,
    body: `Ces candidatures actives n'ont pas bougé depuis 7+ jours. Vérifie leur statut.`,
    actionLabel: "Voir les candidatures",
    actionUrl: "/applications",
    score: Math.min(50, 20 + stale.length * 3),
    relatedIds: stale.map((a) => a.id),
  }];
};

/** Rule 9: Biais de canal (> 80% via un seul canal) */
const channelBias: Rule = (data) => {
  const sent = data.applications.filter((a) => a.sentVia);
  if (sent.length < 5) return [];
  const counts: Record<string, number> = {};
  for (const a of sent) {
    counts[a.sentVia!] = (counts[a.sentVia!] || 0) + 1;
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const [topChannel, topCount] = sorted[0];
  const pct = Math.round((topCount / sent.length) * 100);
  if (pct < 80) return [];
  const channelLabels: Record<string, string> = {
    email: "Email", linkedin: "LinkedIn", referral: "Référence", direct: "Direct",
  };
  return [{
    id: `channel_bias_${topChannel}`,
    ruleId: "channel_bias",
    category: "behavior",
    severity: "info",
    icon: "git-branch",
    title: `${pct}% de tes candidatures passent par ${channelLabels[topChannel] ?? topChannel}`,
    body: `Diversifier tes canaux peut augmenter ton taux de réponse. Les candidatures par référence convertissent généralement mieux.`,
    actionLabel: "Voir les candidatures",
    actionUrl: "/applications",
    score: 40,
  }];
};

/** Rule 10: Concentration sectorielle (> 70% dans un secteur) */
const sectorConcentration: Rule = (data) => {
  const withSector = data.applications.filter((a) => a.sectorId);
  if (withSector.length < 8) return [];
  const counts: Record<string, number> = {};
  for (const a of withSector) {
    counts[a.sectorId!] = (counts[a.sectorId!] || 0) + 1;
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const [topSectorId, topCount] = sorted[0];
  const pct = Math.round((topCount / withSector.length) * 100);
  if (pct < 70) return [];
  const sectorName = data.sectors.find((s) => s.id === topSectorId)?.name ?? "ce secteur";
  return [{
    id: `sector_conc_${topSectorId}`,
    ruleId: "sector_concentration",
    category: "behavior",
    severity: "info",
    icon: "target",
    title: `${pct}% de tes candidatures ciblent ${sectorName}`,
    body: `Une concentration forte peut être stratégique, mais diversifier réduit le risque si le secteur se contracte.`,
    score: 35,
  }];
};

/** Rule 11: Canal le plus efficace */
const mostEffectiveChannel: Rule = (data) => {
  const resolved = data.applications.filter(
    (a) => a.sentVia && (POSITIVE_APP_STATUSES.includes(a.status) || a.status === "rejected")
  );
  if (resolved.length < 5) return [];
  const stats: Record<string, { positive: number; total: number }> = {};
  for (const a of resolved) {
    if (!stats[a.sentVia!]) stats[a.sentVia!] = { positive: 0, total: 0 };
    stats[a.sentVia!].total++;
    if (POSITIVE_APP_STATUSES.includes(a.status)) stats[a.sentVia!].positive++;
  }
  const sorted = Object.entries(stats)
    .filter(([, s]) => s.total >= 2)
    .map(([ch, s]) => ({ channel: ch, rate: Math.round((s.positive / s.total) * 100), total: s.total }))
    .sort((a, b) => b.rate - a.rate);
  if (sorted.length < 2) return [];
  const best = sorted[0];
  const channelLabels: Record<string, string> = {
    email: "Email", linkedin: "LinkedIn", referral: "Référence", direct: "Direct",
  };
  return [{
    id: `best_channel_${best.channel}`,
    ruleId: "most_effective_channel",
    category: "hidden",
    severity: "info",
    icon: "zap",
    title: `${channelLabels[best.channel] ?? best.channel} est ton canal le plus efficace`,
    body: `Taux de conversion de ${best.rate}% (${best.total} candidatures). ${sorted.length > 1 ? `Contre ${sorted[1].rate}% pour ${channelLabels[sorted[1].channel] ?? sorted[1].channel}.` : ""}`,
    score: 60,
  }];
};

/** Rule 12: Score de complétude global */
const completenessScore: Rule = (data) => {
  let filled = 0;
  let total = 0;

  // Companies: name (always filled), location, website, sectorId, notes
  for (const c of data.companies) {
    total += 4;
    if (c.location) filled++;
    if (c.website) filled++;
    if (c.sectorId) filled++;
    if (c.notes) filled++;
  }
  // Contacts: role, email, linkedinUrl, lastExchangeDate, humanNotes
  for (const c of data.contacts) {
    total += 5;
    if (c.role) filled++;
    if (c.email) filled++;
    if (c.linkedinUrl) filled++;
    if (c.lastExchangeDate) filled++;
    if (c.humanNotes) filled++;
  }
  // Applications: companyId, contactId, sectorId, messageSent, sentDate, feedbackReceived
  for (const a of data.applications) {
    total += 6;
    if (a.companyId) filled++;
    if (a.contactId) filled++;
    if (a.sectorId) filled++;
    if (a.messageSent) filled++;
    if (a.sentDate) filled++;
    if (a.feedbackReceived) filled++;
  }

  if (total === 0) return [];
  const pct = Math.round((filled / total) * 100);
  if (pct >= 90) return []; // Don't bother if data is great

  const severity: "info" | "warning" = pct < 50 ? "warning" : "info";
  return [{
    id: `completeness_${pct}`,
    ruleId: "completeness_score",
    category: "quality",
    severity,
    icon: "bar-chart-2",
    title: `Ta base de données est complète à ${pct}%`,
    body: pct < 50
      ? `Des données manquantes réduisent la qualité des recommandations. Complète tes fiches pour débloquer plus d'insights.`
      : `Bonne base ! Continue à renseigner les champs manquants pour des insights encore plus précis.`,
    score: pct < 50 ? 65 : 30,
  }];
};

/** Rule 13: CV périmé (> 90 jours) */
const outdatedCV: Rule = (data) => {
  const outdated = data.cvs.filter((cv) => daysSince(cv.lastUpdated) > 90);
  if (outdated.length === 0) return [];
  const sectorMap = new Map(data.sectors.map((s) => [s.id, s.name]));
  return [{
    id: `outdated_cv_${outdated.length}`,
    ruleId: "outdated_cv",
    category: "quality",
    severity: "info",
    icon: "file-warning",
    title: `${outdated.length} CV non mis à jour depuis 90+ jours`,
    body: `${outdated.map((cv) => cv.sectorId ? (sectorMap.get(cv.sectorId) ?? `v${cv.versionNumber}`) : `v${cv.versionNumber}`).join(", ")} — un CV à jour augmente tes chances.`,
    actionLabel: "Voir les CV",
    actionUrl: "/cvs",
    score: 35,
    relatedIds: outdated.map((cv) => cv.id),
  }];
};

// ─── Aggregator ──────────────────────────────────────────────────────────────

const ALL_RULES: Rule[] = [
  dormantApplication,
  coolingContact,
  brokenCommitment,
  weeklyForgottenRisk,
  namedFollowup,
  companiesWithoutContact,
  interviewsWithoutFeedback,
  staleStatusUpdate,
  channelBias,
  sectorConcentration,
  mostEffectiveChannel,
  completenessScore,
  outdatedCV,
];

export function generateInsights(data: UserData, limit = 5): Insight[] {
  const allInsights: Insight[] = [];
  for (const rule of ALL_RULES) {
    try {
      const results = rule(data);
      allInsights.push(...results);
    } catch {
      // Skip failing rules silently
    }
  }
  // Deduplicate by ruleId (keep highest score)
  const byRule = new Map<string, Insight>();
  for (const insight of allInsights) {
    const key = insight.id;
    const existing = byRule.get(key);
    if (!existing || insight.score > existing.score) {
      byRule.set(key, insight);
    }
  }
  // Sort by score descending, limit
  return Array.from(byRule.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
