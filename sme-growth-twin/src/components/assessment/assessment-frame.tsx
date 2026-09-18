import type { ReactNode } from "react";

import { Brand } from "./brand";
import { Progress } from "./progress";

export type SaveState = "restoring" | "saving" | "saved" | "unavailable";

const saveCopy: Record<SaveState, string> = {
  restoring: "Restoring your saved draft",
  saving: "Saving on this device",
  saved: "Saved on this device",
  unavailable: "Device storage unavailable",
};

export function AssessmentFrame({
  children,
  currentTopic,
  mode = "assessment",
  saveState,
  step,
}: {
  children: ReactNode;
  currentTopic: string;
  mode?: "assessment" | "review";
  saveState: SaveState;
  step: number;
}) {
  const isReview = mode === "review";

  return (
    <div className="assessment-page">
      <aside className="assessment-rail" aria-label="Assessment context">
        <Brand />
        <div className="assessment-rail-intro">
          <p className="assessment-kicker">
            {isReview ? "Your evidence record" : "Build your Business Twin"}
          </p>
          <h2>
            {isReview
              ? "Check every fact before analysis."
              : "Five focused questions. One clear starting point."}
          </h2>
          <p>
            {isReview
              ? "Edit any section that does not reflect your business. No findings have been calculated yet."
              : "Your answers create an editable record of how your business works today."}
          </p>
        </div>

        <div className="assessment-rail-context">
          <section>
            <span className={`save-indicator ${saveState}`} aria-hidden="true" />
            <div>
              <strong>{saveCopy[saveState]}</strong>
              <p aria-live="polite">
                {saveState === "unavailable"
                  ? "You can continue this page, but review requires browser storage."
                  : "Your draft stays in this browser and can be edited later."}
              </p>
            </div>
          </section>
          <section>
            <span className="context-index" aria-hidden="true">
              ?
            </span>
            <div>
              <strong>Need a hand?</strong>
              <p>
                Choose Not sure where it is offered. No single answer judges
                your business.
              </p>
            </div>
          </section>
        </div>
      </aside>

      <div className="assessment-workspace">
        <header className="assessment-mobile-header">
          <Brand />
          <span className={`mobile-save-state ${saveState}`}>
            {saveState === "unavailable" ? "Not saving" : saveCopy[saveState]}
          </span>
        </header>
        <Progress step={step} currentTopic={currentTopic} mode={mode} />
        {children}
      </div>
    </div>
  );
}
