import { Brand } from "@/components/assessment/brand";
import { HomeActions } from "@/components/assessment/home-actions";

const coverage = [
  "Business context",
  "Digital foundation",
  "Business friction",
  "Growth constraints",
  "Change readiness",
];

export default function HomePage() {
  return (
    <>
      <header className="topbar">
        <Brand />
        <span className="trust-chip">Local, explainable, editable</span>
      </header>
      <main className="home">
        <section className="hero">
          <p className="eyebrow">Start your Business Twin</p>
          <h1>Turn your answers into a clear business picture.</h1>
          <p className="lead">
            A concise assessment for Malaysian SME owners. In five grouped
            questions, we capture your current digital foundation, business
            friction, goals, and readiness using only the facts you provide.
          </p>
          <HomeActions />
        </section>
        <section className="coverage" aria-labelledby="cover-title">
          <div>
            <p className="eyebrow">What we’ll cover</p>
            <h2 id="cover-title">Five focused steps. About 2–3 minutes.</h2>
          </div>
          <ol>
            {coverage.map((label, index) => (
              <li key={label}>
                <span>{index + 1}</span>
                {label}
              </li>
            ))}
          </ol>
          <p className="privacy">
            <strong>Your answers are saved only on this device.</strong> You can
            edit them, resume later, or start over.
          </p>
        </section>
      </main>
    </>
  );
}
