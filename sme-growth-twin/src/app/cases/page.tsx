import Link from "next/link";

import { AccountCasesClient } from "@/components/account/account-cases-client";
import { Brand } from "@/components/assessment/brand";

export const dynamic = "force-dynamic";

export default async function CasesPage({ searchParams }: { searchParams: Promise<{ auth?: string }> }) {
  const authError = (await searchParams).auth === "expired";

  return (
    <div className="account-page">
      <header className="topbar account-topbar">
        <Brand />
        <Link href="/">Home</Link>
      </header>
      <main id="main-content" className="account-main">
        <div className="account-heading">
          <p className="eyebrow">Your work</p>
          <h1>Keep your Business Twin close.</h1>
          <p>Create an account to save every case as you work, then pick up from your last step on another device. You can add work already started in this browser.</p>
        </div>
        <AccountCasesClient initialAuthError={authError} />
      </main>
    </div>
  );
}
