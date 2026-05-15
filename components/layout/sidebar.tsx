"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Layers,
  Briefcase,
  Users,
  KanbanSquare,
  FileText,
  Bell,
  GraduationCap,
  Menu,
  LogOut,
} from "lucide-react";
import { useSidebar } from "@/lib/store";
import { useSession } from "@/lib/auth-client";
import { getInitials, avatarColor } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";

async function handleSignOut() {
  await fetch("/api/auth/sign-out", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  }).catch(() => {});
  window.location.href = "/login";
}

const NAV_ITEMS = [
  { href: "/dashboard",    label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/sectors",      label: "Secteurs",        icon: Layers },
  { href: "/companies",    label: "Entreprises",     icon: Briefcase },
  { href: "/contacts",     label: "Contacts",        icon: Users },
  { href: "/applications", label: "Candidatures",    icon: KanbanSquare },
  { href: "/cvs",          label: "CV par secteur",  icon: FileText },
  { href: "/followups",    label: "Relances",        icon: Bell },
];

const PHASE2_ITEMS = [
  { href: "/training", label: "Formations", icon: GraduationCap },
];

export function Sidebar() {
  const { collapsed, toggle } = useSidebar();
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;

  const initials = user ? getInitials(
    user.name?.split(" ")[0] ?? "U",
    user.name?.split(" ")[1] ?? "sr"
  ) : "?";

  return (
    <aside className="sidebar" style={{ width: collapsed ? 68 : 240, minWidth: collapsed ? 68 : 240 }}>
      {/* Brand */}
      <div className="sidebar__brand">
        <div className="brand__mark" style={{ flexShrink: 0 }} />
        {!collapsed && (
          <div>
            <div className="brand__name">recherche.</div>
            <div className="brand__sub">CRM personnel · job search</div>
          </div>
        )}
      </div>

      {/* Main nav */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link key={href} href={href} className={`nav-item ${active ? "nav-item--active" : ""}`}>
              <span className="nav-item__icon">
                <Icon size={16} strokeWidth={1.75} />
              </span>
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </div>

      {/* Phase 2 */}
      {!collapsed && <div className="nav-section-label">Phase 2</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {PHASE2_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link key={href} href={href} className={`nav-item ${active ? "nav-item--active" : ""}`}>
              <span className="nav-item__icon">
                <Icon size={16} strokeWidth={1.75} />
              </span>
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </div>

      {/* User footer */}
      <div className="nav__user">
        <div
          className="avatar"
          style={{ background: avatarColor(user?.name ?? "user"), flexShrink: 0 }}
        >
          {initials}
        </div>
        {!collapsed && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="semi" style={{ fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.name ?? "Utilisateur"}
            </div>
            <div className="muted tiny" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.email ?? ""}
            </div>
          </div>
        )}
        {!collapsed && <ThemeToggle />}
        {!collapsed && (
          <button
            className="btn btn--ghost btn--icon"
            title="Se déconnecter"
            onClick={handleSignOut}
          >
            <LogOut size={14} />
          </button>
        )}
        <button className="btn btn--ghost btn--icon" onClick={toggle} title="Replier la sidebar">
          <Menu size={14} />
        </button>
      </div>
    </aside>
  );
}
