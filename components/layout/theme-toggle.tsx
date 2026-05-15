"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "dark" | "light";

export function ThemeToggle({ collapsed }: { collapsed?: boolean }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const stored = localStorage.getItem("recherche-theme") as Theme | null;
    const current = stored === "light" ? "light" : "dark";
    setTheme(current);
    document.documentElement.setAttribute("data-theme", current);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("recherche-theme", next); } catch {}
  }

  return (
    <button
      className="btn btn--ghost btn--icon"
      onClick={toggle}
      title={theme === "dark" ? "Passer en mode jour" : "Passer en mode nuit"}
      aria-label={theme === "dark" ? "Passer en mode jour" : "Passer en mode nuit"}
      style={collapsed ? { width: "100%", justifyContent: "center" } : undefined}
    >
      {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
    </button>
  );
}
