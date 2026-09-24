"use client";

/* eslint-disable react-hooks/set-state-in-effect -- local versioned records are restored at the client boundary */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { rebuildCurrentTwin } from "@/core/assessment/rebuild-current-twin";
import { buildRecommendationResult } from "@/core/recommendations/build-recommendations";
import { EXABYTES_CATALOGUE_CURRENT } from "@/domain-packs/exabytes/catalogue";
import { EXABYTES_OFFERING_SELECTION_CURRENT } from "@/domain-packs/exabytes/offering-selection";
import { EXABYTES_RECOMMENDATION_RULE_PACK_1_0_0 } from "@/domain-packs/exabytes/recommendation-rules";
import type { BusinessTwin, Evidence } from "@/domain/business-twin";
import type { CapabilityRecommendation, RecommendationResult } from "@/domain/recommendations";
import type { DiagnosticResult } from "@/domain/scoring";
import { loadAssessmentDraft } from "@/infrastructure/persistence/local-assessment-store";
import { loadDiagnosticResult } from "@/infrastructure/persistence/local-diagnostic-store";
import { loadRecommendationResult, saveRecommendationResult } from "@/infrastructure/persistence/local-recommendation-store";

import { PostAssessmentShell } from "../diagnostics/post-assessment-shell";

const statusLabels = { why_now: "Why now", next: "Next", why_later: "Why later" } as const;
const componentLabels = {
  painPointFit: "Pain-point fit",
  prerequisiteReadiness: "Prerequisite readiness",
  budgetFit: "Budget fit",
  timeToValue: "Time to value",
  riskFit: "Risk fit",
  dataReadiness: "Data readiness",
} as const;
const evidenceLabels: Record<string, string> = {
  "q2.websiteOrStore": "Website or online store",
  "q2.businessEmail": "Business email",
  "q2.cloudProductivity": "Cloud productivity",
  "q2.crm": "CRM",
  "q2.digitalMarketingAnalytics": "Digital marketing and analytics",
  "q2.backup": "Backup",
  "q2.cybersecurityControls": "Cybersecurity controls",
  "q2.aiTools": "AI tools",
  "q3.biggestChallenge": "Biggest challenge",
  "q3.manualHoursPerWeek": "Manual hours per week",
  "q3.affectedEmployees": "Affected employees",
  "q3.urgency": "Urgency",
  "q4.primaryObjective": "Primary objective",
  "q4.implementationPace": "Implementation pace",
  "q4.highestConcern": "Highest concern",
  "q5.leadershipSponsorship": "Leadership sponsorship",
  "q5.usableData": "Usable data",
  "q5.employeeDigitalSkills": "Employee digital skills",
  "q5.processConsistency": "Process consistency",
  fu_manual_hours: "Estimated manual-work hours",
  fu_customer_records: "Customer-record location",
  fu_backup_frequency: "Backup frequency",
};
const valueLabels: Record<string, string> = {
  not_used: "Not used",
  informal: "Informal",
  active: "Active",
  unknown: "Not sure",
  messaging_apps: "Messaging apps",
  "11_20": "11-20 hours",
  none: "None",
  increase_revenue: "Increase revenue",
  customer_management: "Customer management",
  cost: "Cost",
};

const displayText = (value: string) => value.replaceAll("–", "-").replaceAll("—", "-");
const formatValue = (value: unknown) => value === null || value === undefined
  ? "Not sure"
  : Array.isArray(value)
    ? value.map((item) => displayText(String(item))).join(", ")
    : typeof value === "number"
      ? String(value)
      : displayText(valueLabels[String(value)] ?? String(value).replaceAll("_", " "));
const titleCase = (value: string) => displayText(value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()));
const offeringName = (id: string) => EXABYTES_CATALOGUE_CURRENT.offerings.find((item) => item.id === id)?.name ?? titleCase(id);
const formatVerifiedDate = (value: string) => new Intl.DateTimeFormat("en-MY", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
const scoreValue = (value: number | null) => value === null ? "Not available" : value.toFixed(1);

function EvidenceList({ twin, ids }: { twin: BusinessTwin; ids: readonly string[] }) {
  const wanted = new Set(ids);
  const evidence = twin.evidence.filter((item) => wanted.has(item.id));
  return evidence.length ? (
    <ul className="recommendation-evidence">
      {evidence.map((item: Evidence) => (
        <li key={item.id}>
          <span>{evidenceLabels[item.sourceRef] ?? "Recorded business fact"}</span>
          <strong>{formatValue(item.normalizedValue)}</strong>
          <code>{displayText(item.id)}</code>
        </li>
      ))}
    </ul>
  ) : <p>No supporting evidence is available.</p>;
}

function OfferingDetails({ recommendation }: { recommendation: CapabilityRecommendation }) {
  const offering = recommendation.mappedOffering;
  if (!offering) {
    return (
      <section className="mapping-unavailable" aria-label="Catalogue mapping unavailable">
        <p className="detail-kicker">Catalogue mapping</p>
        <h4>Capability guidance remains available</h4>
        <p>The capability decision is still valid, but no current catalogue offering passed the mapping rules. Consult Exabytes to confirm a suitable product.</p>
      </section>
    );
  }

  return (
    <section className="offering-detail" aria-label={`${offering.name} catalogue provenance`}>
      <header className="offering-heading">
        <div>
          <p className="detail-kicker">{offering.futureFit ? "Future-fit" : "Supported by"}</p>
          <h4>{displayText(offering.name)}</h4>
          <p>{displayText(offering.provider)}: {displayText(offering.name)}</p>
        </div>
        <span>Catalogue entry active</span>
      </header>
      <p className="catalogue-status-note">Active means this entry passed the current catalogue review. It is not a certification or endorsement.</p>
      <div className="catalogue-copy">
        <p><strong>Why it maps</strong>{displayText(offering.mappingReason)}</p>
        <p><strong>Approved fact summary</strong>{displayText(offering.approvedFactSummary)}</p>
      </div>
      <dl className="catalogue-meta">
        <div><dt>Catalogue version</dt><dd>{offering.catalogueVersion}</dd></div>
        <div><dt>Official source checked</dt><dd>{formatVerifiedDate(offering.verifiedAt)}</dd></div>
        <div><dt>Relative price</dt><dd>Tier {offering.relativeCostTier} of 4</dd></div>
        <div><dt>Quote notice</dt><dd>Verify current quote with Exabytes</dd></div>
        <div><dt>Offering ID</dt><dd>{offering.id}</dd></div>
        <div><dt>Classification</dt><dd>{offering.classification}</dd></div>
        <div><dt>Commercial path</dt><dd>{titleCase(offering.commercialStatus)}</dd></div>
        <div><dt>Selection rule</dt><dd>{offering.selectionRuleId}</dd></div>
      </dl>
      <div className="catalogue-source">
        <strong>{displayText(offering.sourceLabel)}</strong>
        <a href={offering.sourceUrl} target="_blank" rel="noopener noreferrer"><span>{displayText(offering.sourceUrl)}</span><b>Open official source</b></a>
      </div>
      {recommendation.alternativeOfferingIds.length ? (
        <p className="alternatives"><strong>Consultant-validated alternatives:</strong> {recommendation.alternativeOfferingIds.map(offeringName).join(", ")}. These catalogue entries are not ranked claims.</p>
      ) : <p className="alternatives"><strong>Catalogue alternatives:</strong> No active alternative is named by Catalogue {offering.catalogueVersion} for this mapping.</p>}
      <p className="limitation"><strong>Consultation limitation:</strong> Final suitability, plan details, availability, and terms require confirmation with Exabytes. This is not a purchase recommendation.</p>
    </section>
  );
}

function RecommendationDisclosure({ recommendation, twin, diagnostic, featured = false }: { recommendation: CapabilityRecommendation; twin: BusinessTwin; diagnostic: DiagnosticResult; featured?: boolean }) {
  const pains = diagnostic.painPoints.filter((pain) => recommendation.addressedPainPointIds.includes(pain.id));
  const offering = recommendation.mappedOffering;
  return (
    <details className={`recommendation-record ${recommendation.status}${featured ? " featured" : ""}`} data-capability-id={recommendation.capabilityId}>
      <summary>
        <span className="recommendation-rank"><small>Rank</small><strong>{recommendation.rank}</strong></span>
        <span className="recommendation-summary-copy">
          <span className="recommendation-status">{statusLabels[recommendation.status]}</span>
          <strong>{displayText(recommendation.title)}</strong>
          <span>{displayText(recommendation.outcome)}</span>
          {offering ? <small>{offering.futureFit ? "Future-fit" : "Supported by"}: {displayText(offering.name)}</small> : <small>Catalogue mapping unavailable</small>}
        </span>
        <span className="recommendation-fit"><strong>{recommendation.fitScore.toFixed(1)}</strong><small>Exact fit</small></span>
        <span className="recommendation-phase"><small>Roadmap phase</small><strong>{displayText(recommendation.roadmapPhase)}</strong></span>
        <span className="recommendation-inspect">Inspect decision</span>
      </summary>
      <div className="recommendation-detail">
        <section className="decision-explanation">
          <div><p className="detail-kicker">Why selected</p><h3>What the evidence supports</h3><p>{displayText(recommendation.whySelected)}</p></div>
          <div><p className="detail-kicker">{statusLabels[recommendation.status]}</p><h3>Why this timing</h3><p>{displayText(recommendation.whyNowOrLater)}</p></div>
        </section>

        <details className="recommendation-supporting-detail"><summary><span>Inspect fit calculation and delivery profile</span><small>Six component scores, formula, effort, cost, and time to value</small></summary><section className="fit-section">
          <header><div><p className="detail-kicker">Calculation</p><h3>Six exact fit components</h3></div><strong>{recommendation.fitScore.toFixed(1)} fit</strong></header>
          <code className="formula">fit = pain_point_fit * 0.30 + prerequisite_readiness * 0.20 + budget_fit * 0.15 + time_to_value * 0.15 + risk_fit * 0.10 + data_readiness * 0.10</code>
          <dl className="fit-components">
            {Object.entries(recommendation.componentScores).map(([key, score]) => (
              <div key={key}><dt>{componentLabels[key as keyof typeof componentLabels]}</dt><dd>{score.toFixed(1)} <span>out of 100</span></dd></div>
            ))}
          </dl>
        </section>

        <dl className="decision-meta" aria-label="Delivery profile">
          <div><dt>Roadmap phase</dt><dd>{displayText(recommendation.roadmapPhase)}</dd></div>
          <div><dt>Effort tier</dt><dd>{recommendation.effortTier} of 4</dd></div>
          <div><dt>Relative cost tier</dt><dd>{recommendation.relativeCostTier} of 4</dd></div>
          <div><dt>Time-to-value tier</dt><dd>{recommendation.timeToValueTier} of 4</dd></div>
        </dl></details>

        <section>
          <p className="detail-kicker">Readiness gate</p>
          <h3>Prerequisite checks</h3>
          {recommendation.prerequisites.length ? (
            <ul className="prerequisite-list">
              {recommendation.prerequisites.map((check) => (
                <li className={check.status} key={check.ruleId}>
                  <span className="prerequisite-state">{titleCase(check.status)}</span>
                  <div><strong>{displayText(check.label)}</strong><span>{displayText(check.explanation)}</span>{check.status !== "met" ? <em>Unlock: {displayText(check.unlockAction)}</em> : null}</div>
                </li>
              ))}
            </ul>
          ) : <p>No hard prerequisite is configured for this capability.</p>}
        </section>

        <section className="impact-evidence-grid">
          <div>
            <p className="detail-kicker">Business case</p>
            <h3>Addressed pain and expected impact</h3>
            {pains.length ? <ul className="addressed-pains">{pains.map((pain) => <li key={pain.id}><strong>{displayText(pain.title)}</strong><span>{displayText(pain.mechanism)}</span></li>)}</ul> : <p>This capability was selected from a directly assessed gap.</p>}
            <p><strong>Expected impact:</strong> {displayText(recommendation.expectedImpact)}</p>
            <p><strong>Risks to manage:</strong> {recommendation.risks.map(displayText).join(", ")}.</p>
          </div>
          <div>
            <p className="detail-kicker">Current evidence</p>
            <h3>Recorded facts used</h3>
            <EvidenceList twin={twin} ids={recommendation.evidenceIds} />
          </div>
        </section>

        <details className="recommendation-supporting-detail catalogue-disclosure"><summary><span>Inspect catalogue mapping and source</span><small>{offering ? `${displayText(offering.name)} · verified catalogue details` : "No current offering passed the mapping rules"}</small></summary><OfferingDetails recommendation={recommendation} /></details>
      </div>
    </details>
  );
}

export function RecommendationsView({ result, twin, diagnostic }: { result: RecommendationResult; twin: BusinessTwin; diagnostic: DiagnosticResult }) {
  const first = result.recommendations.find((item) => item.status === "why_now");
  const remaining = result.recommendations.filter((item) => item.capabilityId !== first?.capabilityId);
  const statusCounts = result.recommendations.reduce((counts, item) => ({ ...counts, [item.status]: counts[item.status] + 1 }), { why_now: 0, next: 0, why_later: 0 });

  return (
    <PostAssessmentShell businessName={twin.identity.businessName} context="recommendations">
      <main id="main-content" className="recommendations-shell">
        <header className="recommendations-heading">
          <div><p className="eyebrow">Capability decisions</p><h1>Your recommended sequence.</h1><p className="lead">Start with the strongest supported capability, then keep later work visible in the order the rules produced.</p></div>
          <Link className="recommendations-results-link" href="/results">Review full diagnosis</Link>
        </header>

        <section className="recommendations-snapshot" aria-label="Diagnostic handoff">
          <div><span>Digital maturity</span><strong>{scoreValue(diagnostic.digitalMaturity.value)}</strong><small>{diagnostic.digitalMaturity.bandLabel}</small></div>
          <div><span>AI readiness</span><strong>{scoreValue(diagnostic.aiReadiness.value)}</strong><small>{diagnostic.aiReadiness.bandLabel}</small></div>
          <div><span>Evidence confidence</span><strong>{diagnostic.digitalMaturity.confidence.toFixed(2)}</strong><small>{diagnostic.digitalMaturity.confidenceBand}</small></div>
          <p>Diagnostic context only. Products are shown after capabilities are ranked.</p>
        </section>

        {first ? (
          <section className="first-move" aria-labelledby="first-move-title">
            <header><div><p className="eyebrow">First move</p><h2 id="first-move-title">Lead with the highest-ranked decision.</h2></div><p>{statusCounts.why_now} Why now, {statusCounts.next} Next, {statusCounts.why_later} Why later</p></header>
            <RecommendationDisclosure recommendation={first} twin={twin} diagnostic={diagnostic} featured />
            <p className="capability-before-product">The capability is the recommendation. Any product mapping is subordinate catalogue evidence.</p>
          </section>
        ) : (
          <section className="recommendations-empty"><p className="eyebrow">No ranked decision</p><h2>More diagnostic evidence is needed.</h2><p>No capability decision was produced from the current evidence. Return to results before comparing scenarios.</p></section>
        )}

        {remaining.length ? (
          <section className="ordered-sequence" aria-labelledby="ordered-sequence-title">
            <header><p className="eyebrow">Ordered capability ledger</p><h2 id="ordered-sequence-title">Continue in canonical rule order.</h2><p>Every deferred capability stays visible with its blockers and unlock actions.</p></header>
            <ol start={2}>
              {remaining.map((recommendation, index) => {
                const previous = index === 0 ? first?.status : remaining[index - 1].status;
                const showStatusHeading = recommendation.status !== previous;
                return (
                  <li key={recommendation.capabilityId} value={recommendation.rank}>
                    {showStatusHeading ? <div className={`ledger-status-heading ${recommendation.status}`}><span>{statusLabels[recommendation.status]}</span><small>{recommendation.status === "next" ? "Build after the first moves" : "Keep visible until readiness improves"}</small></div> : null}
                    <RecommendationDisclosure recommendation={recommendation} twin={twin} diagnostic={diagnostic} />
                  </li>
                );
              })}
            </ol>
          </section>
        ) : null}

        <section className="catalogue-method" aria-label="Recommendation provenance">
          <div><p className="eyebrow">Decision provenance</p><h2>Rules first. Catalogue second.</h2></div>
          <dl><div><dt>Recommendation model</dt><dd>{result.recommendationModelVersion}</dd></div><div><dt>Catalogue</dt><dd>{result.catalogueVersion}</dd></div></dl>
          <p>The sequence comes from deterministic assessment and diagnostic rules. Catalogue entries only support an already-selected capability.</p>
        </section>

        {result.recommendations.length ? <section className="stage-four-panel">
          <div><p className="eyebrow">Compare next</p><h2>Compare transformation scenarios</h2><p>Compare Lean, Balanced, and Accelerated paths with explicit assumptions and ROI ranges. No scenario value is shown here.</p></div>
          <div className="inline-actions"><Link className="button secondary" href="/results">Back to results</Link><Link className="button primary" href="/scenarios">Compare transformation scenarios</Link></div>
        </section> : null}
      </main>
    </PostAssessmentShell>
  );
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
      const result = saved.status === "ok" ? saved.result : buildRecommendationResult(
        twin,
        diagnosticLoad.result,
        EXABYTES_RECOMMENDATION_RULE_PACK_1_0_0,
        EXABYTES_CATALOGUE_CURRENT,
        EXABYTES_OFFERING_SELECTION_CURRENT,
        { now: () => new Date().toISOString(), id: () => `recommendation_${crypto.randomUUID().replaceAll("-", "").slice(0, 20)}` },
      );
      if (saved.status !== "ok") saveRecommendationResult(localStorage, result);
      setState({ twin, diagnostic: diagnosticLoad.result, result });
    } catch { router.replace("/results"); }
  }, [router]);

  if (!state) return <PostAssessmentShell context="restoring"><main id="main-content" className="recommendations-restoring"><p className="eyebrow">Restoring decisions</p><h1>Preparing your capability sequence.</h1><p>Your current Business Twin, diagnosis, and saved recommendation are being checked locally.</p></main></PostAssessmentShell>;
  return <RecommendationsView {...state} />;
}
