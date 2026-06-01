"use client";

import { useSearchParams } from "next/navigation";
import { DemoProvider } from "@/lib/demo-provider";
import { Suspense, type ReactNode } from "react";

function DemoDetector({ children }: { children: ReactNode }) {
  const params = useSearchParams();
  const isDemo = params.get("demo") === "true";

  if (isDemo) {
    return <DemoProvider>{children}</DemoProvider>;
  }

  return <>{children}</>;
}

export function DemoWrapper({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<>{children}</>}>
      <DemoDetector>{children}</DemoDetector>
    </Suspense>
  );
}
