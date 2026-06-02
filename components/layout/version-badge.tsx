export const APP_VERSION = "V2.3.9";

export function VersionBadge() {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 12,
        right: 12,
        zIndex: 50,
        padding: "4px 10px",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        color: "var(--ink-3)",
        letterSpacing: "0.04em",
        fontFamily: "var(--f-mono)",
        boxShadow: "var(--sh-1)",
        userSelect: "none",
        pointerEvents: "none",
        opacity: 0.85,
      }}
      aria-label={`Version de l'application : ${APP_VERSION}`}
    >
      {APP_VERSION}
    </div>
  );
}
