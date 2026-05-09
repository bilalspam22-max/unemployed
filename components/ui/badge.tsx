import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "success" | "warn" | "danger" | "info" | "plum" | "primary" | "neutral";

interface BadgeProps {
  tone?: BadgeTone;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}

export function Badge({ tone = "neutral", dot = false, children, className }: BadgeProps) {
  return (
    <span className={cn("badge", tone && `badge--${tone}`, className)}>
      {dot && <span className="badge__dot" />}
      {children}
    </span>
  );
}

// Pre-configured status badge
const STATUS_MAP: Record<string, { label: string; tone: BadgeTone }> = {
  to_contact:       { label: "À contacter",       tone: "neutral" },
  contacted:        { label: "Contactée",          tone: "info"    },
  followed_up:      { label: "Relancée",           tone: "warn"    },
  interview:        { label: "Entretien",          tone: "success" },
  rejected:         { label: "Refus",              tone: "danger"  },
  hot_opportunity:  { label: "Opportunité chaude", tone: "plum"    },
  to_prepare:       { label: "À préparer",         tone: "neutral" },
  cv_sent:          { label: "CV envoyé",          tone: "info"    },
  followup_planned: { label: "Relance prévue",     tone: "warn"    },
  in_discussion:    { label: "En discussion",      tone: "primary" },
  waiting:          { label: "En attente",         tone: "warn"    },
  won:              { label: "Gagnée",             tone: "success" },
  cold:             { label: "Froid",              tone: "info"    },
  warm:             { label: "Tiède",              tone: "warn"    },
  hot:              { label: "Chaud",              tone: "danger"  },
  pending:          { label: "En attente",         tone: "warn"    },
  completed:        { label: "Terminé",            tone: "success" },
  skipped:          { label: "Ignoré",             tone: "neutral" },
  to_analyze:       { label: "À analyser",        tone: "neutral" },
  to_do:            { label: "À faire",            tone: "info"    },
  in_progress:      { label: "En cours",           tone: "primary" },
  done:             { label: "Terminé",            tone: "success" },
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_MAP[status] ?? { label: status, tone: "neutral" as BadgeTone };
  return <Badge tone={cfg.tone} dot>{cfg.label}</Badge>;
}

// Temperature dot
const TEMP_COLORS = {
  hot:  { bg: "var(--danger)", shadow: "rgba(212,74,92,.12)" },
  warm: { bg: "var(--warn)",   shadow: "rgba(224,138,43,.14)" },
  cold: { bg: "var(--info)",   shadow: "rgba(59,131,201,.14)" },
};

export function TempDot({ temp }: { temp: "hot" | "warm" | "cold" | null | undefined }) {
  const t = temp ?? "cold";
  const c = TEMP_COLORS[t] ?? TEMP_COLORS.cold;
  return (
    <span
      className={`dot-temp dot-temp--${t}`}
      style={{ background: c.bg, boxShadow: `0 0 0 3px ${c.shadow}` }}
      title={t === "hot" ? "Chaud" : t === "warm" ? "Tiède" : "Froid"}
    />
  );
}
