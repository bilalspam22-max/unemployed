"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import {
  DEMO_SECTORS, DEMO_COMPANIES, DEMO_CONTACTS, DEMO_APPLICATIONS,
  DEMO_MEETINGS, DEMO_FOLLOWUPS, DEMO_TRAININGS, DEMO_CVS,
  DEMO_DASHBOARD, DEMO_USER,
} from "./demo-data";

// ─── Context ────────────────────────────────────────────────────────────────

const DemoContext = createContext<boolean>(false);

export function useIsDemo() {
  return useContext(DemoContext);
}

// ─── Route matcher ──────────────────────────────────────────────────────────

function matchDemoRoute(url: string): { data: unknown } | null {
  const path = new URL(url, "http://localhost").pathname;

  // Dashboard
  if (path === "/api/dashboard") {
    return { data: {
      ...DEMO_DASHBOARD,
      hotContacts: DEMO_CONTACTS.filter(c => c.temperature === "hot"),
    }};
  }

  // Streak
  if (path === "/api/streak") {
    return { data: { current: 12, best: 18, lastActivity: new Date().toISOString().slice(0, 10) } };
  }

  // Insights
  if (path === "/api/insights") {
    return { data: [
      {
        id: "i1", ruleId: "hot-no-followup", category: "followup", severity: "action",
        icon: "🔥", title: "3 contacts chauds sans relance prévue",
        body: "Sophie (Datadog), Léa (Qonto) et Arthur (Mistral) sont chauds mais n'ont pas de relance planifiée cette semaine.",
        actionLabel: "Voir les contacts", actionUrl: "/contacts", score: 95,
      },
      {
        id: "i2", ruleId: "won-celebrate", category: "action", severity: "info",
        icon: "🎉", title: "Offre reçue chez Datadog !",
        body: "Ta candidature SRE chez Datadog est passée au statut 'Gagnée'. Félicitations !",
        actionLabel: "Voir la candidature", actionUrl: "/applications", score: 100,
      },
      {
        id: "i3", ruleId: "stale-applications", category: "behavior", severity: "warning",
        icon: "⏰", title: "2 candidatures sans nouvelles depuis 3+ semaines",
        body: "Les candidatures chez Owkin et TotalEnergies n'ont pas bougé. Pense à relancer.",
        actionLabel: "Relancer", actionUrl: "/followups", score: 70,
      },
    ]};
  }

  // Sectors
  if (path === "/api/sectors") return { data: DEMO_SECTORS };

  // Companies
  if (path === "/api/companies") return { data: DEMO_COMPANIES };

  // Contacts
  if (path === "/api/contacts") return { data: DEMO_CONTACTS };

  // Applications
  if (path === "/api/applications") return { data: DEMO_APPLICATIONS };

  // Meetings
  if (path === "/api/meetings") return { data: DEMO_MEETINGS };

  // Followups
  if (path === "/api/followups") return { data: DEMO_FOLLOWUPS };

  // Trainings
  if (path === "/api/trainings") return { data: DEMO_TRAININGS };

  // CVs
  if (path === "/api/cvs") return { data: DEMO_CVS };

  // Overview
  if (path === "/api/overview") {
    return { data: {
      companies: DEMO_COMPANIES,
      contacts: DEMO_CONTACTS,
      applications: DEMO_APPLICATIONS,
      meetings: DEMO_MEETINGS,
    }};
  }

  // Auth session
  if (path === "/api/auth/get-session") {
    return { data: null }; // We handle session via useSession override
  }

  // For any PUT/POST/DELETE in demo — just return success
  if (path.startsWith("/api/")) {
    return { data: { success: true, message: "Mode démo : les modifications ne sont pas sauvegardées." } };
  }

  return null;
}

// ─── Provider ───────────────────────────────────────────────────────────────

export function DemoProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Intercept fetch for API calls in demo mode
    const originalFetch = window.fetch;

    window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as Request).url;

      // Only intercept API calls
      if (url.startsWith("/api/") || url.includes("/api/")) {
        const result = matchDemoRoute(url);
        if (result) {
          // For write operations, show a toast-like delay then return the data
          const method = init?.method?.toUpperCase() ?? "GET";
          if (method !== "GET") {
            await new Promise(r => setTimeout(r, 300)); // Simulate network delay
          }
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
      }

      return originalFetch(input, init);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return <DemoContext.Provider value={true}>{children}</DemoContext.Provider>;
}

// ─── Demo session hook (replaces useSession in demo mode) ───────────────────

export function getDemoSession() {
  return {
    data: {
      user: DEMO_USER,
      session: {
        id: "demo-session",
        userId: "demo",
        token: "demo-token",
        expiresAt: new Date("2099-12-31"),
      },
    },
    isPending: false,
    error: null,
  };
}
