import type { ReactNode } from "react";

import { Brand } from "../assessment/brand";

const journey = ["Discover", "Diagnose", "Compare", "Blueprint"] as const;

export function PostAssessmentShell({
  businessName,
  children,
  context,
}: {
  businessName?: string;
  children: ReactNode;
  context: "analysis" | "results" | "restoring";
}) {
  const contextCopy = context === "analysis"
    ? "Local calculations from your recorded answers"
    : context === "results"
      ? "Deterministic results with inspectable evidence"
      : "Restoring your saved diagnosis";

  return (
    <div className="diagnostic-page">
      <aside className="diagnostic-rail" aria-label="Post-assessment journey">
        <Brand />
        <div className="diagnostic-rail-copy">
          <p>Evidence-led diagnosis</p>
          <h2>See what the facts support.</h2>
          <span>{contextCopy}</span>
        </div>
        <nav aria-label="Transformation journey">
          <ol>
            {journey.map((label, index) => {
              const state = index === 0 ? "complete" : index === 1 ? "current" : "upcoming";
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
          <span>No live model call is needed for this diagnosis.</span>
        </div>
      </aside>

      <div className="diagnostic-workspace">
        <header className="diagnostic-mobile-header">
          <Brand />
          <span>Diagnose - 2 of 4</span>
        </header>
        <div className="diagnostic-mobile-journey" aria-label="Current transformation journey stage">
          <span>Discover complete</span>
          <strong>Diagnose</strong>
          <span>Compare next</span>
        </div>
        {children}
      </div>
    </div>
  );
}
