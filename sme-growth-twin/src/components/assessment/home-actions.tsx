"use client";

/* eslint-disable react-hooks/set-state-in-effect -- resume availability is client-only */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { DemoResetControl } from "@/components/demo/demo-reset-control";
import { activeAccountCase, saveActiveAccountCase } from "@/infrastructure/persistence/account-case-client";
import { ACCOUNT_CASE_STORAGE_KEY } from "@/infrastructure/persistence/account-case-scope";

import {
  createGoldenAssessmentDraft,
  GOLDEN_FIXTURES,
  type GoldenFixture,
} from "@/domain-packs/exabytes/golden-fixtures";
import {
  loadAssessmentDraft,
  saveAssessmentDraft,
} from "@/infrastructure/persistence/local-assessment-store";
import {
  clearKnownProjectStorage,
  DEMO_SESSION_CHANGED_EVENT,
  loadDemoSession,
  RESET_STATUS_SESSION_KEY,
  saveDemoSession,
} from "@/infrastructure/persistence/project-storage";

const demoPathNotes: Record<GoldenFixture["id"], string> = {
  "case-a": "Shows a broad foundation-first path across customer operations, continuity, and growth.",
  "case-b": "Shows workflow and data foundations taking priority before AI.",
  "case-c": "Shows a selective path for a digitally mature team with governed AI readiness.",
};

export function DemoLauncher() {
  const router = useRouter();
  const [loadingFixtureId, setLoadingFixtureId] = useState<GoldenFixture["id"] | null>(null);
  const [demoAvailable, setDemoAvailable] = useState(true);
  const [hasProjectRecords, setHasProjectRecords] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const refresh = () => {
      setHasProjectRecords(Boolean(loadDemoSession(localStorage)));

      const resetStatus = sessionStorage.getItem(RESET_STATUS_SESSION_KEY);
      if (resetStatus) {
        sessionStorage.removeItem(RESET_STATUS_SESSION_KEY);
        setStatus(resetStatus);
      }
    };

    try {
      refresh();
      window.addEventListener(DEMO_SESSION_CHANGED_EVENT, refresh);
    } catch {
      setDemoAvailable(false);
    }

    return () => window.removeEventListener(DEMO_SESSION_CHANGED_EVENT, refresh);
  }, []);

  const loadFixture = async (fixture: GoldenFixture) => {
    setLoadingFixtureId(fixture.id);
    setStatus(`Loading ${fixture.label} as fictional demonstration data.`);
    try {
      if (loadAssessmentDraft(localStorage).status === "ok" && !loadDemoSession(localStorage)) {
        setLoadingFixtureId(null);
        setStatus("Finish or save your current assessment before opening a fictional demo case.");
        return;
      }
      if (activeAccountCase(localStorage)) await saveActiveAccountCase();
      localStorage.removeItem(ACCOUNT_CASE_STORAGE_KEY);
      clearKnownProjectStorage(localStorage, sessionStorage);
      const sessionId = `assessment_demo_${crypto.randomUUID().replaceAll("-", "").slice(0, 20)}`;
      const loadedAt = new Date().toISOString();
      saveAssessmentDraft(
        localStorage,
        createGoldenAssessmentDraft(fixture, sessionId, loadedAt),
      );
      saveDemoSession(localStorage, {
        schemaVersion: "1.0.0",
        fixtureId: fixture.id,
        fixtureVersion: fixture.fixtureVersion,
        label: fixture.label,
        fictional: true,
        assessmentSessionId: sessionId,
        loadedAt,
      });
      setHasProjectRecords(true);
      window.dispatchEvent(new Event(DEMO_SESSION_CHANGED_EVENT));
      router.push("/assessment/review");
    } catch {
      setLoadingFixtureId(null);
      setDemoAvailable(false);
      setStatus("Demo cases are unavailable in this browser. Starting a new assessment is still available above.");
    }
  };

  const reset = () => {
    try {
      clearKnownProjectStorage(localStorage, sessionStorage);
      window.dispatchEvent(new Event(DEMO_SESSION_CHANGED_EVENT));
      setHasProjectRecords(false);
      setStatus("MajuPilot demonstration data was reset. Other browser storage was not changed.");
    } catch {
      setDemoAvailable(false);
      setStatus("Demo storage is unavailable in this browser. No other browser data was changed.");
    }
  };

  return (
      <section className="demo-launcher" id="demo-cases" aria-labelledby="demo-title" aria-busy={loadingFixtureId !== null}>
        <div className="demo-launcher-heading">
          <div>
            <p className="eyebrow">Fictional demonstration cases</p>
            <h2 id="demo-title">Explore the complete journey with sample businesses.</h2>
            <p id="demo-disclosure">
              Loading a case replaces only this device&apos;s saved demonstration records.
              It does not create consent or a consultation lead.
            </p>
          </div>
          {demoAvailable && loadingFixtureId === null ? (
            <DemoResetControl recordsPresent={hasProjectRecords} onConfirm={reset} />
          ) : (
            <button className="reset-demo" type="button" disabled>
              Reset demo data
            </button>
          )}
        </div>
        <div className="demo-case-grid">
          {GOLDEN_FIXTURES.map((fixture, index) => (
            <article className="demo-case" key={fixture.id}>
              <div className="demo-case-labels">
                <span>Fictional demo</span>
                {index === 0 ? <strong>Recommended</strong> : null}
              </div>
              <h3>{fixture.label}</h3>
              <p className="demo-sector">{fixture.sector}</p>
              <p>{fixture.challengeSummary}</p>
              <p className="demo-path-note"><strong>Rules path:</strong> {demoPathNotes[fixture.id]}</p>
              <button
                className="button secondary"
                data-fixture-id={fixture.id}
                type="button"
                aria-label={`Load fictional ${fixture.label} demonstration case`}
                aria-describedby="demo-disclosure"
                disabled={!demoAvailable || loadingFixtureId !== null}
                onClick={() => loadFixture(fixture)}
              >
                {loadingFixtureId === fixture.id
                  ? `Loading CASE ${fixture.id.slice(-1).toUpperCase()}`
                  : `Load CASE ${fixture.id.slice(-1).toUpperCase()}`}
              </button>
            </article>
          ))}
        </div>
        {status ? (
          <p className="reset-status demo-status" role="status" aria-live="polite">
            {status}
          </p>
        ) : null}
      </section>
  );
}

export function HomePrimaryActions() {
  const [resume, setResume] = useState(false);
  const [accountCaseActive, setAccountCaseActive] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    try {
      const storedDraft = loadAssessmentDraft(localStorage);
      setResume(storedDraft.status === "ok");
      setAccountCaseActive(Boolean(activeAccountCase(localStorage)));
      if (storedDraft.status === "discarded") {
        setStatus("A saved assessment could not be restored and was safely removed. You can start again.");
      }

      const resetStatus = sessionStorage.getItem(RESET_STATUS_SESSION_KEY);
      if (resetStatus) {
        sessionStorage.removeItem(RESET_STATUS_SESSION_KEY);
        setStatus(resetStatus);
      }
    } catch {
      setStatus("Saved assessment tools are unavailable in this browser. You can still start a new assessment.");
    }
  }, []);

  return (
    <>
      <div className="home-actions">
        <Link className="button primary home-primary-action" href={accountCaseActive ? "/cases" : "/assessment?new=1"}>
          Start assessment
        </Link>
        {resume ? (
          <Link className="button secondary home-resume-action" href="/assessment">
            Resume assessment
          </Link>
        ) : null}
      </div>
      <p className="home-action-status" role="status" aria-live="polite">
        {status}
      </p>
    </>
  );
}
