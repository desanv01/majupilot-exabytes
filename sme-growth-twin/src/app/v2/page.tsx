import type { Metadata } from "next";
import Link from "next/link";

import { Brand } from "@/components/assessment/brand";

export const metadata: Metadata = { title: "V2 capabilities | MajuPilot" };

const capabilities = [
  ["Assessment and Business Twin", "Complete the stable assessment journey. Persisted V2 APIs retain ownership and immutable evidence separately from browser demo records.", "/assessment"],
  ["Canonical Blueprint report", "Review the decision Blueprint. Authorized V2 report routes generate immutable PDFs and short-lived private downloads.", "/blueprint"],
  ["Durable consultation lead", "Request a consultation from the stable journey. The V2 lead API commits consent, report identity, assignment, events, and outbox work atomically.", "/consultation"],
] as const;

export default function V2CapabilitiesPage() {
  return (
    <div className="home-page">
      <header className="topbar home-topbar">
        <Brand />
        <nav className="home-nav" aria-label="V2 navigation"><Link href="/">Home</Link><Link href="/assessment">Assessment</Link><Link href="/blueprint">Blueprint</Link></nav>
      </header>
      <main>
        <section className="home-hero" aria-labelledby="v2-title">
          <div className="home-hero-copy">
            <p className="home-kicker">MajuPilot V2 application boundary</p>
            <h1 id="v2-title"><span>One stable journey.</span><span>Durable capabilities behind it.</span></h1>
            <p className="home-lead">Assessment, reporting, consultation, Transformation Copilot, and provider-neutral delivery now share versioned server contracts without changing deterministic calculations.</p>
            <div className="home-actions"><Link className="button primary" href="/assessment">Open assessment</Link><Link className="button secondary" href="/api/v2/integration/status">View machine-readable status</Link></div>
          </div>
          <aside className="case-preview" aria-label="V2 capability status">
            <p className="eyebrow">Integration status</p><h2>Phase H connected</h2>
            <dl><div><dt>Delivery</dt><dd>Signed HTTPS webhook</dd></div><div><dt>Failure mode</dt><dd>Durable retry / dead letter</dd></div><div><dt>Document RAG</dt><dd>P1 — not enabled</dd></div></dl>
          </aside>
        </section>
        <section className="home-reliability" aria-labelledby="v2-capabilities-title">
          <div className="home-reliability-intro"><h2 id="v2-capabilities-title">Completed capability entry points.</h2></div>
          <div className="home-reliability-list">
            {capabilities.map(([title, description, href]) => <article key={title}><h3>{title}</h3><p>{description}</p><Link href={href}>Open capability</Link></article>)}
          </div>
        </section>
        <section className="home-method" aria-labelledby="copilot-title">
          <div className="home-method-heading"><p className="eyebrow">Transformation Copilot</p><h2 id="copilot-title">Persisted, scoped, and confirmation-gated.</h2></div>
          <div className="home-method-flow"><article><h3>Read</h3><p>Typed tools retrieve the authorized Twin, evidence, scores, recommendations, report, and lead status.</p></article><article><h3>Confirm</h3><p>Writes require an explicit confirmation token and retain idempotent audit evidence.</p></article><article><h3>Operate</h3><p>Authorized clients use the versioned <code>/api/v2/copilot</code> routes; raw model reasoning and cross-tenant data stay excluded.</p></article></div>
        </section>
      </main>
      <footer className="home-footer"><Brand /><p>V2 capability status is operational evidence, not Phase I release or deployment proof.</p></footer>
    </div>
  );
}
