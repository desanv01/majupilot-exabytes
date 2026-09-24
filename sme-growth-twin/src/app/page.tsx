import Link from "next/link";

import { Brand } from "@/components/assessment/brand";
import { DemoLauncher, HomePrimaryActions } from "@/components/assessment/home-actions";
import { CaseAPreview } from "@/components/home/case-a-preview";

const assessmentTopics = [
  {
    title: "Business identity and context",
    description: "Your business model, team size, sector, and operating context.",
  },
  {
    title: "Current digital foundation",
    description: "The tools and controls already active, informal, absent, or unknown.",
  },
  {
    title: "Main business friction",
    description: "The workflow costing the most time, clarity, or continuity today.",
  },
  {
    title: "Growth objective and constraints",
    description: "Your next objective, budget band, preferred pace, and highest concern.",
  },
  {
    title: "AI and change readiness",
    description: "Leadership, data, skills, process consistency, and willingness to change.",
  },
];

const reliabilityItems = [
  ["Deterministic core", "Scores, rankings, scenarios, and ROI are calculated by versioned rules."],
  ["Evidence trail", "Important findings link back to recorded answers and labelled assumptions."],
  ["Failure-safe review", "Optional AI interpretation falls back without changing numeric truth."],
] as const;

export default function HomePage() {
  return (
    <div className="home-page">
      <header className="topbar home-topbar">
        <Brand />
        <nav className="home-nav" aria-label="Primary navigation">
          <Link href="#how-it-works">How it works</Link>
          <Link href="#assessment-topics">Assessment</Link>
          <Link href="#demo-cases">Demo cases</Link>
          <Link href="/copilot">Copilot</Link>
          <Link href="/cases">Saved cases</Link>
        </nav>
        <details className="home-mobile-menu">
          <summary>Menu</summary>
          <nav aria-label="Mobile navigation">
            <Link href="#how-it-works">How it works</Link>
            <Link href="#assessment-topics">Assessment</Link>
            <Link href="#demo-cases">Demo cases</Link>
            <Link href="/copilot">Copilot</Link>
            <Link href="/cases">Saved cases</Link>
          </nav>
        </details>
      </header>

      <main id="main-content">
        <section className="home-hero" aria-labelledby="home-title">
          <div className="home-hero-copy">
            <p className="home-kicker">Build your Business Twin</p>
            <h1 id="home-title">
              <span>Know your business.</span>
              <span>Choose next steps.</span>
            </h1>
            <p className="home-lead">
              Answer five focused questions to build an editable Business Twin and reveal a practical path forward.
            </p>
            <HomePrimaryActions />
            <p className="home-hero-disclosure">
              New assessments use your entries. The preview uses fictional Case A data.
            </p>
          </div>
          <CaseAPreview />
        </section>

        <section className="home-reliability" aria-labelledby="reliability-title">
          <div className="home-reliability-intro">
            <h2 id="reliability-title">Advice you can trace, question, and edit.</h2>
          </div>
          <div className="home-reliability-list">
            {reliabilityItems.map(([title, description]) => (
              <article key={title}>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="home-method" id="how-it-works" aria-labelledby="method-title">
          <div className="home-method-heading">
            <h2 id="method-title">A clear route from today&apos;s reality to the next decision.</h2>
          </div>
          <div className="home-method-flow">
            <article>
              <h3>Answer</h3>
              <p>Record current tools, operating friction, constraints, and readiness in plain language.</p>
            </article>
            <article>
              <h3>Compare</h3>
              <p>Review evidence-linked recommendations and Lean, Balanced, and Accelerated paths.</p>
            </article>
            <article>
              <h3>Act</h3>
              <p>Choose a scenario and create a printable Blueprint with assumptions kept visible.</p>
            </article>
          </div>
        </section>

        <section className="home-topics" id="assessment-topics" aria-labelledby="topics-title">
          <div className="home-topics-heading">
            <h2 id="topics-title">A useful starting point in about 2 to 3 minutes.</h2>
            <p>No single answer judges your business. Each one clarifies the current starting point.</p>
          </div>
          <ol className="home-topic-list">
            {assessmentTopics.map((topic, index) => (
              <li key={topic.title}>
                <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{topic.title}</h3>
                  <p>{topic.description}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="home-local-note">
            <strong>Saved as you work.</strong> Your browser keeps a recoverable draft; completed evidence is securely synced for reports, Copilot, and consultation.
          </p>
        </section>

        <DemoLauncher />

        <section className="home-disclosures" aria-labelledby="disclosures-title">
          <div>
            <h2 id="disclosures-title">What the product uses, and what it does not claim.</h2>
          </div>
          <dl>
            <div>
              <dt>AI</dt>
              <dd>AI may interpret and review a plan. It does not calculate or overwrite deterministic results.</dd>
            </div>
            <div>
              <dt>Catalogue</dt>
              <dd>Exabytes mappings come from a curated, versioned catalogue. They are not quotes or live availability checks.</dd>
            </div>
            <div>
              <dt>Evidence</dt>
              <dd>User facts, calculations, catalogue facts, planning assumptions, and model text stay visibly distinct.</dd>
            </div>
            <div>
              <dt>Privacy</dt>
              <dd>Drafts remain recoverable in this browser. Completed evidence is stored securely; contact details are requested only after explicit consultation consent.</dd>
            </div>
          </dl>
        </section>
      </main>

      <footer className="home-footer">
        <Brand />
        <p>Decision support for Malaysian SMEs. Fictional cases are always labelled.</p>
      </footer>
    </div>
  );
}
