"use client";

import { type ComponentType, type ReactNode } from "react";

interface EmptyStateProps {
  icon: ComponentType<{ size?: number; strokeWidth?: number; color?: string }>;
  title: string;
  description?: ReactNode;
  action?: { label: string; onClick: () => void; icon?: ComponentType<{ size?: number }> };
  tone?: "primary" | "success" | "warn" | "plum" | "info" | "neutral";
}

export function EmptyState({ icon: Icon, title, description, action, tone = "neutral" }: EmptyStateProps) {
  const color =
    tone === "primary" ? "var(--primary)" :
    tone === "success" ? "var(--success)" :
    tone === "warn"    ? "var(--warn)"    :
    tone === "plum"    ? "var(--plum)"    :
    tone === "info"    ? "var(--info)"    :
    "var(--ink-3)";

  const softBg =
    tone === "primary" ? "var(--primary-soft)" :
    tone === "success" ? "var(--success-soft)" :
    tone === "warn"    ? "var(--warn-soft)"    :
    tone === "plum"    ? "var(--plum-soft)"    :
    tone === "info"    ? "var(--info-soft)"    :
    "var(--surface-2)";

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "48px 24px",
      textAlign: "center",
      gap: 12,
    }}>
      <div style={{
        width: 72,
        height: 72,
        borderRadius: 20,
        background: softBg,
        display: "grid",
        placeItems: "center",
        color,
        boxShadow: "var(--sh-1)",
      }}>
        <Icon size={32} strokeWidth={1.5} />
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", marginTop: 4 }}>{title}</div>
      {description && (
        <div style={{ fontSize: 13, color: "var(--ink-3)", maxWidth: 380, lineHeight: 1.5 }}>
          {description}
        </div>
      )}
      {action && (
        <button
          className="btn btn--primary"
          onClick={action.onClick}
          style={{ marginTop: 8 }}
        >
          {action.icon && <action.icon size={14} />}
          {action.label}
        </button>
      )}
    </div>
  );
}
