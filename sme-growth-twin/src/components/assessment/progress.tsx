const labels = [
  "Business context",
  "Digital foundation",
  "Business friction",
  "Growth constraints",
  "Change readiness",
];

export function Progress({ step }: { step: number }) {
  const visibleStep = Math.min(step, 5);
  return (
    <nav className="progress" aria-label="Assessment progress">
      <div className="mobile-progress">
        <span>Step {visibleStep} of 5</span>
        <progress max="5" value={visibleStep} />
      </div>
      <ol>
        {labels.map((label, index) => {
          const number = index + 1;
          const state = number < step ? "done" : number === step ? "current" : "";
          return (
            <li key={label} className={state}>
              <span>{number < step ? "✓" : number}</span>
              <em>{label}</em>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
