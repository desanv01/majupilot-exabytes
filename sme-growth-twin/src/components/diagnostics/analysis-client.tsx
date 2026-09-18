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

import { PostAssessmentShell } from "./post-assessment-shell";

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
  const [businessName, setBusinessName] = useState("");
  const [error, setError] = useState("");
  const [run, setRun] = useState(0);
  const resultRef = useRef<ReturnType<typeof buildDiagnosticResult> | undefined>(undefined);

  const retry = useCallback(() => {
    setError("");
    setActiveStep(0);
    setRun((value) => value + 1);
  }, []);

  useEffect(() => {
    try {
      resultRef.current = undefined;
      const restored = loadAssessmentDraft(localStorage);
      if (restored.status !== "ok" || restored.draft.status !== "ready_for_review") {
        setError("Your reviewed Business Twin could not be restored. Return to the assessment and confirm it again.");
        return;
      }

      const twin = rebuildCurrentTwin(restored.draft);
      setBusinessName(twin.identity.businessName);
      resultRef.current = buildDiagnosticResult(twin, {
        now: () => new Date().toISOString(),
        id: () => diagnosticResultIdSchema.parse(`diagnostic_${crypto.randomUUID()}`),
      });
    } catch {
      setError("We could not calculate these results from the saved facts. Your answers are still safe on this device.");
      return;
    }

    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const delay = reducedMotion ? 0 : 560;
    const timers: ReturnType<typeof setTimeout>[] = [];
    ANALYSIS_STEPS.forEach((_, index) => {
      timers.push(setTimeout(() => setActiveStep(index + 1), delay * (index + 1)));
    });
    timers.push(setTimeout(() => {
      if (!resultRef.current) return;
      try {
        saveDiagnosticResult(localStorage, resultRef.current);
        router.replace("/results");
      } catch {
        resultRef.current = undefined;
        setError("We could not save the completed diagnosis on this device. Your recorded answers remain available for another attempt.");
      }
    }, delay * ANALYSIS_STEPS.length + (reducedMotion ? 40 : 220)));
    return () => timers.forEach(clearTimeout);
  }, [router, run]);

  return (
    <PostAssessmentShell businessName={businessName} context={error ? "restoring" : "analysis"}>
      <main className="analysis-shell">
        <p className="eyebrow">Local deterministic analysis</p>
        <h1>Turning recorded facts into a clear diagnosis.</h1>
        <p className="lead">
          These calculations run locally from your recorded answers. No live AI or model call is required.
        </p>
        {error ? (
          <section className="analysis-error" role="alert" data-analysis-state="error">
            <p className="analysis-state-label">Analysis interrupted</p>
            <h2>We could not complete the local analysis.</h2>
            <p>{error}</p>
            <p>No partial scores or rankings have been shown.</p>
            <div className="inline-actions">
              <button className="button primary" onClick={retry}>Try again</button>
              <Link className="button secondary" href="/assessment/review">Back to review</Link>
            </div>
          </section>
        ) : (
          <section className="analysis-card" aria-live="polite" aria-busy={activeStep < ANALYSIS_STEPS.length} data-analysis-state={activeStep === ANALYSIS_STEPS.length ? "complete" : "running"}>
            <div className="analysis-sequence">
              <p className="analysis-state-label">Step {Math.min(activeStep + 1, ANALYSIS_STEPS.length)} of {ANALYSIS_STEPS.length}</p>
              <h2>{activeStep === ANALYSIS_STEPS.length ? "Your diagnosis is ready." : ANALYSIS_STEPS[Math.min(activeStep, ANALYSIS_STEPS.length - 1)]}</h2>
              <p>Each completed step uses the accepted rule packs and only the evidence recorded in your Business Twin.</p>
              <ol className="analysis-list">
                {ANALYSIS_STEPS.map((label, index) => {
                  const complete = index < activeStep;
                  const current = index === activeStep && activeStep < ANALYSIS_STEPS.length;
                  return (
                    <li key={label} className={complete ? "complete" : current ? "current" : "waiting"}>
                      <span aria-hidden="true">{index + 1}</span>
                      <strong>{label}</strong>
                      <em>{complete ? "Complete" : current ? "In progress" : "Waiting"}</em>
                    </li>
                  );
                })}
              </ol>
            </div>
            <div className="analysis-preview" aria-hidden="true">
              <div className="analysis-preview-score"><span /><span /></div>
              <div className="analysis-preview-score"><span /><span /></div>
              <div className="analysis-preview-lines"><span /><span /><span /><span /></div>
              <p>Confirmed values appear only after calculation and saving finish.</p>
            </div>
          </section>
        )}
      </main>
    </PostAssessmentShell>
  );
}
