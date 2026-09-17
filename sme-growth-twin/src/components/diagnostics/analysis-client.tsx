"use client";

/* eslint-disable react-hooks/set-state-in-effect -- local persisted data is restored at the client boundary */
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { rebuildCurrentTwin } from "@/core/assessment/rebuild-current-twin";
import { buildDiagnosticResult } from "@/core/scoring/build-diagnostic";
import { diagnosticResultIdSchema } from "@/domain/ids";
import { loadAssessmentDraft } from "@/infrastructure/persistence/local-assessment-store";
import { saveDiagnosticResult } from "@/infrastructure/persistence/local-diagnostic-store";

import { Brand } from "../assessment/brand";
import { Progress } from "../assessment/progress";

export const ANALYSIS_STEPS = [
  "Validating recorded evidence",
  "Calculating digital maturity",
  "Calculating AI readiness",
  "Ranking evidence-linked pain points",
  "Preparing results",
] as const;

export function AnalysisClient() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState("");
  const [run, setRun] = useState(0);
  const resultRef = useRef<ReturnType<typeof buildDiagnosticResult> | undefined>(undefined);

  const retry = useCallback(() => {
    setError("");
    setActiveStep(0);
    setRun((value) => value + 1);
  }, []);

  useEffect(() => {
    const restored = loadAssessmentDraft(localStorage);
    if (restored.status !== "ok" || restored.draft.status !== "ready_for_review") {
      setError("Your reviewed Business Twin could not be restored. Return to the assessment and confirm it again.");
      return;
    }

    try {
      const twin = rebuildCurrentTwin(restored.draft);
      resultRef.current = buildDiagnosticResult(twin, {
        now: () => new Date().toISOString(),
        id: () => diagnosticResultIdSchema.parse(`diagnostic_${crypto.randomUUID()}`),
      });
    } catch {
      setError("We could not calculate these results from the saved facts. Your answers are still safe on this device.");
      return;
    }

    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const delay = reducedMotion ? 0 : 750;
    const timers: ReturnType<typeof setTimeout>[] = [];
    ANALYSIS_STEPS.forEach((_, index) => {
      timers.push(setTimeout(() => setActiveStep(index + 1), delay * (index + 1)));
    });
    timers.push(setTimeout(() => {
      if (!resultRef.current) return;
      saveDiagnosticResult(localStorage, resultRef.current);
      router.replace("/results");
    }, delay * ANALYSIS_STEPS.length + (reducedMotion ? 30 : 280)));
    return () => timers.forEach(clearTimeout);
  }, [router, run]);

  return (
    <>
      <header className="topbar">
        <Brand />
        <span className="save-status">Local deterministic analysis</span>
      </header>
      <Progress step={5} />
      <main className="analysis-shell">
        <p className="eyebrow">Business Twin analysis</p>
        <h1>Turning recorded facts into a clear diagnosis</h1>
        <p className="lead">
          These calculations run locally from your recorded answers. No live AI or model call is required.
        </p>
        {error ? (
          <section className="analysis-error" role="alert">
            <h2>Analysis could not finish</h2>
            <p>{error}</p>
            <div className="inline-actions">
              <button className="button primary" onClick={retry}>Try again</button>
              <Link className="button secondary" href="/assessment/review">Back to review</Link>
            </div>
          </section>
        ) : (
          <section className="analysis-card" aria-live="polite" aria-busy={activeStep < ANALYSIS_STEPS.length}>
            <div className="analysis-orbit" aria-hidden="true"><span>{activeStep}/{ANALYSIS_STEPS.length}</span></div>
            <div>
              <h2>Evidence-first, versioned calculations</h2>
              <ol className="analysis-list">
                {ANALYSIS_STEPS.map((label, index) => {
                  const complete = index < activeStep;
                  const current = index === activeStep;
                  return <li key={label} className={complete ? "complete" : current ? "current" : ""}>
                    <span aria-hidden="true">{complete ? "✓" : index + 1}</span>
                    <strong>{label}</strong>
                    <em>{complete ? "Complete" : current ? "In progress" : "Waiting"}</em>
                  </li>;
                })}
              </ol>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
