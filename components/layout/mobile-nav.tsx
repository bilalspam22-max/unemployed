"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  KanbanSquare,
  Users,
  MoreHorizontal,
  Layers,
  FileText,
  Bell,
  GraduationCap,
  CalendarCheck,
  Network,
  Sparkles,
  X,
} from "lucide-react";

const MAIN_ITEMS = [
  { href: "/dashboard",    label: "Accueil",       icon: LayoutDashboard },
  { href: "/overview",     label: "Overview",      icon: Network },
  { href: "/applications", label: "Candidatures",  icon: KanbanSquare },
  { href: "/contacts",     label: "Contacts",      icon: Users },
];

const MORE_ITEMS = [
  { href: "/capture",    label: "Capture",     icon: Sparkles },
  { href: "/meetings",   label: "Réunions",    icon: CalendarCheck },
  { href: "/sectors",    label: "Secteurs",    icon: Layers },
  { href: "/cvs",        label: "CV",          icon: FileText },
  { href: "/followups",  label: "Relances",    icon: Bell },
  { href: "/training",   label: "Formations",  icon: GraduationCap },
];

export function MobileNav() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);

  const isMoreActive = MORE_ITEMS.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  );

  return (
    <>
      {/* Bottom sheet overlay */}
      {showMore && (
        <div
          className="mobile-nav__sheet-overlay"
          onClick={() => setShowMore(false)}
        />
      )}

      {/* More sheet */}
      {showMore && (
        <div className="mobile-nav__sheet">
          <div className="mobile-nav__sheet-handle" />
          <div className="mobile-nav__sheet-grid">
            {MORE_ITEMS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="mobile-nav__sheet-item"
                onClick={() => setShowMore(false)}
              >
                <Icon size={20} strokeWidth={1.75} />
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Bottom nav bar */}
      <nav className="mobile-nav">
        <div className="mobile-nav__bar">
          {MAIN_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`mobile-nav__item ${active ? "mobile-nav__item--active" : ""}`}
              >
                <Icon size={20} strokeWidth={1.75} />
                {label}
              </Link>
            );
          })}
          <button
            className={`mobile-nav__item ${isMoreActive ? "mobile-nav__item--active" : ""}`}
            onClick={() => setShowMore(!showMore)}
          >
            {showMore ? <X size={20} strokeWidth={1.75} /> : <MoreHorizontal size={20} strokeWidth={1.75} />}
            Plus
          </button>
        </div>
      </nav>
    </>
  );
}
