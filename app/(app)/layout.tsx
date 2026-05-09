export const dynamic = "force-dynamic";

import { AppProvider } from "@/lib/store";
import { Sidebar } from "@/components/layout/sidebar";
import { ToastHost } from "@/components/layout/toast-host";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <AppShell>{children}</AppShell>
    </AppProvider>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg)" }}>
      <Sidebar />
      <main className="main" style={{ flex: 1, overflowY: "auto" }}>
        {children}
      </main>
      <ToastHost />
    </div>
  );
}
