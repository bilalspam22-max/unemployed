export type DraftType = "contact" | "application" | "company" | "sector" | "cv" | "meeting" | "training";

export interface DraftEntry {
  type: DraftType;
  data: Record<string, unknown>;
  label: string;
  savedAt: string;
}

const key = (t: DraftType) => `re_draft_${t}`;

export function saveDraft(type: DraftType, data: Record<string, unknown>, label: string): void {
  try {
    localStorage.setItem(key(type), JSON.stringify({ type, data, label, savedAt: new Date().toISOString() } satisfies DraftEntry));
  } catch {}
}

export function getDraft(type: DraftType): DraftEntry | null {
  try {
    const raw = localStorage.getItem(key(type));
    return raw ? (JSON.parse(raw) as DraftEntry) : null;
  } catch { return null; }
}

export function clearDraft(type: DraftType): void {
  try { localStorage.removeItem(key(type)); } catch {}
}

export function draftAge(savedAt: string): string {
  const diff = Date.now() - new Date(savedAt).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${Math.floor(h / 24)}j`;
}
