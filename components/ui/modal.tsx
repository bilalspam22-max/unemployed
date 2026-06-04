"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { X, Maximize2, Minimize2 } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}

export function Modal({ open, onClose, title, children, footer, size = "md" }: ModalProps) {
  // Custom dimensions (drag-to-resize). null = use the default size.
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const [maximized, setMaximized] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  // Reset custom size each time the modal re-opens
  useEffect(() => {
    if (!open) { setDims(null); setMaximized(false); }
  }, [open]);

  if (!open) return null;

  const defaultMaxWidth = size === "sm" ? 400 : size === "lg" ? 680 : 520;

  // Drag-to-resize from the bottom-right corner (modal is centered → grow ×2)
  function onHandleDown(e: React.PointerEvent) {
    e.preventDefault();
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMaximized(false);
    dragRef.current = { startX: e.clientX, startY: e.clientY, startW: rect.width, startH: rect.height };
    window.addEventListener("pointermove", onHandleMove);
    window.addEventListener("pointerup", onHandleUp);
  }
  function onHandleMove(e: PointerEvent) {
    const s = dragRef.current;
    if (!s) return;
    const w = Math.min(window.innerWidth * 0.96, Math.max(360, s.startW + (e.clientX - s.startX) * 2));
    const h = Math.min(window.innerHeight * 0.94, Math.max(300, s.startH + (e.clientY - s.startY) * 2));
    setDims({ w, h });
  }
  function onHandleUp() {
    dragRef.current = null;
    window.removeEventListener("pointermove", onHandleMove);
    window.removeEventListener("pointerup", onHandleUp);
  }

  function toggleMaximize() {
    if (maximized) { setMaximized(false); setDims(null); }
    else { setMaximized(true); setDims({ w: window.innerWidth * 0.94, h: window.innerHeight * 0.94 }); }
  }

  const width = dims ? dims.w : "100%";
  const maxWidth = dims ? undefined : defaultMaxWidth;
  const height = dims ? dims.h : undefined;
  const maxHeight = dims ? undefined : "90vh";

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
        ref={wrapperRef}
        role="dialog"
        aria-modal
        className="modal-wrapper"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 91,
          width,
          maxWidth,
          height,
          maxHeight,
          background: "var(--surface)",
          borderRadius: "var(--r-xl)",
          boxShadow: "var(--sh-3)",
          display: "flex",
          flexDirection: "column",
          animation: "slideUp .2s ease",
        }}
      >
        {/* Mobile drag handle (shown via CSS) */}
        <div className="modal-wrapper__handle" />

        <div style={{
          padding: "16px 20px 12px 20px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexShrink: 0,
        }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{title}</h2>
          <div style={{ display: "flex", gap: 2 }}>
            <button
              className="btn btn--ghost btn--icon modal-wrapper__maximize"
              onClick={toggleMaximize}
              aria-label={maximized ? "Réduire la fenêtre" : "Agrandir la fenêtre"}
              title={maximized ? "Réduire" : "Agrandir"}
            >
              {maximized ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
            <button className="btn btn--ghost btn--icon" onClick={onClose} aria-label="Fermer">
              <X size={16} />
            </button>
          </div>
        </div>
        <div style={{ padding: "16px 20px", overflowY: "auto", flex: 1, WebkitOverflowScrolling: "touch" }}>
          {children}
        </div>
        {footer && (
          <div style={{
            padding: "12px 20px calc(12px + env(safe-area-inset-bottom, 0px)) 20px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
            flexShrink: 0,
            background: "var(--surface)",
          }}>
            {footer}
          </div>
        )}

        {/* Resize handle (bottom-right) — desktop only */}
        <div
          className="modal-wrapper__resize"
          onPointerDown={onHandleDown}
          title="Glisser pour redimensionner"
        />
      </div>
    </>
  );
}
