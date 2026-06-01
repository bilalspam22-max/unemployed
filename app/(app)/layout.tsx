export const dynamic = "force-dynamic";

import { AppProvider } from "@/lib/store";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { QuickAdd } from "@/components/layout/quick-add";
import { ToastHost } from "@/components/layout/toast-host";
import { DemoWrapper } from "./demo-wrapper";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <DemoWrapper>
        <AppShell>{children}</AppShell>
      </DemoWrapper>
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
      <MobileNav />
      <QuickAdd />
      <ToastHost />
    </div>
  );
}
