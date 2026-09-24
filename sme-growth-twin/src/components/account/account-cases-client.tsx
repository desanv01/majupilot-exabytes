"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";

import { createBrowserSupabaseClient } from "@/infrastructure/supabase/browser";
import { accountCaseResumePath, activeAccountCase, clearAccountCaseStorage, restoreAccountCase, saveActiveAccountCase, setActiveAccountCase } from "@/infrastructure/persistence/account-case-client";
import { accountCaseSnapshotSchema } from "@/domain/account-cases";
import { assessmentDraftSchema } from "@/domain/assessment";
import { ASSESSMENT_STORAGE_KEY } from "@/infrastructure/persistence/local-assessment-store";
import { DEMO_SESSION_STORAGE_KEY } from "@/infrastructure/persistence/project-storage";
import { loadDurableJourney, DURABLE_JOURNEY_STORAGE_KEY } from "@/infrastructure/persistence/durable-journey-client";
import { ACCOUNT_CASE_CHANGED_EVENT } from "@/infrastructure/persistence/account-case-scope";
import { ACCOUNT_CASE_LOCAL_CHANGE_EVENT } from "@/infrastructure/persistence/account-case-events";

type CaseListItem = { id: string; businessName: string; state: string; revision: number; updatedAt: string };
type Envelope<T> = { data?: T; error?: { code: string } };

async function parseResponse<T>(result: Response): Promise<T> {
  const body = await result.json() as Envelope<T>;
  if (!result.ok || !body.data) throw new Error(body.error?.code ?? "Request failed");
  return body.data;
}

function subscribeBrowserWork(callback: () => void) {
  window.addEventListener(ACCOUNT_CASE_CHANGED_EVENT, callback);
  window.addEventListener(ACCOUNT_CASE_LOCAL_CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(ACCOUNT_CASE_CHANGED_EVENT, callback);
    window.removeEventListener(ACCOUNT_CASE_LOCAL_CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function browserWorkSnapshot() {
  try {
    const raw = localStorage.getItem(ASSESSMENT_STORAGE_KEY);
    if (!raw || localStorage.getItem(DEMO_SESSION_STORAGE_KEY)) return false;
    if (!assessmentDraftSchema.safeParse(JSON.parse(raw) as unknown).success) return false;
    const active = activeAccountCase(localStorage);
    return !active || active.revision === 0;
  } catch { return false; }
}

export function AccountCasesClient({ initialAuthError }: { initialAuthError: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [organizationId, setOrganizationId] = useState<string>();
  const [cases, setCases] = useState<CaseListItem[]>([]);
  const [busy, setBusy] = useState(false);
  const browserWork = useSyncExternalStore(subscribeBrowserWork, browserWorkSnapshot, () => false);
  const [message, setMessage] = useState(initialAuthError ? "This sign-in link has expired. Request a new one." : "");

  useEffect(() => {
    try {
      void createBrowserSupabaseClient().auth.getUser().then(({ data }) => {
        if (data.user?.email) { setSignedInEmail(data.user.email); setEmail(data.user.email); }
      }).catch(() => undefined).finally(() => setCheckingAuth(false));
    } catch { setCheckingAuth(false); }
  }, []);

  useEffect(() => {
    if (!signedInEmail) return;
    let cancelled = false;
    const load = async () => {
      try {
        const workspace = await parseResponse<{ organizationId: string }>(await fetch("/api/v2/account/workspace", { method: "POST" }));
        const items = await parseResponse<CaseListItem[]>(await fetch(`/api/v2/cases?organizationId=${encodeURIComponent(workspace.organizationId)}`, { cache: "no-store" }));
        if (!cancelled) { setOrganizationId(workspace.organizationId); setCases(items); }
      } catch {
        if (!cancelled) setMessage("Saved cases are temporarily unavailable. Your work in this browser is still here.");
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [signedInEmail]);

  async function sendLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const client = createBrowserSupabaseClient();
      const { error } = await client.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: `${location.origin}/auth/confirm` } });
      if (error) throw error;
      setMessage("Check your email for a sign-in link. Keep this tab open if you want to add the work saved in this browser.");
    } catch {
      setMessage("We could not send the link right now. Check the email address and try again.");
    } finally { setBusy(false); }
  }

  async function signOut() {
    setBusy(true);
    try {
      const savedCase = activeAccountCase(localStorage);
      await flushCurrent();
      await parseResponse<{ signedOut: true }>(await fetch("/api/v2/account/sign-out", { method: "POST" }));
      if (savedCase) clearAccountCaseStorage(localStorage, sessionStorage);
      setSignedInEmail(null);
      setOrganizationId(undefined);
      setCases([]);
      router.refresh();
    } catch { setMessage("Could not sign out. Please try again."); }
    finally { setBusy(false); }
  }

  async function refreshCases(scope: string) {
    setCases(await parseResponse<CaseListItem[]>(await fetch(`/api/v2/cases?organizationId=${encodeURIComponent(scope)}`, { cache: "no-store" })));
  }

  async function flushCurrent() {
    if (activeAccountCase(localStorage)) await saveActiveAccountCase();
  }

  async function openCase(caseId: string) {
    if (!organizationId || busy) return;
    if (browserWork) { setMessage("Add this browser's work to your account before opening another case."); return; }
    setBusy(true); setMessage("");
    try {
      await flushCurrent();
      const record = await parseResponse<{ revision: number; snapshot: unknown }>(await fetch(`/api/v2/cases/${caseId}?organizationId=${encodeURIComponent(organizationId)}`, { cache: "no-store" }));
      const snapshot = record.snapshot === null ? null : accountCaseSnapshotSchema.parse(record.snapshot);
      restoreAccountCase(record.snapshot, { organizationId, caseId, revision: record.revision });
      router.push(snapshot ? accountCaseResumePath(snapshot) : "/assessment?new=1");
    } catch (error) { setMessage(error instanceof Error && error.message === "IDEMPOTENCY_CONFLICT" ? "This case changed on another device. Reload it before switching so your edits are preserved." : "Could not open this case. Your current browser work has not been cleared."); }
    finally { setBusy(false); }
  }

  async function newCase() {
    if (!organizationId || busy) return;
    if (browserWork) { setMessage("Add this browser's work to your account before starting another case."); return; }
    setBusy(true); setMessage("");
    try {
      await flushCurrent();
      const created = await parseResponse<{ id: string }>(await fetch("/api/v2/cases", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ organizationId }) }));
      restoreAccountCase(null, { organizationId, caseId: created.id, revision: 0 });
      router.push("/assessment?new=1");
    } catch { setMessage("Could not start a new case. Your current browser work has not been cleared."); }
    finally { setBusy(false); }
  }

  async function addBrowserWork() {
    if (!organizationId || busy) return;
    setBusy(true); setMessage("");
    try {
      const pendingCase = activeAccountCase(localStorage);
      if (pendingCase) {
        if (pendingCase.organizationId !== organizationId) throw new Error("Case workspace mismatch");
        await saveActiveAccountCase();
        await refreshCases(organizationId);
        setMessage("This browser's work is now saved to your account.");
        return;
      }
      const journey = loadDurableJourney(localStorage);
      let caseId: string;
      if (journey?.guestSessionId) {
        const claimed = await parseResponse<{ assessmentSessionId: string }>(await fetch("/api/v2/guest/claim", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ organizationId }) }));
        caseId = claimed.assessmentSessionId;
        localStorage.setItem(DURABLE_JOURNEY_STORAGE_KEY, JSON.stringify({ ...journey, guestSessionId: undefined, organizationId, assessmentSessionId: caseId }));
      } else {
        const created = await parseResponse<{ id: string }>(await fetch("/api/v2/cases", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ organizationId }) }));
        caseId = created.id;
        localStorage.setItem(DURABLE_JOURNEY_STORAGE_KEY, JSON.stringify({ organizationId, assessmentSessionId: caseId, leadIdempotencyKey: `lead:${crypto.randomUUID()}` }));
      }
      setActiveAccountCase(localStorage, { organizationId, caseId, revision: 0 });
      await saveActiveAccountCase();
      await refreshCases(organizationId);
      setMessage("This browser's work is now saved to your account.");
    } catch {
      setMessage("Could not add this browser's work yet. The work remains on this device; please retry.");
    } finally { setBusy(false); }
  }

  if (checkingAuth) return <section className="account-card" aria-busy="true"><h2>Checking your account…</h2><p>Opening your saved workspace.</p></section>;

  if (!signedInEmail) return (
    <section className="account-card" aria-labelledby="account-signin-title">
      <p className="account-step">01 / Sign in</p>
      <h2 id="account-signin-title">Get a secure link by email</h2>
      <p>No password to remember. The link opens your saved cases.</p>
      <form onSubmit={sendLink} className="account-signin-form">
        <label htmlFor="account-email">Email address</label>
        <input id="account-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        <button className="button" type="submit" disabled={busy}>{busy ? "Sending…" : "Email me a sign-in link"}</button>
      </form>
      {message && <p role="status" className="account-message">{message}</p>}
      <p className="account-footnote">Work started without sign-in stays in this browser until you add it to your account.</p>
    </section>
  );

  return (
    <section className="account-card" aria-labelledby="account-cases-title">
      <div className="account-card-header">
        <div><p className="account-step">Your account</p><h2 id="account-cases-title">Saved cases</h2><p>Signed in as {signedInEmail}</p></div>
        <button className="account-text-button" type="button" onClick={signOut} disabled={busy}>Sign out</button>
      </div>
      {message && <p role="status" className="account-message">{message}</p>}
      {!organizationId ? <p>Loading your workspace…</p> : (
        <>
          <div className="account-case-actions">
            <button className="button" type="button" disabled={busy} onClick={() => void newCase()}>New case</button>
            {browserWork && <button className="button account-secondary-button" type="button" disabled={busy} onClick={() => void addBrowserWork()}>Add this browser&apos;s work</button>}
          </div>
          {cases.length ? <ul className="account-case-list">{cases.map((item) => (
            <li key={item.id}><div><strong>{item.businessName}</strong><span>Updated {new Date(item.updatedAt).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })}</span></div><button type="button" className="account-text-button" disabled={busy} onClick={() => void openCase(item.id)}>Open case</button></li>
          ))}</ul> : <p className="account-empty">No saved cases yet. You can start a new assessment or add the work in this browser.</p>}
        </>
      )}
    </section>
  );
}
