"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/lib/store";

const AUTO_DISMISS_MS = 2400;

export function ToastHost() {
  const { toasts, dismissToast } = useToast();
  const [exiting, setExiting] = useState<Set<string>>(new Set());

  // Schedule auto-dismiss for each new toast
  useEffect(() => {
    const timers = toasts.map((t) => {
      // Trigger exit animation before removal
      const exitTimer = setTimeout(() => {
        setExiting((prev) => new Set(prev).add(t.id));
      }, AUTO_DISMISS_MS - 180);
      const removeTimer = setTimeout(() => {
        dismissToast(t.id);
        setExiting((prev) => {
          const next = new Set(prev);
          next.delete(t.id);
          return next;
        });
      }, AUTO_DISMISS_MS);
      return () => { clearTimeout(exitTimer); clearTimeout(removeTimer); };
    });
    return () => { timers.forEach((c) => c()); };
  }, [toasts, dismissToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-host">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast ${t.tone === "error" ? "toast--error" : ""} ${exiting.has(t.id) ? "toast--out" : ""}`}
          onClick={() => dismissToast(t.id)}
          role={t.tone === "error" ? "alert" : "status"}
        >
          {t.tone === "error" ? <XCircle size={14} /> : <CheckCircle size={14} />}
          {t.message}
        </div>
      ))}
    </div>
  );
}
