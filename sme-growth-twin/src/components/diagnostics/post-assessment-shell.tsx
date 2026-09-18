import type { ReactNode } from "react";

import { Brand } from "../assessment/brand";

const journey = ["Discover", "Diagnose", "Compare", "Blueprint"] as const;

type ShellContext = "analysis" | "results" | "recommendations" | "restoring" | "scenarios" | "restoring-scenarios";

const contextDetails: Record<ShellContext, { kicker: string; heading: string; summary: string; note: string; currentIndex: number }> = {
  analysis: { kicker: "Evidence-led diagnosis", heading: "See what the facts support.", summary: "Local calculations from your recorded answers", note: "No live model call is needed for this diagnosis.", currentIndex: 1 },
  results: { kicker: "Evidence-led diagnosis", heading: "See what the facts support.", summary: "Deterministic results with inspectable evidence", note: "No live model call is needed for this diagnosis.", currentIndex: 1 },
  recommendations: { kicker: "Capability decisions", heading: "Turn diagnosis into an ordered first move.", summary: "Capabilities ranked before catalogue products", note: "Capabilities are ranked first. Catalogue products are supporting provenance.", currentIndex: 1 },
  restoring: { kicker: "Evidence-led diagnosis", heading: "Restore your saved diagnosis.", summary: "Restoring your saved diagnosis", note: "Saved records stay on this device.", currentIndex: 1 },
  scenarios: { kicker: "Decision laboratory", heading: "Compare paths before you commit.", summary: "Three paths, one inspectable decision", note: "Inspection focus is not a saved preference.", currentIndex: 2 },
  "restoring-scenarios": { kicker: "Decision laboratory", heading: "Restore your scenario comparison.", summary: "Checking saved paths and assumptions", note: "Saved records stay on this device.", currentIndex: 2 },
};

export function PostAssessmentShell({
  businessName,
  children,
  context,
}: {
  businessName?: string;
  children: ReactNode;
  context: ShellContext;
}) {
  const contextContent = contextDetails[context];
  const currentLabel = journey[contextContent.currentIndex];
  const previousLabel = journey[Math.max(0, contextContent.currentIndex - 1)];
  const nextLabel = journey[Math.min(journey.length - 1, contextContent.currentIndex + 1)];

  return (
    <div className="diagnostic-page">
      <aside className="diagnostic-rail" aria-label="Post-assessment journey">
        <Brand />
        <div className="diagnostic-rail-copy">
          <p>{contextContent.kicker}</p>
          <h2>{contextContent.heading}</h2>
          <span>{contextContent.summary}</span>
        </div>
        <nav aria-label="Transformation journey">
          <ol>
            {journey.map((label, index) => {
              const state = index < contextContent.currentIndex ? "complete" : index === contextContent.currentIndex ? "current" : "upcoming";
              return (
                <li key={label} className={state} aria-current={state === "current" ? "step" : undefined}>
                  <span aria-hidden="true">{index + 1}</span>
                  <div>
                    <strong>{label}</strong>
                    <small>{state === "complete" ? "Complete" : state === "current" ? "Current" : "Upcoming"}</small>
                  </div>
                </li>
              );
            })}
          </ol>
        </nav>
        <div className="diagnostic-rail-note">
          <strong>{businessName || "Your Business Twin"}</strong>
          <span>{contextContent.note}</span>
        </div>
      </aside>

      <div className="diagnostic-workspace">
        <header className="diagnostic-mobile-header">
          <Brand />
          <span>{currentLabel} - {contextContent.currentIndex + 1} of 4</span>
        </header>
        <div className="diagnostic-mobile-journey" aria-label="Current transformation journey stage">
          <span>{previousLabel} {contextContent.currentIndex === 0 ? "starts here" : "complete"}</span>
          <strong>{currentLabel}</strong>
          <span>{nextLabel} {contextContent.currentIndex === journey.length - 1 ? "current" : "next"}</span>
        </div>
        {children}
      </div>
    </div>
  );
}
