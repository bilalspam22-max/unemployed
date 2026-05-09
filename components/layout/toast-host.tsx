"use client";

import { useEffect } from "react";
import { CheckCircle } from "lucide-react";
import { useToast } from "@/lib/store";

export function ToastHost() {
  const { toasts, dismissToast } = useToast();

  useEffect(() => {
    if (toasts.length === 0) return;
    const latest = toasts[toasts.length - 1];
    const timer = setTimeout(() => dismissToast(latest.id), 1800);
    return () => clearTimeout(timer);
  }, [toasts, dismissToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-host">
      {toasts.map((t) => (
        <div key={t.id} className="toast" onClick={() => dismissToast(t.id)}>
          <CheckCircle size={14} />
          {t.message}
        </div>
      ))}
    </div>
  );
}
