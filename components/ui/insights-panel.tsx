"use client";

import { useState } from "react";
import {
  Clock,
  Thermometer,
  AlertTriangle,
  EyeOff,
  Send,
  UserX,
  FileText,
  RefreshCw,
  GitBranch,
  Target,
  Zap,
  BarChart2,
  FileWarning,
  Sparkles,
  X,
  ChevronRight,
} from "lucide-react";
import type { Insight } from "@/lib/types";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  clock: Clock,
  thermometer: Thermometer,
  "alert-triangle": AlertTriangle,
  "eye-off": EyeOff,
  send: Send,
  "user-x": UserX,
  "file-text": FileText,
  "refresh-cw": RefreshCw,
  "git-branch": GitBranch,
  target: Target,
  zap: Zap,
  "bar-chart-2": BarChart2,
  "file-warning": FileWarning,
};

const SEVERITY_STYLES: Record<string, { bg: string; border: string; iconColor: string }> = {
  action:  { bg: "var(--plum-soft)",   border: "var(--plum)",   iconColor: "var(--plum)" },
  warning: { bg: "var(--warn-soft)",   border: "var(--warn)",   iconColor: "var(--warn)" },
  info:    { bg: "var(--primary-soft)", border: "var(--primary)", iconColor: "var(--primary)" },
};

interface InsightsPanelProps {
  insights: Insight[];
  loading?: boolean;
}

export function InsightsPanel({ insights, loading }: InsightsPanelProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = insights.filter((i) => !dismissed.has(i.id));

  if (loading) {
    return (
      <div className="insights-panel">
        <div className="insights-panel__head">
          <div className="insights-panel__title">
            <Sparkles size={16} strokeWidth={2} />
            Radar
          </div>
        </div>
        <div className="insights-panel__loading">
          <div className="insights-panel__skeleton" />
          <div className="insights-panel__skeleton insights-panel__skeleton--short" />
        </div>
      </div>
    );
  }

  if (visible.length === 0) {
    return (
      <div className="insights-panel">
        <div className="insights-panel__head">
          <div className="insights-panel__title">
            <Sparkles size={16} strokeWidth={2} />
            Radar
          </div>
        </div>
        <div className="insights-panel__empty">
          <div className="insights-panel__empty-icon">🎯</div>
          <div className="insights-panel__empty-text">Tout est en ordre !</div>
          <div className="insights-panel__empty-sub">
            Continue à alimenter ton pipeline pour débloquer des insights personnalisés.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="insights-panel">
      <div className="insights-panel__head">
        <div className="insights-panel__title">
          <Sparkles size={16} strokeWidth={2} />
          Radar
        </div>
        <span className="insights-panel__count">{visible.length}</span>
      </div>
      <div className="insights-panel__list">
        {visible.map((insight, idx) => {
          const styles = SEVERITY_STYLES[insight.severity] ?? SEVERITY_STYLES.info;
          const IconComp = ICON_MAP[insight.icon] ?? Sparkles;

          return (
            <div
              key={insight.id}
              className="insight-card"
              style={{
                animationDelay: `${idx * 60}ms`,
                borderLeftColor: styles.border,
              }}
            >
              <div className="insight-card__icon" style={{ background: styles.bg, color: styles.iconColor }}>
                <IconComp size={16} strokeWidth={2} />
              </div>
              <div className="insight-card__content">
                <div className="insight-card__title">{insight.title}</div>
                <div className="insight-card__body">{insight.body}</div>
                {insight.actionLabel && insight.actionUrl && (
                  <a href={insight.actionUrl} className="insight-card__action">
                    {insight.actionLabel}
                    <ChevronRight size={12} />
                  </a>
                )}
              </div>
              <button
                className="insight-card__dismiss"
                onClick={() => setDismissed((prev) => new Set(prev).add(insight.id))}
                aria-label="Masquer"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
