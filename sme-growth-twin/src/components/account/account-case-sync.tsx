"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ACCOUNT_CASE_LOCAL_CHANGE_EVENT } from "@/infrastructure/persistence/account-case-events";
import { activeAccountCase, saveActiveAccountCase } from "@/infrastructure/persistence/account-case-client";

export function AccountCaseSync() {
  const [error, setError] = useState("");

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const save = () => {
      if (!activeAccountCase(localStorage)) return;
      void saveActiveAccountCase().then(() => setError("")).catch((cause: unknown) => {
        setError(cause instanceof Error && cause.message === "IDEMPOTENCY_CONFLICT"
          ? "This case changed on another device. Your edits remain in this browser."
          : "Your latest edits are in this browser, but could not be saved to your account.");
      });
    };
    const onChange = () => { if (timer) clearTimeout(timer); timer = setTimeout(save, 800); };
    const onVisibility = () => { if (document.visibilityState === "hidden") { if (timer) clearTimeout(timer); save(); } };
    window.addEventListener(ACCOUNT_CASE_LOCAL_CHANGE_EVENT, onChange);
    document.addEventListener("visibilitychange", onVisibility);
    return () => { if (timer) clearTimeout(timer); window.removeEventListener(ACCOUNT_CASE_LOCAL_CHANGE_EVENT, onChange); document.removeEventListener("visibilitychange", onVisibility); };
  }, []);

  return error ? <aside className="account-save-warning" role="alert">{error} <Link href="/cases">Open Saved cases to resolve this</Link>.</aside> : null;
}
