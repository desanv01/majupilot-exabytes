"use client";

/* eslint-disable react-hooks/set-state-in-effect -- persisted records are restored at the client boundary */
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { beginTwinEdit } from "@/core/assessment/follow-ups";
import { rebuildCurrentTwin } from "@/core/assessment/rebuild-current-twin";
import type { AssessmentDraft } from "@/domain/assessment";
import type { BusinessTwin, Evidence } from "@/domain/business-twin";
import type { DiagnosticResult, MetricResult, PainPointResult } from "@/domain/scoring";
import { loadAssessmentDraft, saveAssessmentDraft } from "@/infrastructure/persistence/local-assessment-store";
import { clearDiagnosticResult, loadDiagnosticResult } from "@/infrastructure/persistence/local-diagnostic-store";

import { PostAssessmentShell } from "./post-assessment-shell";

const evidenceLabels: Record<string, string> = {
  "q2.websiteOrStore": "Website or online store",
  "q2.businessEmail": "Business email",
  "q2.cloudProductivity": "Cloud files or productivity suite",
  "q2.crm": "Customer relationship management (CRM)",
  "q2.digitalMarketingAnalytics": "Digital marketing or analytics",
  "q2.backup": "Backup",
  "q2.cybersecurityControls": "Cybersecurity controls",
  "q2.aiTools": "AI tools",
  "q3.biggestChallenge": "Biggest current challenge",
  "q3.manualHoursPerWeek": "Manual hours per week",
  "q3.affectedEmployees": "Affected employees",
  "q3.urgency": "Business urgency",
  "q4.primaryObjective": "Primary 12-month objective",
  "q4.implementationPace": "Desired implementation pace",
  "q4.highestConcern": "Highest concern",
  "q5.leadershipSponsorship": "Leadership sponsorship",
  "q5.usableData": "Usable data",
  "q5.employeeDigitalSkills": "Employee digital skills",
  "q5.processConsistency": "Process consistency",
  "fu_manual_hours": "Estimated manual-work hours",
  "fu_customer_records": "Where customer records are kept",
  "fu_backup_frequency": "Backup frequency",
};

const valueLabels: Record<string, string> = {
  not_used: "Not used",
  informal: "Informal",
  active: "Active",
  unknown: "Not sure",
  customer_management: "Customer management",
  lead_generation: "Lead generation",
  manual_work: "Manual work",
  team_collaboration: "Team collaboration",
  data_visibility: "Data visibility",
  security_continuity: "Security and continuity",
  scaling_operations: "Scaling operations",
  increase_revenue: "Increase revenue",
  acquire_customers: "Acquire customers",
  improve_retention: "Improve retention",
  reduce_cost: "Reduce cost",
  increase_productivity: "Increase productivity",
  strengthen_resilience: "Strengthen resilience",
  launch_ai_capability: "Launch an AI capability",
  within_30_days: "Within 30 days",
  "1_3_months": "1-3 months",
  "3_6_months": "3-6 months",
  "6_12_months": "6-12 months",
  messaging_apps: "Messaging apps",
  multiple_places: "Multiple places",
  accounting_system: "Accounting system",
  ad_hoc: "Ad hoc",
  "5_10": "5-10 hours",
  "11_20": "11-20 hours",
  "21_40": "21-40 hours",
  under_5: "Under 5 hours",
  over_40: "Over 40 hours",
};

const formatValue = (value: unknown, sourceRef: string) => {
  if (value === null || value === undefined) return "Not sure";
  if (Array.isArray(value)) return value.map((item) => valueLabels[String(item)] ?? String(item)).join(", ");
  if (typeof value === "number" && (sourceRef.startsWith("q5.") || sourceRef === "q3.urgency")) return `${value} of 5`;
  const fallback = String(value).replaceAll("_", " ");
  return valueLabels[String(value)] ?? `${fallback.charAt(0).toUpperCase()}${fallback.slice(1)}`;
};

const formatIdentifier = (value: string) => {
  if (value.toLowerCase() === "crm") return "CRM";
  const words = value.replaceAll("_", " ");
  return `${words.charAt(0).toUpperCase()}${words.slice(1)}`;
};

const confidenceLabel = (value: MetricResult["confidenceBand"]) => `${formatIdentifier(value)} confidence`;

function evidenceByIds(twin: BusinessTwin, ids: readonly string[]) {
  const wanted = new Set(ids);
  return twin.evidence.filter((item) => wanted.has(item.id));
}

function EvidenceList({ evidence }: { evidence: Evidence[] }) {
  return evidence.length ? (
    <ul className="evidence-list">
      {evidence.map((item) => (
        <li key={item.id}>
          <div className="evidence-fact">
            <span>{evidenceLabels[item.sourceRef] ?? "Recorded business fact"}</span>
            <strong>{formatValue(item.normalizedValue, item.sourceRef)}</strong>
          </div>
          <code>Evidence ID: {item.id}</code>
        </li>
      ))}
    </ul>
  ) : <p>No supporting evidence is available.</p>;
}

function MetricDetails({ title, metric, twin }: { title: string; metric: MetricResult; twin: BusinessTwin }) {
  return (
    <details className="explanation" data-metric-details={title.toLowerCase().replaceAll(" ", "-")}>
      <summary>Inspect {title.toLowerCase()} evidence and calculation</summary>
      <div className="explanation-grid">
        <section><h3>Contributing evidence</h3><EvidenceList evidence={evidenceByIds(twin, metric.evidenceIds)} /></section>
        <section className="missing"><h3>Missing evidence</h3>{metric.missingEvidence.length ? <ul>{metric.missingEvidence.map((item) => <li key={item}>{item}</li>)}</ul> : <p>No required evidence is missing.</p>}</section>
        <section><h3>Strongest factor</h3><p>{metric.strongestPositiveFactor}</p></section>
        <section className="limiting"><h3>Limiting factor</h3><p>{metric.largestLimitingFactor}</p></section>
        <section><h3>Confidence basis</h3><p>{metric.confidence.toFixed(2)} confidence. Available configured evidence weight is included, while unavailable inputs are excluded from the score.</p></section>
        <section><h3>Calculation details</h3><p>Rule version {metric.rulesVersion}. Scores are weighted and renormalized only across available evidence.</p></section>
        <section className="improvement"><h3>Improvement action</h3><p>{metric.improvementAction}</p></section>
      </div>
    </details>
  );
}

function ScorePanel({ title, description, metric, twin, tone }: { title: string; description: string; metric: MetricResult; twin: BusinessTwin; tone: "maturity" | "readiness" }) {
  const confidencePercent = Math.round(metric.confidence * 100);
  const confidenceStyle = { "--confidence": `${confidencePercent}%` } as CSSProperties;
  return (
    <section className={`score-panel ${tone}`}>
      <div className="score-panel-heading">
        <div><h2>{title}</h2><p>{description}</p></div>
        <span className="score-band">{metric.bandLabel}</span>
      </div>
      <div className="score-panel-value">
        <div className="score-number">
          <strong>{metric.value ?? "Not available"}</strong>
          {metric.value === null ? null : <span>out of 100</span>}
        </div>
        <div className="confidence-gauge" role="meter" aria-label={`${title} evidence confidence`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={confidencePercent} style={confidenceStyle}>
          <span>{metric.confidence.toFixed(2)}</span>
          <small>{confidenceLabel(metric.confidenceBand)}</small>
        </div>
      </div>
      <p className="score-explainer"><strong>Score</strong> shows the calculated capability level. <strong>Confidence</strong> shows how much configured evidence was available.</p>
      <MetricDetails title={title} metric={metric} twin={twin} />
    </section>
  );
}

function DimensionPanel({ title, metric, tone }: { title: string; metric: MetricResult; tone: "maturity" | "readiness" }) {
  return (
    <section className={`breakdown-panel ${tone}`}>
      <header><h2>{title}</h2><span>Score and evidence confidence</span></header>
      <div className="dimension-list">
        {metric.dimensions.map((dimension) => (
          <div className="dimension-row" key={dimension.id}>
            <div className="dimension-copy"><strong>{dimension.label}</strong><small>{Math.round(dimension.confidence * 100)}% evidence confidence</small></div>
            <div
              className={`score-track${dimension.score === null ? " unavailable" : ""}`}
              role="progressbar"
              aria-label={dimension.label}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={dimension.score ?? undefined}
              aria-valuetext={dimension.score === null ? "Unavailable" : `${dimension.score} out of 100`}
            >
              <span style={{ width: `${dimension.score ?? 0}%` }} />
            </div>
            <b>{dimension.score === null ? "Not available" : `${dimension.score}/100`}</b>
          </div>
        ))}
      </div>
    </section>
  );
}

function PainDetails({ pain, twin }: { pain: PainPointResult; twin: BusinessTwin }) {
  return (
    <details className="pain-detail" data-pain-id={pain.id}>
      <summary><span>{pain.title}</span><b>{pain.priority.toFixed(1)} priority</b></summary>
      <div className="pain-detail-body">
        <p>{pain.mechanism}</p>
        <dl className="component-grid">
          <div><dt>Impact</dt><dd>{pain.impact}/100</dd></div>
          <div><dt>Urgency</dt><dd>{pain.urgency}/100</dd></div>
          <div><dt>Strategic alignment</dt><dd>{pain.strategicAlignment}/100</dd></div>
          <div><dt>Confidence</dt><dd>{pain.confidence}/100</dd></div>
        </dl>
        <div className="pain-audit-grid">
          <p><strong>Affected capabilities</strong><span>{pain.affectedCapabilityIds.map(formatIdentifier).join(", ")}</span></p>
          <p><strong>Audit triggers</strong><span>{pain.triggerCodes.map(formatIdentifier).join(", ")}</span></p>
        </div>
        <section className="pain-evidence"><h3>Linked recorded evidence</h3><EvidenceList evidence={evidenceByIds(twin, pain.evidenceIds)} /></section>
      </div>
    </details>
  );
}

export function ResultsView({ result, twin, onEdit }: { result: DiagnosticResult; twin: BusinessTwin; onEdit: () => void }) {
  const gaps = [...result.digitalMaturity.dimensions, ...result.aiReadiness.dimensions]
    .filter((item) => item.score !== null)
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0) || b.weight - a.weight || a.id.localeCompare(b.id))
    .slice(0, 3);
  const missingCount = result.digitalMaturity.missingEvidence.length + result.aiReadiness.missingEvidence.length;
  const topPainPoints = result.painPoints.slice(0, 3);

  return (
    <PostAssessmentShell businessName={twin.identity.businessName} context="results">
      <main id="main-content" className="results-shell">
        <header className="results-heading">
          <div>
            <p className="eyebrow">Evidence-based diagnosis</p>
            <h1>Analysis and diagnostic results.</h1>
            <p className="lead">A deterministic view of {twin.identity.businessName}, calculated only from the recorded Business Twin.</p>
          </div>
          <button className="button secondary edit-twin" onClick={onEdit}>Edit Business Twin</button>
        </header>

        {missingCount ? (
          <p className="missing-notice" role="status">Some evidence is unavailable. It was excluded from scoring and lowers confidence instead of being treated as zero.</p>
        ) : null}

        <div className="score-grid">
          <ScorePanel title="Digital maturity" description="How consistently the business uses digital tools, processes, and data." metric={result.digitalMaturity} twin={twin} tone="maturity" />
          <ScorePanel title="AI readiness" description="How prepared the business is to adopt AI responsibly for useful work." metric={result.aiReadiness} twin={twin} tone="readiness" />
        </div>

        <div className="breakdown-grid">
          <DimensionPanel title="Six maturity dimensions" metric={result.digitalMaturity} tone="maturity" />
          <DimensionPanel title="Four readiness dimensions" metric={result.aiReadiness} tone="readiness" />
        </div>

        <div className="insight-grid">
          <section className="gaps-panel">
            <h2>Three largest gaps</h2>
            <p>These are the lowest available dimensions, not distances from an invented target.</p>
            {gaps.length ? <ol>{gaps.map((gap) => <li key={`${gap.id}-${gap.label}`}><span>{gap.label}</span><b>{gap.score}/100</b></li>)}</ol> : <p className="empty-finding">More recorded evidence is needed before a gap can be identified.</p>}
          </section>
          <section className="pain-overview">
            <h2>Top evidence-linked pain points</h2>
            <p>Ranked by the accepted impact, urgency, alignment, and confidence arithmetic.</p>
            {topPainPoints.length ? <ol>{topPainPoints.map((pain) => <li key={pain.id}><div><strong>{pain.title}</strong><span>{pain.mechanism}</span></div><b>{pain.priority.toFixed(1)}</b></li>)}</ol> : <p className="empty-finding">No pain point was emitted without valid linked evidence.</p>}
          </section>
        </div>

        <section className="all-findings">
          <header><div><h2>All triggered pain findings</h2><p>Open any finding to inspect components, audit triggers, affected capabilities, and linked recorded evidence.</p></div><span>{result.painPoints.length} triggered</span></header>
          {result.painPoints.length ? result.painPoints.map((pain) => <PainDetails key={pain.id} pain={pain} twin={twin} />) : <p className="empty-finding">No evidence-linked pain finding was emitted.</p>}
        </section>

        <footer className="results-footer">
          <div className="calculation-versions"><strong>Calculation versions</strong><span>Score {result.scoreModelVersion}</span><span>Pain {result.painModelVersion}</span></div>
          <div className="next-stage"><strong>Capability recommendations come next.</strong><span>The next stage will sequence capabilities without changing this diagnosis.</span></div>
          <div className="results-actions">
            <Link className="button primary" href="/recommendations">View recommendations</Link>
            <button className="button secondary" onClick={onEdit}>Edit Business Twin</button>
          </div>
        </footer>
      </main>
    </PostAssessmentShell>
  );
}

export function ResultsClient() {
  const router = useRouter();
  const [state, setState] = useState<{ draft: AssessmentDraft; twin: BusinessTwin; result: DiagnosticResult }>();

  useEffect(() => {
    const assessment = loadAssessmentDraft(localStorage);
    if (assessment.status !== "ok" || assessment.draft.status !== "ready_for_review") {
      router.replace("/assessment");
      return;
    }
    try {
      const twin = rebuildCurrentTwin(assessment.draft);
      const diagnostic = loadDiagnosticResult(localStorage, twin);
      if (diagnostic.status !== "ok") {
        router.replace("/assessment/analysis");
        return;
      }
      setState({ draft: assessment.draft, twin, result: diagnostic.result });
    } catch {
      router.replace("/assessment/analysis");
    }
  }, [router]);

  if (!state) {
    return (
      <PostAssessmentShell context="restoring">
        <main id="main-content" className="results-restoring" aria-live="polite" aria-busy="true">
          <p className="eyebrow">Restoring saved diagnosis</p>
          <h1>Bringing your validated results back into view.</h1>
          <div className="results-restoring-shape" aria-hidden="true"><span /><span /><span /></div>
        </main>
      </PostAssessmentShell>
    );
  }

  const edit = () => {
    const edited = beginTwinEdit(state.draft, 1, new Date().toISOString());
    saveAssessmentDraft(localStorage, edited);
    clearDiagnosticResult(localStorage);
    router.push("/assessment?step=1");
  };

  return <ResultsView result={state.result} twin={state.twin} onEdit={edit} />;
}
