"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { DemoSession } from "@/infrastructure/persistence/project-storage";
import {
  clearKnownProjectStorage,
  DEMO_SESSION_CHANGED_EVENT,
  loadDemoSession,
  RESET_STATUS_SESSION_KEY,
} from "@/infrastructure/persistence/project-storage";

export function DemoBanner() {
  const router = useRouter();
  const pathname = usePathname();
  const [demo, setDemo] = useState<DemoSession>();

  useEffect(() => {
    const refresh = () => setDemo(loadDemoSession(localStorage));
    refresh();
    window.addEventListener(DEMO_SESSION_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(DEMO_SESSION_CHANGED_EVENT, refresh);
  }, [pathname]);

  if (!demo) return null;

  const reset = () => {
    if (
      !window.confirm(
        "Reset this fictional demonstration? Only known SME Growth Twin records will be removed.",
      )
    ) {
      return;
    }
    clearKnownProjectStorage(localStorage, sessionStorage);
    sessionStorage.setItem(
      RESET_STATUS_SESSION_KEY,
      "SME Growth Twin demonstration data was reset. Other browser storage was not changed.",
    );
    setDemo(undefined);
    router.push("/");
  };

  return (
    <aside className="demo-banner" aria-label="Fictional demonstration status">
      <p>
        <strong>Fictional demonstration:</strong> {demo.label} · fixture {demo.fixtureVersion}
      </p>
      <button type="button" onClick={reset}>
        Reset demo data
      </button>
    </aside>
  );
}
