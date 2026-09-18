"use client";

/* eslint-disable react-hooks/set-state-in-effect -- versioned browser records are restored at this client boundary */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { buildAdvisorReviewContext } from "@/core/blueprint/build-review-context";
import { buildBlueprint } from "@/core/blueprint/build-blueprint";
import { rebuildCurrentTwin } from "@/core/assessment/rebuild-current-twin";
import { advisorPanelResponseSchema, type AdvisorPanelResponse, type AdvisorReview } from "@/domain/advisors";
import type { Blueprint } from "@/domain/blueprint";
import type { BusinessTwin } from "@/domain/business-twin";
import type { RecommendationResult } from "@/domain/recommendations";
import type { ScenarioComparison } from "@/domain/scenarios";
import type { DiagnosticResult } from "@/domain/scoring";
import { EXABYTES_ADVISORS_1_0_0, buildExabytesFallbackReview } from "@/domain-packs/exabytes/advisor-rules";
import { loadAssessmentDraft } from "@/infrastructure/persistence/local-assessment-store";
import { loadBlueprint, saveBlueprint } from "@/infrastructure/persistence/local-blueprint-store";
import { loadDiagnosticResult } from "@/infrastructure/persistence/local-diagnostic-store";
import { loadRecommendationResult } from "@/infrastructure/persistence/local-recommendation-store";
import { loadScenarioComparison } from "@/infrastructure/persistence/local-scenario-store";

import { Brand } from "../assessment/brand";

type Sources = { twin: BusinessTwin; diagnostic: DiagnosticResult; recommendations: RecommendationResult; comparison: ScenarioComparison };
type AdvisorStatus = "ready" | "reviewing" | "live" | "fallback" | "failed-safe";
const money = (value: number) => new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR", maximumFractionDigits: 0 }).format(value);
const range = (value: { low: number; base: number; high: number }) => `${money(value.low)} / ${money(value.base)} / ${money(value.high)}`;
const title = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const id = (prefix: string) => `${prefix}_${crypto.randomUUID().replaceAll("-", "").slice(0, 20)}`;
const sections = [
  ["cover", "Cover"], ["executive-summary", "Executive summary"], ["business-profile", "Business profile"], ["maturity-readiness", "Maturity & readiness"], ["pain-points", "Pain points"], ["recommendations", "Capabilities"], ["scenario-comparison", "Scenario comparison"], ["selected-plan", "Selected plan"], ["roi", "ROI"], ["roadmap", "Roadmap"], ["risks", "Risks"], ["advisor-reviews", "Advisor reviews"], ["synthesis", "Synthesis"], ["consultant-notes", "Consultant notes"], ["methodology", "Methodology"], ["consultation-preview", "Consultation preview"],
] as const;

function JourneyRail() { return <nav className="journey-rail no-print" aria-label="Growth Twin journey"><ol>{["Discover", "Diagnose", "Compare", "Blueprint"].map((label, index) => <li className={index < 3 ? "done" : "current"} key={label}><span>{index < 3 ? "✓" : index + 1}</span><em>{label}</em></li>)}</ol></nav>; }
function Provenance({ children, category }: { children: React.ReactNode; category: string }) { return <span className={`provenance ${category}`}>{children}</span>; }
function Evidence({ refs }: { refs: readonly string[] }) { return <div className="evidence-refs" aria-label="Evidence references">{refs.map((reference, index) => <code key={`${reference}-${index}`}>{reference}</code>)}</div>; }

function AdvisorCard({ review }: { review: AdvisorReview }) {
  const definition = EXABYTES_ADVISORS_1_0_0.find((item) => item.id === review.advisor)!;
  const list = (label: string, items: AdvisorReview["support"]) => <section><h4>{label}</h4>{items.length ? <ul>{items.map((item) => <li key={item.id}><p>{item.statement}</p><Evidence refs={item.evidenceRefs} /></li>)}</ul> : <p className="empty-state">None recorded.</p>}</section>;
  return <article className={`advisor-card advisor-${review.advisor}`}><header><div><p className="advisor-role">{definition.label}</p><h3>{review.headline}</h3></div><div className="advisor-badges"><span>{title(review.position)}</span><span className={review.origin}>{review.origin === "model" ? "Live model review" : "Deterministic fallback"}</span></div></header><p>{definition.objective}</p><p className="confidence">Confidence {Math.round(review.confidence * 100)}%</p>{list("Support", review.support)}{list("Concerns", review.concerns)}{list("Missing evidence", review.missingEvidence)}<section><h4>Advisory adjustments</h4>{review.adjustments.length ? <ul>{review.adjustments.map((item) => <li key={item.id}><p>{item.action}</p><Evidence refs={[item.targetRef, ...item.evidenceRefs]} /></li>)}</ul> : <p className="empty-state">No adjustment proposed.</p>}</section></article>;
}

function SynthesisPanel({ blueprint }: { blueprint: Blueprint }) {
  const groups = [
    ["Agreement", blueprint.synthesis.agreement, "agreement"], ["Disagreement", blueprint.synthesis.disagreement, "disagreement"], ["Conditions", blueprint.synthesis.conditions, "conditions"], ["Open questions", blueprint.synthesis.openQuestions, "questions"],
  ] as const;
  return <div className="synthesis-grid">{groups.map(([label, items, className]) => <section className={`synthesis-panel ${className}`} key={label}><h3>{label}</h3>{items.length ? <ul>{items.map((item) => <li key={item.topic}><strong>{title(item.topic)}</strong><p>{item.statement}</p><small>{item.advisorIds.map(title).join(" · ")}</small><Evidence refs={item.evidenceRefs} /></li>)}</ul> : <p className="empty-state">{label === "Disagreement" ? "No material disagreement detected" : `No ${label.toLowerCase()} recorded.`}</p>}</section>)}</div>;
}

function BlueprintReport({ blueprint }: { blueprint: Blueprint }) {
  const { twin, diagnostic, recommendations, comparison, selectedScenario: selected } = blueprint.snapshot;
  const origins = blueprint.advisorReviews.reduce((counts, review) => ({ ...counts, [review.origin]: (counts[review.origin] ?? 0) + 1 }), {} as Record<string, number>);
  return <div className="blueprint-layout"><aside className="contents-rail no-print"><strong>Blueprint contents</strong><nav aria-label="Blueprint sections">{sections.map(([anchor, label], index) => <a href={`#${anchor}`} key={anchor}><span>{String(index + 1).padStart(2, "0")}</span>{label}</a>)}</nav></aside><article className="blueprint-report">
    <section id="cover" className="report-cover"><p className="eyebrow">Digital & AI Transformation Blueprint</p><h1>{twin.identity.businessName}</h1><p>{selected.title} · 12-month transformation plan</p><dl><div><dt>Blueprint ID</dt><dd>{blueprint.id}</dd></div><div><dt>Generated</dt><dd>{new Date(blueprint.generatedAt).toLocaleString("en-MY", { dateStyle: "long", timeStyle: "short" })}</dd></div><div><dt>Version</dt><dd>{blueprint.modelVersion}</dd></div></dl></section>
    <section id="executive-summary"><p className="section-number">01</p><h2>Executive summary</h2><p>The selected {selected.title} path has a deterministic decision status of <strong>{title(blueprint.synthesis.decision)}</strong>. It preserves the accepted scenario scope and numeric results while adding five bounded specialist reviews.</p><p><Provenance category="calculated_rule">Calculated rule</Provenance> {origins.model ?? 0} live model review(s) and {origins.deterministic_fallback ?? 0} deterministic fallback review(s). Advisor language cannot alter costs, scores, ROI, schedule, recommendations, or Business Twin facts.</p></section>
    <section id="business-profile"><p className="section-number">02</p><h2>Business profile</h2><dl className="report-grid"><div><dt>Sector</dt><dd>{title(twin.identity.industry)}</dd></div><div><dt>Model</dt><dd>{twin.identity.businessModel.toUpperCase()}</dd></div><div><dt>Employees</dt><dd>{title(twin.identity.employeeBand)}</dd></div><div><dt>Objective</dt><dd>{title(twin.objectives[0]?.type ?? "unknown")}</dd></div><div><dt>Budget band</dt><dd>{title(twin.constraints.budgetBand)}</dd></div><div><dt>Implementation pace</dt><dd>{title(twin.constraints.implementationPace)}</dd></div></dl><Provenance category="user_fact">User fact</Provenance></section>
    <section id="maturity-readiness"><p className="section-number">03</p><h2>Digital maturity and AI readiness</h2><div className="score-pair"><article><strong>{diagnostic.digitalMaturity.value ?? "—"}</strong><span>Digital maturity · {diagnostic.digitalMaturity.bandLabel}</span></article><article><strong>{diagnostic.aiReadiness.value ?? "—"}</strong><span>AI readiness · {diagnostic.aiReadiness.bandLabel}</span></article></div><p>{diagnostic.digitalMaturity.improvementAction}</p><Provenance category="calculated_rule">Calculated rule · {diagnostic.id}</Provenance></section>
    <section id="pain-points"><p className="section-number">04</p><h2>Top five pain points</h2><ol className="report-list">{diagnostic.painPoints.slice(0, 5).map((pain) => <li key={pain.id}><strong>{pain.title}</strong><span>Priority {pain.priority}</span><p>{pain.mechanism}</p><Evidence refs={pain.evidenceIds} /></li>)}</ol></section>
    <section id="recommendations"><p className="section-number">05</p><h2>Recommended capabilities and mapped offerings</h2><div className="capability-list">{recommendations.recommendations.map((item) => <article key={item.capabilityId}><header><strong>{item.rank}. {item.title}</strong><span>{title(item.status)}</span></header><p>{item.outcome}</p>{item.mappedOffering ? <p><Provenance category="catalogue_fact">Catalogue fact</Provenance> {item.mappedOffering.name}: {item.mappedOffering.approvedFactSummary}</p> : null}<Evidence refs={item.evidenceIds.length ? item.evidenceIds : [recommendations.id]} /></article>)}</div></section>
    <section id="scenario-comparison"><p className="section-number">06</p><h2>Three-scenario comparison</h2><div className="report-scenarios">{comparison.scenarios.map((scenario) => <article key={scenario.id}><h3>{scenario.title}</h3><p>{range(scenario.costs.firstYear)}</p><dl><div><dt>Budget</dt><dd>{title(scenario.budgetFit)}</dd></div><div><dt>Net value</dt><dd>{scenario.value.net.status === "estimated" ? range(scenario.value.net.range) : "Not estimated"}</dd></div><div><dt>Payback base</dt><dd>{scenario.value.payback.status === "estimated" ? `${scenario.value.payback.base} months` : "Not estimated"}</dd></div></dl></article>)}</div><Provenance category="calculated_rule">Scenario and ROI Model {comparison.scenarioModelVersion}</Provenance></section>
    <section id="selected-plan"><p className="section-number">07</p><h2>Selected transformation plan</h2><h3>{selected.title}</h3><p>{selected.intent}</p><ul>{selected.interventions.map((item) => <li key={item.capabilityId}><strong>{item.title}</strong> — {title(item.commitment)}, month {item.startMonth} to {item.completionMonth}{item.status === "blocked" ? " (blocked pending prerequisites)" : ""}</li>)}</ul><Provenance category="scenario_assumption">Selected scenario · {selected.id}</Provenance></section>
    <section id="roi"><p className="section-number">08</p><h2>ROI assumptions, ranges, formulas, and exclusions</h2><div className="roi-highlight"><div><span>First-year cost · low/base/high</span><strong>{range(selected.costs.firstYear)}</strong></div><div><span>Operational value · low/base/high</span><strong>{selected.value.operational.status === "estimated" ? range(selected.value.operational.range) : "Not estimated"}</strong></div><div><span>Net value · low/base/high</span><strong>{selected.value.net.status === "estimated" ? range(selected.value.net.range) : "Not estimated"}</strong></div><div><span>Payback · best/base/worst</span><strong>{selected.value.payback.status === "estimated" ? `${selected.value.payback.best} / ${selected.value.payback.base} / ${selected.value.payback.worst} months` : "Not estimated"}</strong></div></div><p><strong>Budget fit:</strong> {title(selected.budgetFit)}. <strong>Revenue:</strong> {title(selected.value.revenue.status)}. <strong>Avoided risk:</strong> {title(selected.value.avoidedRisk.status)}.</p><details open><summary>Formulas and exclusions</summary><p>{selected.value.operational.formula}</p><p>{selected.value.revenue.formula}</p><p>{selected.value.avoidedRisk.formula}</p><p>{selected.value.net.formula}</p><ul>{selected.value.exclusions.map((item) => <li key={item}>{item}</li>)}</ul></details><Provenance category="scenario_assumption">Scenario assumptions</Provenance></section>
    <section id="roadmap"><p className="section-number">09</p><h2>Month-by-month roadmap</h2><div className="blueprint-timeline">{selected.months.map((month) => <article key={month.month}><strong>Month {month.month}</strong>{selected.interventions.filter((item) => item.startMonth === month.month).map((item) => <p key={item.capabilityId}>Start: {item.title}</p>)}{selected.interventions.filter((item) => item.completionMonth === month.month && item.commitment === "committed").map((item) => <p key={item.capabilityId}>Activate: {item.title}</p>)}<small>Owner: to be assigned by the business</small></article>)}</div></section>
    <section id="risks"><p className="section-number">10</p><h2>Risks, warnings, and prerequisites</h2>{selected.warnings.length ? <ul>{selected.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul> : <p className="empty-state">No additional deterministic warning is recorded.</p>}<ul>{selected.interventions.flatMap((item) => item.prerequisiteChecks.filter((check) => check.status !== "met").map((check) => <li key={`${item.capabilityId}-${check.ruleId}`}>{item.title}: {check.explanation}</li>))}</ul></section>
    <section id="advisor-reviews"><p className="section-number">11</p><h2>Five advisor reviews</h2><p>Distinct lenses challenge the selected plan. Each review discloses its origin and inspectable evidence references.</p><div className="advisor-grid">{blueprint.advisorReviews.map((review) => <AdvisorCard review={review} key={review.advisor} />)}</div></section>
    <section id="synthesis"><p className="section-number">12</p><h2>Agreement, disagreement, conditions, and missing evidence</h2><SynthesisPanel blueprint={blueprint} /></section>
    <section id="consultant-notes"><p className="section-number">13</p><h2>Consultant notes</h2><p className="empty-notes">No consultant notes have been added. This placeholder remains intentionally empty until a human consultant reviews the Blueprint.</p><Provenance category="human_note">Human note · empty</Provenance></section>
    <section id="methodology"><p className="section-number">14</p><h2>Evidence, provenance, versions, and methodology</h2><p>Deterministic code owns scores, rankings, scenario composition, schedules, costs, and ROI. Optional model output is schema-validated and evidence-bounded; invalid or unavailable output falls back per role.</p><dl className="versions"><div><dt>Twin</dt><dd>{twin.id} · rev {twin.revision} · {twin.schemaVersion}</dd></div><div><dt>Diagnostic</dt><dd>{diagnostic.id} · {diagnostic.scoreModelVersion}/{diagnostic.painModelVersion}</dd></div><div><dt>Recommendations</dt><dd>{recommendations.id} · {recommendations.recommendationModelVersion} · catalogue {recommendations.catalogueVersion}</dd></div><div><dt>Scenario</dt><dd>{comparison.id} · {comparison.scenarioModelVersion}/{comparison.roiModelVersion}</dd></div><div><dt>Advisor/Blueprint</dt><dd>{blueprint.synthesis.modelVersion}/{blueprint.modelVersion}</dd></div></dl><h3>Claim provenance</h3><ul>{blueprint.provenance.map((item) => <li key={item.claimId}><strong>{title(item.category)}</strong> · {item.sectionId}<Evidence refs={item.sourceRefs} /></li>)}</ul><h3>Model-call disclosure</h3><ul>{blueprint.modelCalls.map((call) => <li key={call.id}>{title(call.advisor)} · {title(call.status)} · {call.provider} · {call.model} · {call.latencyMs}ms · retry {call.retryCount}</li>)}</ul><h3>Limitations</h3><ul>{blueprint.limitations.map((item) => <li key={item}>{item}</li>)}</ul></section>
    <section id="consultation-preview"><p className="section-number">15</p><h2>Consultation preview</h2><p>A future consultation can use this evidence-linked Blueprint as a starting point. Consented contact capture and handoff arrive in Stage 06; this preview does not collect or send any personal information.</p></section>
    <footer className="report-footer">Blueprint {blueprint.id} · generated {blueprint.generatedAt} · model {blueprint.modelVersion}</footer>
  </article></div>;
}

function fallbackPanel(sources: Sources): AdvisorPanelResponse {
  const context = buildAdvisorReviewContext(sources.twin, sources.diagnostic, sources.recommendations, sources.comparison);
  const reviews = EXABYTES_ADVISORS_1_0_0.map((definition) => buildExabytesFallbackReview(definition, context, id("advisor")));
  const modelCalls = EXABYTES_ADVISORS_1_0_0.map((definition) => ({ id: id("modelcall"), advisor: definition.id, provider: "unavailable", model: "request_unavailable", promptVersion: "1.0.0", schemaVersion: "1.0.0", latencyMs: 0, retryCount: 0, status: "unavailable", evidenceIds: [], errorCategory: "configuration" }));
  return advisorPanelResponseSchema.parse({ reviews, modelCalls });
}

export function BlueprintView({ sources, initialBlueprint, initialNotice, onPersist }: { sources: Sources; initialBlueprint?: Blueprint; initialNotice?: string; onPersist?: (blueprint: Blueprint) => void }) {
  const [blueprint, setBlueprint] = useState(initialBlueprint); const [notice, setNotice] = useState(initialNotice); const [busy, setBusy] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, AdvisorStatus>>(() => Object.fromEntries(EXABYTES_ADVISORS_1_0_0.map((item) => [item.id, "ready"])));
  const generate = async () => {
    setBusy(true); setNotice(undefined); setStatuses(Object.fromEntries(EXABYTES_ADVISORS_1_0_0.map((item) => [item.id, "reviewing"])));
    const context = buildAdvisorReviewContext(sources.twin, sources.diagnostic, sources.recommendations, sources.comparison);
    let panel: AdvisorPanelResponse;
    try {
      const response = await fetch("/api/advisors/review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ context, advisorIds: EXABYTES_ADVISORS_1_0_0.map((item) => item.id) }) });
      if (!response.ok) throw new Error("review_unavailable"); panel = advisorPanelResponseSchema.parse(await response.json());
    } catch { panel = fallbackPanel(sources); setNotice("Live review was unavailable. Every role completed with the deterministic fallback."); }
    setStatuses(Object.fromEntries(panel.reviews.map((review) => [review.advisor, review.origin === "model" ? "live" : "fallback"])));
    const next = buildBlueprint({ ...sources, panel }, { id: () => id("blueprint"), now: () => new Date().toISOString() });
    setBlueprint(next); onPersist?.(next); setBusy(false);
  };
  return <><header className="topbar no-print"><Brand /><span className="save-status">✓ Saved on this device</span></header><JourneyRail /><main className="blueprint-shell"><header className="blueprint-hero no-print"><div><p className="eyebrow">{sources.twin.identity.businessName} · Advisor Panel</p><h1>Challenge the plan. Preserve the evidence.</h1><p>Five bounded advisors review the explicitly selected scenario. Live model review is optional; all numeric results remain deterministic.</p></div><div className="blueprint-toolbar"><Link className="button secondary" href="/scenarios">Back to scenarios</Link><button className="button secondary" type="button" onClick={generate} disabled={busy}>{blueprint ? "Regenerate review" : "Generate advisor review"}</button><button className="button primary" type="button" disabled={!blueprint || busy} onClick={() => window.print()}>Print / save as PDF</button></div></header>
    <section className="advisor-progress no-print" aria-live="polite"><h2>{busy ? "Advisor review in progress" : blueprint ? "Advisor review complete" : "Ready for advisor review"}</h2><p>Each role resolves to live or deterministic fallback in finite time.</p><ol>{EXABYTES_ADVISORS_1_0_0.map((advisor) => <li key={advisor.id}><span>{advisor.label}</span><strong className={statuses[advisor.id]}>{title(statuses[advisor.id])}</strong></li>)}</ol>{notice ? <p className="status-notice">{notice}</p> : null}</section>
    {!blueprint ? <section className="blueprint-empty no-print"><h2>No Blueprint has been generated</h2><p>The selected scenario is ready. Generation creates a new immutable, source-linked record; it does not change your assessment, recommendations, or scenario.</p><button className="button primary" type="button" onClick={generate} disabled={busy}>{busy ? "Reviewing five perspectives…" : "Generate advisor review and Blueprint"}</button></section> : <BlueprintReport blueprint={blueprint} />}
  </main></>;
}

export function BlueprintClient() {
  const router = useRouter(); const [loaded, setLoaded] = useState<{ sources: Sources; blueprint?: Blueprint; notice?: string }>();
  useEffect(() => {
    const assessment = loadAssessmentDraft(localStorage); if (assessment.status !== "ok" || assessment.draft.status !== "ready_for_review") { router.replace("/assessment"); return; }
    try {
      const twin = rebuildCurrentTwin(assessment.draft); const diagnostic = loadDiagnosticResult(localStorage, twin); if (diagnostic.status !== "ok") { router.replace("/assessment/analysis"); return; }
      const recommendations = loadRecommendationResult(localStorage, twin, diagnostic.result); if (recommendations.status !== "ok") { router.replace("/recommendations"); return; }
      const comparison = loadScenarioComparison(localStorage, twin, diagnostic.result, recommendations.result); if (comparison.status !== "ok") { router.replace("/scenarios"); return; }
      if (!comparison.result.selectedScenarioId) { setLoaded({ sources: { twin, diagnostic: diagnostic.result, recommendations: recommendations.result, comparison: comparison.result }, notice: "Choose a preferred scenario before generating a Blueprint." }); return; }
      const saved = loadBlueprint(localStorage, twin, diagnostic.result, recommendations.result, comparison.result);
      setLoaded({ sources: { twin, diagnostic: diagnostic.result, recommendations: recommendations.result, comparison: comparison.result }, blueprint: saved.status === "ok" ? saved.result : undefined, notice: saved.status === "discarded" ? `The previous Blueprint was ${saved.reason} and was safely discarded. Generate a new review when ready.` : undefined });
    } catch { router.replace("/scenarios"); }
  }, [router]);
  if (!loaded) return <main className="loading">Validating the selected scenario and source chain…</main>;
  if (!loaded.sources.comparison.selectedScenarioId) return <main className="missing-preference"><Brand /><h1>A preferred scenario is required</h1><p>{loaded.notice}</p><Link className="button primary" href="/scenarios">Return to scenarios</Link></main>;
  return <BlueprintView sources={loaded.sources} initialBlueprint={loaded.blueprint} initialNotice={loaded.notice} onPersist={(result) => saveBlueprint(localStorage, result)} />;
}
