import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "—";
  const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateShort(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "—";
  const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

export function relativeDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.round((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffDays < 30) return `Il y a ${Math.round(diffDays / 7)} sem.`;
  return formatDateShort(dateStr);
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

/** Deterministic avatar color from a string */
const AVATAR_COLORS = [
  "linear-gradient(135deg, #3D5BE3, #5B75EC)",
  "linear-gradient(135deg, #2A9D6E, #3BB885)",
  "linear-gradient(135deg, #E08A2B, #F0A53A)",
  "linear-gradient(135deg, #8B5CB8, #A97DD4)",
  "linear-gradient(135deg, #D44A5C, #E86B7A)",
  "linear-gradient(135deg, #3B83C9, #5B9FE0)",
];
export function avatarColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function generateId(): string {
  return crypto.randomUUID();
}

// Safe fetch wrapper — returns { data, error }
export async function apiFetch<T>(url: string, init?: RequestInit): Promise<{ data: T | null; error: string | null }> {
  try {
    const resp = await fetch(url, init);
    const json = await resp.json();
    if (!resp.ok || json.error) {
      return { data: null, error: json.error ?? `Erreur ${resp.status}` };
    }
    return { data: json.data as T, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Erreur réseau" };
  }
}

export function parseJsonArray(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    to_contact: "À contacter",
    contacted: "Contactée",
    followed_up: "Relancée",
    interview: "Entretien",
    rejected: "Refus",
    hot_opportunity: "Opportunité chaude",
    to_prepare: "À préparer",
    cv_sent: "CV envoyé",
    followup_planned: "Relance prévue",
    in_discussion: "En discussion",
    waiting: "En attente",
    won: "Gagnée",
    cold: "Froid",
    warm: "Tiède",
    hot: "Chaud",
  };
  return map[status] ?? status;
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    to_contact: "neutral",
    contacted: "info",
    followed_up: "warn",
    interview: "success",
    rejected: "danger",
    hot_opportunity: "plum",
    to_prepare: "neutral",
    cv_sent: "info",
    followup_planned: "warn",
    in_discussion: "primary",
    waiting: "warn",
    rejected_app: "danger",
    won: "success",
  };
  return map[status] ?? "neutral";
}

export function temperatureColor(temp: string | null | undefined): string {
  if (temp === "hot")  return "var(--danger)";
  if (temp === "warm") return "var(--warn)";
  return "var(--info)";
}
