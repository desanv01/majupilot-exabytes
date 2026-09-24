"use client";

import { useEffect, useState } from "react";

import { ACCOUNT_CASE_CHANGED_EVENT, activeAccountCase } from "@/infrastructure/persistence/account-case-scope";

export function AccountSaveScope({ guestText, accountText }: { guestText: string; accountText: string }) {
  const [account, setAccount] = useState(false);
  useEffect(() => {
    const refresh = () => setAccount(Boolean(activeAccountCase(localStorage)));
    refresh();
    window.addEventListener(ACCOUNT_CASE_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(ACCOUNT_CASE_CHANGED_EVENT, refresh);
  }, []);
  return <>{account ? accountText : guestText}</>;
}
