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
  context: "analysis" | "results" | "recommendations" | "restoring";
}) {
  const contextContent = context === "analysis"
    ? { kicker: "Evidence-led diagnosis", heading: "See what the facts support.", summary: "Local calculations from your recorded answers", note: "No live model call is needed for this diagnosis." }
    : context === "results"
      ? { kicker: "Evidence-led diagnosis", heading: "See what the facts support.", summary: "Deterministic results with inspectable evidence", note: "No live model call is needed for this diagnosis." }
      : context === "recommendations"
        ? { kicker: "Capability decisions", heading: "Turn diagnosis into an ordered first move.", summary: "Capabilities ranked before catalogue products", note: "Capabilities are ranked first. Catalogue products are supporting provenance." }
        : { kicker: "Evidence-led diagnosis", heading: "Restore your saved diagnosis.", summary: "Restoring your saved diagnosis", note: "Saved records stay on this device." };

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
          <span>{contextContent.note}</span>
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
