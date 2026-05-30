"use client";

import { type ComponentType, type ReactNode } from "react";

interface TabConfig<T extends string> {
  id: T;
  label: string;
  icon?: ComponentType<{ size?: number; strokeWidth?: number }>;
  badge?: ReactNode;
}

interface TabsProps<T extends string> {
  tabs: TabConfig<T>[];
  activeTab: T;
  onChange: (id: T) => void;
}

export function Tabs<T extends string>({ tabs, activeTab, onChange }: TabsProps<T>) {
  return (
    <div
      style={{
        display: "flex",
        gap: 2,
        borderBottom: "1px solid var(--border)",
        marginBottom: 24,
        overflowX: "auto",
      }}
    >
      {tabs.map(({ id, label, icon: Icon, badge }) => {
        const active = id === activeTab;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 16px",
              border: "none",
              background: "transparent",
              fontSize: 13.5,
              fontWeight: active ? 700 : 500,
              color: active ? "var(--ink)" : "var(--ink-3)",
              borderBottom: `2px solid ${active ? "var(--primary)" : "transparent"}`,
              marginBottom: -1,
              cursor: "pointer",
              transition: "color .15s ease, border-color .15s ease",
              whiteSpace: "nowrap",
            }}
          >
            {Icon && <Icon size={15} strokeWidth={active ? 2 : 1.75} />}
            <span>{label}</span>
            {badge}
          </button>
        );
      })}
    </div>
  );
}
