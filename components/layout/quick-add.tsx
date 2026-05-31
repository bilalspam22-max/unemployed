"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Briefcase, KanbanSquare, Users, Bell } from "lucide-react";

interface QuickAction {
  label: string;
  sublabel: string;
  href: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  color: string;
}

const ACTIONS: QuickAction[] = [
  {
    label: "Candidature",
    sublabel: "Nouvelle candidature",
    href: "/applications?new=1",
    icon: KanbanSquare,
    color: "var(--primary)",
  },
  {
    label: "Entreprise",
    sublabel: "Ajouter une entreprise",
    href: "/companies?new=1",
    icon: Briefcase,
    color: "var(--success)",
  },
  {
    label: "Contact",
    sublabel: "Ajouter un contact",
    href: "/contacts?new=1",
    icon: Users,
    color: "var(--warn)",
  },
  {
    label: "Relance",
    sublabel: "Planifier une relance",
    href: "/followups?new=1",
    icon: Bell,
    color: "var(--plum)",
  },
];

export function QuickAdd() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function handleClick(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <>
      {/* Backdrop sheet — only when open */}
      {open && (
        <div className="quick-add__backdrop" onClick={() => setOpen(false)} />
      )}

      {/* Action sheet — slides up from bottom */}
      {open && (
        <div className="quick-add__sheet">
          <div className="quick-add__sheet-handle" />
          <div className="quick-add__sheet-title">Créer rapidement</div>
          <div className="quick-add__actions">
            {ACTIONS.map(({ label, sublabel, href, icon: Icon, color }) => (
              <button
                key={href}
                className="quick-add__action"
                onClick={() => handleClick(href)}
              >
                <div className="quick-add__action-icon" style={{ background: color }}>
                  <Icon size={20} strokeWidth={2} />
                </div>
                <div className="quick-add__action-text">
                  <div className="quick-add__action-label">{label}</div>
                  <div className="quick-add__action-sublabel">{sublabel}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* FAB button */}
      <button
        className={`quick-add__fab ${open ? "quick-add__fab--open" : ""}`}
        onClick={() => setOpen(!open)}
        aria-label={open ? "Fermer le menu de création rapide" : "Ouvrir le menu de création rapide"}
      >
        {open ? <X size={24} strokeWidth={2.5} /> : <Plus size={24} strokeWidth={2.5} />}
      </button>
    </>
  );
}
