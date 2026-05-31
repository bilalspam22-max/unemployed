"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}

export function Drawer({ open, onClose, title, subtitle, footer, children }: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const [swipeY, setSwipeY] = useState<number | null>(null);
  const startYRef = useRef(0);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  function onTouchStart(e: React.TouchEvent) {
    // Only enable on mobile (≤768px) and only if started from the handle area (top 60px)
    if (window.innerWidth > 768) return;
    const rect = drawerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const touchY = e.touches[0].clientY;
    if (touchY - rect.top > 60) return; // Only swipe from header/handle area
    startYRef.current = touchY;
    setSwipeY(0);
  }

  function onTouchMove(e: React.TouchEvent) {
    if (swipeY === null) return;
    const dy = e.touches[0].clientY - startYRef.current;
    if (dy > 0) setSwipeY(dy);
  }

  function onTouchEnd() {
    if (swipeY === null) return;
    if (swipeY > 100) {
      onClose();
    }
    setSwipeY(null);
  }

  if (!open) return null;

  const swipeStyle = swipeY !== null
    ? { transform: `translateY(${swipeY}px)`, transition: "none" as const }
    : undefined;

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div
        ref={drawerRef}
        className={`drawer ${swipeY !== null ? "drawer--swiping" : ""}`}
        role="dialog"
        aria-modal
        style={swipeStyle}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Mobile drag handle */}
        <div className="drawer__swipe-handle" />

        <div className="drawer__head">
          <div style={{ flex: 1 }}>
            {title && <div style={{ fontSize: 17, fontWeight: 700 }}>{title}</div>}
            {subtitle && <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>{subtitle}</div>}
          </div>
          <button
            className="btn btn--ghost btn--icon"
            onClick={onClose}
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>
        <div className="drawer__body">{children}</div>
        {footer && <div className="drawer__foot">{footer}</div>}
      </div>
    </>
  );
}
