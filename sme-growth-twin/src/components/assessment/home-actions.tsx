"use client";

/* eslint-disable react-hooks/set-state-in-effect -- resume availability is client-only */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  createGoldenAssessmentDraft,
  GOLDEN_FIXTURES,
  type GoldenFixture,
} from "@/domain-packs/exabytes/golden-fixtures";
import {
  ASSESSMENT_STORAGE_KEY,
  saveAssessmentDraft,
} from "@/infrastructure/persistence/local-assessment-store";
import {
  clearKnownProjectStorage,
  DEMO_SESSION_CHANGED_EVENT,
  PROJECT_LOCAL_STORAGE_KEYS,
  RESET_STATUS_SESSION_KEY,
  saveDemoSession,
} from "@/infrastructure/persistence/project-storage";

export function HomeActions() {
  const router = useRouter();
  const [resume, setResume] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    setResume(Boolean(localStorage.getItem(ASSESSMENT_STORAGE_KEY)));
    const resetStatus = sessionStorage.getItem(RESET_STATUS_SESSION_KEY);
    if (resetStatus) {
      sessionStorage.removeItem(RESET_STATUS_SESSION_KEY);
      setStatus(resetStatus);
    }
  }, []);

  const loadFixture = (fixture: GoldenFixture) => {
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
    window.dispatchEvent(new Event(DEMO_SESSION_CHANGED_EVENT));
    router.push("/assessment/review");
  };

  const reset = () => {
    const hasRecords = PROJECT_LOCAL_STORAGE_KEYS.some((key) => localStorage.getItem(key) !== null);
    const approved = window.confirm(
      hasRecords
        ? "Reset SME Growth Twin demonstration data on this device? Only known project records will be removed."
        : "Confirm the SME Growth Twin project storage is reset? Other browser data will not be touched.",
    );
    if (!approved) return;
    clearKnownProjectStorage(localStorage, sessionStorage);
    setResume(false);
    setStatus("SME Growth Twin demonstration data was reset. Other browser storage was not changed.");
  };

  return (
    <>
      <div className="home-actions">
        <Link className="button primary" href="/assessment?new=1">
          Start assessment <span>→</span>
        </Link>
        {resume ? (
          <Link className="button secondary" href="/assessment">
            Resume saved assessment
          </Link>
        ) : null}
      </div>
      <section className="demo-launcher" aria-labelledby="demo-title">
        <div className="demo-launcher-heading">
          <div>
            <p className="eyebrow">Fictional demonstration cases</p>
            <h2 id="demo-title">Review a complete, clearly labelled example.</h2>
            <p>
              Loading a case replaces only this device&apos;s saved prototype records.
              It does not create consent or a consultation lead.
            </p>
          </div>
          <button className="reset-demo" type="button" onClick={reset}>
            Reset demonstration data
          </button>
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
              <button
                className="button secondary"
                data-fixture-id={fixture.id}
                type="button"
                onClick={() => loadFixture(fixture)}
              >
                Load {fixture.id.replace("case-", "Case ").toUpperCase()}
              </button>
            </article>
          ))}
        </div>
        <div className="reliability-strip" aria-label="Demonstration reliability">
          <span>Deterministic calculations</span>
          <span>Evidence-linked recommendations</span>
          <span>Model-failure fallback</span>
        </div>
      </section>
      <p className="reset-status" role="status" aria-live="polite">
        {status}
      </p>
    </>
  );
}
