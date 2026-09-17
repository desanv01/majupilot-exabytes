"use client";

/* eslint-disable react-hooks/set-state-in-effect -- local versioned records are restored at the client boundary */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { rebuildCurrentTwin } from "@/core/assessment/rebuild-current-twin";
import { buildRecommendationResult } from "@/core/recommendations/build-recommendations";
import { EXABYTES_CATALOGUE_1_0_0 } from "@/domain-packs/exabytes/catalogue";
import { EXABYTES_OFFERING_SELECTION_1_0_0 } from "@/domain-packs/exabytes/offering-selection";
import type { BusinessTwin, Evidence } from "@/domain/business-twin";
import type { CapabilityRecommendation, RecommendationResult } from "@/domain/recommendations";
import type { DiagnosticResult } from "@/domain/scoring";
import { loadAssessmentDraft } from "@/infrastructure/persistence/local-assessment-store";
import { loadDiagnosticResult } from "@/infrastructure/persistence/local-diagnostic-store";
import { loadRecommendationResult, saveRecommendationResult } from "@/infrastructure/persistence/local-recommendation-store";

import { Brand } from "../assessment/brand";
import { Progress } from "../assessment/progress";

const statusLabels = { why_now: "Why now", next: "Next", why_later: "Why later" } as const;
const componentLabels = { painPointFit: "Pain-point fit", prerequisiteReadiness: "Prerequisite readiness", budgetFit: "Budget fit", timeToValue: "Time to value", riskFit: "Risk fit", dataReadiness: "Data readiness" } as const;
const evidenceLabels: Record<string, string> = {
  "q2.websiteOrStore": "Website or online store", "q2.businessEmail": "Business email", "q2.cloudProductivity": "Cloud productivity", "q2.crm": "CRM",
  "q2.digitalMarketingAnalytics": "Digital marketing and analytics", "q2.backup": "Backup", "q2.cybersecurityControls": "Cybersecurity controls", "q2.aiTools": "AI tools",
  "q3.biggestChallenge": "Biggest challenge", "q3.manualHoursPerWeek": "Manual hours per week", "q3.affectedEmployees": "Affected employees", "q3.urgency": "Urgency",
  "q4.primaryObjective": "Primary objective", "q4.implementationPace": "Implementation pace", "q4.highestConcern": "Highest concern",
  "q5.leadershipSponsorship": "Leadership sponsorship", "q5.usableData": "Usable data", "q5.employeeDigitalSkills": "Employee digital skills", "q5.processConsistency": "Process consistency",
  fu_manual_hours: "Estimated manual-work hours", fu_customer_records: "Customer-record location", fu_backup_frequency: "Backup frequency",
};
const valueLabels: Record<string, string> = { not_used: "Not used", informal: "Informal", active: "Active", unknown: "Not sure", messaging_apps: "Messaging apps", "11_20": "11–20 hours", none: "None", increase_revenue: "Increase revenue", customer_management: "Customer management", cost: "Cost" };
const formatValue = (value: unknown) => value === null || value === undefined ? "Not sure" : Array.isArray(value) ? value.join(", ") : typeof value === "number" ? String(value) : valueLabels[String(value)] ?? String(value).replaceAll("_", " ");
const titleCase = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const offeringName = (id: string) => EXABYTES_CATALOGUE_1_0_0.offerings.find((item) => item.id === id)?.name ?? titleCase(id);
const formatVerifiedDate = (value: string) => new Intl.DateTimeFormat("en-MY", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));

function EvidenceList({ twin, ids }: { twin: BusinessTwin; ids: readonly string[] }) {
  const wanted = new Set(ids);
  const evidence = twin.evidence.filter((item) => wanted.has(item.id));
  return evidence.length ? <ul className="recommendation-evidence">{evidence.map((item: Evidence) => <li key={item.id}><span>{evidenceLabels[item.sourceRef] ?? "Recorded business fact"}</span><strong>{formatValue(item.normalizedValue)}</strong><code>{item.id}</code></li>)}</ul> : <p>No supporting evidence is available.</p>;
}

function OfferingDetails({ recommendation }: { recommendation: CapabilityRecommendation }) {
  const offering = recommendation.mappedOffering;
  if (!offering) return <section className="mapping-unavailable"><h4>Current offering fit</h4><p>Consult Exabytes for a current fit. The capability advice remains valid, but catalogue mapping failed closed.</p></section>;
  return <section className="offering-detail" aria-label={`${offering.name} catalogue evidence`}>
    <div className="offering-heading"><div><p className="micro-label">{offering.futureFit ? "Future-fit catalogue option" : "Supported by"}</p><h4>{offering.name}</h4><p>{offering.provider}: {offering.name}</p></div><span>Catalogue entry active</span></div>
    <p><strong>Why it maps:</strong> {offering.mappingReason}</p>
    <p><strong>Approved fact summary:</strong> {offering.approvedFactSummary}</p>
    <dl className="catalogue-meta"><div><dt>Catalogue</dt><dd>{offering.catalogueVersion}</dd></div><div><dt>Source checked</dt><dd>{formatVerifiedDate(offering.verifiedAt)}</dd></div><div><dt>Pricing</dt><dd>Verify current quote with Exabytes</dd></div></dl>
    <a className="button secondary source-link" href={offering.sourceUrl} target="_blank" rel="noopener noreferrer">Open official source ↗</a>
    {recommendation.alternativeOfferingIds.length ? <p className="alternatives"><strong>Consultant-validated alternatives:</strong> {recommendation.alternativeOfferingIds.map(offeringName).join(", ")}. These are not ranked claims.</p> : null}
    <p className="limitation"><strong>Consultation limitation:</strong> Final suitability, plan details, availability, and terms require confirmation with Exabytes. This is not a purchase recommendation.</p>
  </section>;
}

function RecommendationDetail({ recommendation, twin, diagnostic }: { recommendation: CapabilityRecommendation; twin: BusinessTwin; diagnostic: DiagnosticResult }) {
  const pains = diagnostic.painPoints.filter((pain) => recommendation.addressedPainPointIds.includes(pain.id));
  return <details className={`recommendation-card ${recommendation.status}`}>
    <summary>
      <span className="rank">{recommendation.rank}</span>
      <span className="recommendation-summary"><span className="status-chip">{statusLabels[recommendation.status]}</span><strong>{recommendation.title}</strong><span>{recommendation.outcome}</span>{recommendation.mappedOffering ? <small>{recommendation.mappedOffering.futureFit ? "Future-fit" : "Supported by"} · {recommendation.mappedOffering.name}</small> : <small>Offering mapping unavailable</small>}</span>
      <span className="fit"><strong>{recommendation.fitScore.toFixed(1)}</strong><small>fit</small></span>
      <span className="disclosure-label">Details</span>
    </summary>
    <div className="recommendation-detail">
      <section className="decision-explanation"><div><h3>Why selected</h3><p>{recommendation.whySelected}</p></div><div><h3>{statusLabels[recommendation.status]}</h3><p>{recommendation.whyNowOrLater}</p></div></section>
      <section><h3>Six fit components</h3><p className="section-note">Fit = pain 30% + prerequisites 20% + budget 15% + time 15% + risk 10% + data 10%.</p><dl className="fit-components">{Object.entries(recommendation.componentScores).map(([key, score]) => <div key={key}><dt>{componentLabels[key as keyof typeof componentLabels]}</dt><dd>{score.toFixed(1)}</dd><span className="component-track"><i style={{ width: `${score}%` }} /></span></div>)}</dl></section>
      <div className="decision-meta"><div><span>Roadmap phase</span><strong>{recommendation.roadmapPhase}</strong></div><div><span>Effort tier</span><strong>{recommendation.effortTier} of 4</strong></div><div><span>Relative cost tier</span><strong>{recommendation.relativeCostTier} of 4</strong></div><div><span>Time-to-value tier</span><strong>{recommendation.timeToValueTier} of 4</strong></div></div>
      <section><h3>Prerequisite checks</h3>{recommendation.prerequisites.length ? <ul className="prerequisite-list">{recommendation.prerequisites.map((check) => <li className={check.status} key={check.ruleId}><strong>{check.status === "met" ? "✓" : "!"} {check.label}</strong><span>{check.explanation}</span>{check.status !== "met" ? <em>Unlock: {check.unlockAction}</em> : null}</li>)}</ul> : <p>No hard prerequisite is configured for this capability.</p>}</section>
      <section><h3>Addressed pain and expected impact</h3>{pains.length ? <ul>{pains.map((pain) => <li key={pain.id}><strong>{pain.title}</strong> — {pain.mechanism}</li>)}</ul> : <p>This was selected from a directly assessed gap.</p>}<p><strong>Expected impact:</strong> {recommendation.expectedImpact}</p><p><strong>Risks to manage:</strong> {recommendation.risks.join(", ")}.</p></section>
      <section><h3>Current supporting evidence</h3><EvidenceList twin={twin} ids={recommendation.evidenceIds} /></section>
      <OfferingDetails recommendation={recommendation} />
    </div>
  </details>;
}

export function RecommendationsView({ result, twin, diagnostic }: { result: RecommendationResult; twin: BusinessTwin; diagnostic: DiagnosticResult }) {
  const groups = (["why_now", "next", "why_later"] as const).map((status) => ({ status, items: result.recommendations.filter((item) => item.status === status) }));
  return <>
    <header className="topbar"><Brand /><span className="save-status">✓ Saved on this device</span></header>
    <Progress step={5} />
    <main className="recommendations-shell">
      <header className="recommendations-hero"><div><p className="eyebrow">{twin.identity.businessName} · capability decisions</p><h1>Your Recommendations</h1><p className="lead">A capability-first sequence based on your assessment evidence, diagnostic rules, capacity, and readiness.</p></div><div className="snapshot" aria-label="Assessment snapshot"><p>Assessment snapshot</p><div><span><strong>{diagnostic.digitalMaturity.value ?? "—"}</strong><small>Digital maturity</small></span><span><strong>{diagnostic.aiReadiness.value ?? "—"}</strong><small>AI readiness</small></span><span><strong>{diagnostic.digitalMaturity.confidenceBand}</strong><small>Confidence · {diagnostic.digitalMaturity.confidence.toFixed(2)}</small></span></div></div></header>
      <section className="sequence-intro"><div><p className="eyebrow">Recommended capability decisions</p><h2>Act in the right order</h2><p>Products appear only after the underlying business capability is selected and ranked.</p></div><p className="version-badge">Recommendation {result.recommendationModelVersion}<br />Catalogue {result.catalogueVersion}</p></section>
      <div className="recommendation-groups">{groups.map((group) => <section className={`recommendation-group ${group.status}`} key={group.status} aria-labelledby={`${group.status}-title`}><header><div><p className="group-kicker">{group.status === "why_now" ? "Start here" : group.status === "next" ? "Build next" : "Keep visible"}</p><h2 id={`${group.status}-title`}>{statusLabels[group.status]}</h2></div><span>{group.items.length} {group.items.length === 1 ? "decision" : "decisions"}</span></header>{group.items.length ? group.items.map((item) => <RecommendationDetail key={item.capabilityId} recommendation={item} twin={twin} diagnostic={diagnostic} />) : <p className="empty-group">No capability falls in this group for the current evidence.</p>}</section>)}</div>
      <section className="stage-four-panel"><div><p className="eyebrow">Next step, not yet generated</p><h2>Scenario and ROI comparison comes in Stage 04</h2><p>This screen contains no scenario projections, savings, ROI calculation, purchase action, or contact form.</p></div><Link className="button secondary" href="/results">Back to results</Link></section>
    </main>
  </>;
}

export function RecommendationsClient() {
  const router = useRouter();
  const [state, setState] = useState<{ twin: BusinessTwin; diagnostic: DiagnosticResult; result: RecommendationResult }>();
  useEffect(() => {
    const assessment = loadAssessmentDraft(localStorage);
    if (assessment.status !== "ok" || assessment.draft.status !== "ready_for_review") { router.replace("/assessment"); return; }
    try {
      const twin = rebuildCurrentTwin(assessment.draft);
      const diagnosticLoad = loadDiagnosticResult(localStorage, twin);
      if (diagnosticLoad.status !== "ok") { router.replace("/assessment/analysis"); return; }
      const saved = loadRecommendationResult(localStorage, twin, diagnosticLoad.result);
      const result = saved.status === "ok" ? saved.result : buildRecommendationResult(twin, diagnosticLoad.result, EXABYTES_CATALOGUE_1_0_0, EXABYTES_OFFERING_SELECTION_1_0_0, { now: () => new Date().toISOString(), id: () => `recommendation_${crypto.randomUUID().replaceAll("-", "").slice(0, 20)}` });
      if (saved.status !== "ok") saveRecommendationResult(localStorage, result);
      setState({ twin, diagnostic: diagnosticLoad.result, result });
    } catch { router.replace("/results"); }
  }, [router]);
  if (!state) return <main className="loading">Preparing your capability sequence…</main>;
  return <RecommendationsView {...state} />;
}
