"use client";

/* eslint-disable react-hooks/set-state-in-effect -- persisted records are restored at the client boundary */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { beginTwinEdit } from "@/core/assessment/follow-ups";
import { rebuildCurrentTwin } from "@/core/assessment/rebuild-current-twin";
import type { AssessmentDraft } from "@/domain/assessment";
import type { BusinessTwin, Evidence } from "@/domain/business-twin";
import type { DiagnosticResult, MetricResult, PainPointResult } from "@/domain/scoring";
import { loadAssessmentDraft, saveAssessmentDraft } from "@/infrastructure/persistence/local-assessment-store";
import { clearDiagnosticResult, loadDiagnosticResult } from "@/infrastructure/persistence/local-diagnostic-store";

import { Brand } from "../assessment/brand";
import { Progress } from "../assessment/progress";

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
  "1_3_months": "1–3 months",
  "3_6_months": "3–6 months",
  "6_12_months": "6–12 months",
  messaging_apps: "Messaging apps",
  multiple_places: "Multiple places",
  accounting_system: "Accounting system",
  ad_hoc: "Ad hoc",
  "5_10": "5–10 hours",
  "11_20": "11–20 hours",
  "21_40": "21–40 hours",
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
    <details className="explanation">
      <summary>Inspect {title.toLowerCase()} evidence and calculation</summary>
      <div className="explanation-grid">
        <section><h4>Contributing evidence</h4><EvidenceList evidence={evidenceByIds(twin, metric.evidenceIds)} /></section>
        <section className="missing"><h4>Missing evidence</h4>{metric.missingEvidence.length ? <ul>{metric.missingEvidence.map((item) => <li key={item}>{item}</li>)}</ul> : <p>No required evidence is missing.</p>}</section>
        <section><h4>Strongest factor</h4><p>{metric.strongestPositiveFactor}</p></section>
        <section className="limiting"><h4>Limiting factor</h4><p>{metric.largestLimitingFactor}</p></section>
        <section><h4>Calculation details</h4><p>Rule version {metric.rulesVersion}. Confidence is based on available configured evidence weight, with unavailable inputs excluded from scores.</p></section>
        <section><h4>Improvement action</h4><p>{metric.improvementAction}</p></section>
      </div>
    </details>
  );
}

function DimensionPanel({ title, metric, tone }: { title: string; metric: MetricResult; tone: "teal" | "blue" }) {
  return (
    <section className={`breakdown-card ${tone}`}>
      <header><h2>{title}</h2><span>/100</span></header>
      <div className="dimension-list">
        {metric.dimensions.map((dimension) => (
          <div className="dimension-row" key={dimension.id}>
            <div><strong>{dimension.label}</strong><small>{dimension.score === null ? "Unavailable" : `${Math.round(dimension.confidence * 100)}% evidence confidence`}</small></div>
            <div
              className="score-track"
              role="progressbar"
              aria-label={dimension.label}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={dimension.score ?? undefined}
              aria-valuetext={dimension.score === null ? "Unavailable" : `${dimension.score} out of 100`}
            >
              <span style={{ width: `${dimension.score ?? 0}%` }} />
            </div>
            <b>{dimension.score ?? "—"}</b>
          </div>
        ))}
      </div>
    </section>
  );
}

function PainDetails({ pain, twin }: { pain: PainPointResult; twin: BusinessTwin }) {
  return (
    <details className="pain-detail">
      <summary><span>{pain.title}</span><b>{pain.priority.toFixed(1)} priority</b></summary>
      <p>{pain.mechanism}</p>
      <dl className="component-grid">
        <div><dt>Impact</dt><dd>{pain.impact}</dd></div>
        <div><dt>Urgency</dt><dd>{pain.urgency}</dd></div>
        <div><dt>Strategic alignment</dt><dd>{pain.strategicAlignment}</dd></div>
        <div><dt>Confidence</dt><dd>{pain.confidence}</dd></div>
      </dl>
      <p><strong>Affected capabilities:</strong> {pain.affectedCapabilityIds.map(formatIdentifier).join(", ")}</p>
      <p><strong>Audit triggers:</strong> {pain.triggerCodes.map(formatIdentifier).join(", ")}</p>
      <EvidenceList evidence={evidenceByIds(twin, pain.evidenceIds)} />
    </details>
  );
}

export function ResultsView({ result, twin, onEdit }: { result: DiagnosticResult; twin: BusinessTwin; onEdit: () => void }) {
  const gaps = [...result.digitalMaturity.dimensions, ...result.aiReadiness.dimensions]
    .filter((item) => item.score !== null)
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0) || b.weight - a.weight || a.id.localeCompare(b.id))
    .slice(0, 3);
  const missingCount = result.digitalMaturity.missingEvidence.length + result.aiReadiness.missingEvidence.length;
  return (
    <>
      <header className="topbar"><Brand /><span className="save-status">✓ Saved on this device</span></header>
      <Progress step={5} />
      <main className="results-shell">
        <header className="results-hero">
          <div><p className="eyebrow">{twin.identity.businessName} results overview</p><h1>Your Business Assessment</h1><p className="lead">Here is how your business performs across digital maturity and AI readiness, based only on the evidence you provided.</p></div>
          <div className="hero-emblem" aria-hidden="true">◎</div>
        </header>
        {missingCount ? <p className="missing-notice">Some evidence is unavailable. It was excluded from scoring and lowers confidence rather than being treated as zero.</p> : null}
        <div className="metrics-grid">
          {([["Digital Maturity", result.digitalMaturity, "teal"], ["AI Readiness", result.aiReadiness, "blue"]] as const).map(([title, metric, tone]) => (
            <div className="metric-column" key={title}>
              <section className={`score-card ${tone}`}>
                <div><p>{title}</p><strong>{metric.value ?? "—"}<small>/100</small></strong></div>
                <div className="score-meta"><span>{metric.bandLabel}</span><span>{metric.confidence.toFixed(2)} confidence · {metric.confidenceBand}</span></div>
                <MetricDetails title={title} metric={metric} twin={twin} />
              </section>
              <DimensionPanel title={`${title} Breakdown`} metric={metric} tone={tone} />
            </div>
          ))}
        </div>
        <div className="insight-grid">
          <section className="gaps-card"><h2>Three largest gaps</h2><p>Lowest available dimensions under the canonical model.</p><ol>{gaps.map((gap) => <li key={`${gap.id}-${gap.label}`}><span>{gap.label}</span><b>{gap.score}/100</b></li>)}</ol></section>
          <section className="pain-card"><h2>Evidence-linked pain points</h2><p>Ranked with fixed impact, urgency, alignment, and confidence arithmetic.</p>{result.painPoints.slice(0, 3).map((pain) => <PainDetails key={pain.id} pain={pain} twin={twin} />)}</section>
        </div>
        <section className="all-findings"><h2>All triggered pain findings</h2><p>All findings are retained for auditability, including those outside the overview top three.</p>{result.painPoints.map((pain) => <PainDetails key={`all-${pain.id}`} pain={pain} twin={twin} />)}</section>
        <footer className="results-footer">
          <div><strong>Calculation versions</strong><span>Score {result.scoreModelVersion} · Pain {result.painModelVersion}</span></div>
          <div className="next-stage"><strong>Your capability sequence is ready</strong><span>Review why each capability belongs now, next, or later.</span></div>
          <Link className="button primary" href="/recommendations">View recommendations</Link>
          <button className="button secondary" onClick={onEdit}>Edit Business Twin</button>
        </footer>
      </main>
    </>
  );
}

export function ResultsClient() {
  const router = useRouter();
  const [state, setState] = useState<{ draft: AssessmentDraft; twin: BusinessTwin; result: DiagnosticResult }>();
  useEffect(() => {
    const assessment = loadAssessmentDraft(localStorage);
    if (assessment.status !== "ok" || assessment.draft.status !== "ready_for_review") { router.replace("/assessment"); return; }
    try {
      const twin = rebuildCurrentTwin(assessment.draft);
      const diagnostic = loadDiagnosticResult(localStorage, twin);
      if (diagnostic.status !== "ok") { router.replace("/assessment/analysis"); return; }
      setState({ draft: assessment.draft, twin, result: diagnostic.result });
    } catch { router.replace("/assessment/analysis"); }
  }, [router]);
  if (!state) return <main className="loading">Restoring your validated results…</main>;
  const edit = () => {
    const edited = beginTwinEdit(state.draft, 1, new Date().toISOString());
    saveAssessmentDraft(localStorage, edited);
    clearDiagnosticResult(localStorage);
    router.push("/assessment?step=1");
  };
  return <ResultsView result={state.result} twin={state.twin} onEdit={edit} />;
}
