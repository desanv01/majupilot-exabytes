const labels = [
  "Business context",
  "Digital foundation",
  "Business friction",
  "Growth constraints",
  "Change readiness",
];

export function Progress({
  currentTopic,
  mode = "assessment",
  step,
}: {
  currentTopic?: string;
  mode?: "assessment" | "review";
  step: number;
}) {
  const visibleStep = Math.min(step, 5);
  const coreComplete = step > 5 || mode === "review";
  return (
    <nav className="progress" aria-label="Assessment progress">
      <div className="mobile-progress">
        <div>
          <span>{coreComplete ? "Core questions complete" : `Step ${visibleStep} of 5`}</span>
          <strong>{currentTopic ?? labels[visibleStep - 1]}</strong>
        </div>
        <progress
          aria-label="Core assessment progress"
          max="5"
          value={coreComplete ? 5 : visibleStep}
        />
      </div>
      <ol>
        {labels.map((label, index) => {
          const number = index + 1;
          const state =
            number < step || coreComplete
              ? "done"
              : number === step
                ? "current"
                : "future";
          return (
            <li
              key={label}
              className={state}
              aria-current={state === "current" ? "step" : undefined}
            >
              <span>{number}</span>
              <em>{label}</em>
              <small className="sr-only">
                {state === "done"
                  ? "Complete"
                  : state === "current"
                    ? "Current step"
                    : "Upcoming"}
              </small>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
