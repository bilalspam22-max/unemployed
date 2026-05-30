interface ProgressBarProps {
  value: number; // 0-100
  tone?: "primary" | "warn" | "danger" | "auto";
  label?: string;
  sublabel?: string;
}

export function ProgressBar({ value, tone = "auto", label, sublabel }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  let actualTone = tone;
  if (tone === "auto") {
    actualTone = clamped >= 85 ? "danger" : clamped >= 60 ? "warn" : "primary";
  }
  const color =
    actualTone === "danger" ? "var(--danger)" :
    actualTone === "warn"   ? "var(--warn)"   :
    "var(--primary)";

  return (
    <div style={{ width: "100%" }}>
      {(label || sublabel) && (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12.5 }}>
          {label && <span style={{ fontWeight: 600, color: "var(--ink-2)" }}>{label}</span>}
          {sublabel && <span className="muted">{sublabel}</span>}
        </div>
      )}
      <div
        style={{
          height: 10,
          background: "var(--surface-2)",
          borderRadius: 999,
          overflow: "hidden",
          border: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${clamped}%`,
            background: color,
            borderRadius: 999,
            transition: "width .4s ease, background .15s ease",
          }}
        />
      </div>
    </div>
  );
}
