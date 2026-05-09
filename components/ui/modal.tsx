"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}

export function Modal({ open, onClose, title, children, footer, size = "md" }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const maxWidth = size === "sm" ? 400 : size === "lg" ? 680 : 520;

  return (
    <>
      <div
        style={{
          position: "fixed", inset: 0,
          background: "rgba(20,22,28,.4)",
          backdropFilter: "blur(2px)",
          zIndex: 90,
          animation: "fadeIn .15s ease",
        }}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 91,
          width: "100%",
          maxWidth,
          maxHeight: "90vh",
          background: "var(--surface)",
          borderRadius: "var(--r-xl)",
          boxShadow: "var(--sh-3)",
          display: "flex",
          flexDirection: "column",
          animation: "slideUp .2s ease",
        }}
      >
        <div style={{
          padding: "18px 22px 14px 22px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{title}</h2>
          <button className="btn btn--ghost btn--icon" onClick={onClose} aria-label="Fermer">
            <X size={16} />
          </button>
        </div>
        <div style={{ padding: "18px 22px", overflowY: "auto", flex: 1 }}>{children}</div>
        {footer && (
          <div style={{ padding: "14px 22px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, justifyContent: "flex-end" }}>
            {footer}
          </div>
        )}
      </div>
    </>
  );
}
