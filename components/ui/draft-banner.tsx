"use client";

import { FileEdit, RotateCcw, Trash2 } from "lucide-react";
import { draftAge, type DraftEntry } from "@/lib/drafts";

const ENTITY_LABEL: Record<string, string> = {
  contact:     "Contact",
  application: "Candidature",
  company:     "Entreprise",
  sector:      "Secteur",
  cv:          "CV",
  meeting:     "Réunion",
  training:    "Formation",
};

interface DraftBannerProps {
  draft: DraftEntry;
  onResume: () => void;
  onDiscard: () => void;
}

export function DraftBanner({ draft, onResume, onDiscard }: DraftBannerProps) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "10px 16px", borderRadius: "var(--r-md)",
      background: "var(--warn-soft)", border: "1px solid var(--warn)",
      marginBottom: 20, flexWrap: "wrap",
    }}>
      <FileEdit size={15} color="var(--warn)" style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 160 }}>
        <span style={{ fontWeight: 600, fontSize: 13, color: "var(--ink)" }}>
          Brouillon — {ENTITY_LABEL[draft.type] ?? draft.type}
        </span>
        {draft.label && (
          <span style={{ fontSize: 12, color: "var(--muted)", marginLeft: 6 }}>
            « {draft.label} »
          </span>
        )}
        <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: 6 }}>
          · {draftAge(draft.savedAt)}
        </span>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          className="btn btn--sm"
          onClick={onResume}
          style={{ color: "var(--warn)", borderColor: "var(--warn)" }}
        >
          <RotateCcw size={12} /> Reprendre
        </button>
        <button className="btn btn--sm btn--ghost" onClick={onDiscard}>
          <Trash2 size={12} /> Supprimer
        </button>
      </div>
    </div>
  );
}
