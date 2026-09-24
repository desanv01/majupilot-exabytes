"use client";

/* eslint-disable react-hooks/set-state-in-effect -- versioned browser records are restored at this client boundary */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { rebuildCurrentTwin } from "@/core/assessment/rebuild-current-twin";
import { buildScenarioComparison, recalculateScenarioComparison } from "@/core/scenarios/build-scenarios";
import { editRangeAssumption, editSensitivitySeed } from "@/core/scenarios/edit-assumptions";
import { deriveAssumptions } from "@/core/scenarios/run-scenario";
import { EXABYTES_SCENARIO_RULES_1_0_0 } from "@/domain-packs/exabytes/scenario-templates";
import type { BusinessTwin } from "@/domain/business-twin";
import type { EstimateRange, ScenarioAssumptions, ScenarioComparison, ScenarioResult, ScenarioTemplateId } from "@/domain/scenarios";
import type { DiagnosticResult } from "@/domain/scoring";
import type { RecommendationResult } from "@/domain/recommendations";
import { loadAssessmentDraft } from "@/infrastructure/persistence/local-assessment-store";
import { loadDiagnosticResult } from "@/infrastructure/persistence/local-diagnostic-store";
import { loadRecommendationResult } from "@/infrastructure/persistence/local-recommendation-store";
import { loadScenarioComparison, saveScenarioComparison } from "@/infrastructure/persistence/local-scenario-store";

import { PostAssessmentShell } from "../diagnostics/post-assessment-shell";

type RangeGroup = "costs" | "operational" | "revenue" | "avoidedRisk";
type RangeBand = "low" | "base" | "high";
type AssumptionValue = {
  range: Record<RangeBand, number | null>;
  unit: string;
  source: string;
  sourceRef: string;
  rationale: string;
};

const bands = ["low", "base", "high"] as const;
const budgetLabels = { within_range: "Within range", base_within: "Base within", only_low_within: "Only low within", over: "Over budget", unknown: "Budget unknown" } as const;
const sourceLabels = { user_fact: "User fact", derived_user_fact: "Derived user fact", planning_default: "Planning default", user_override: "User override" } as const;
const scenarioNumbers: Record<ScenarioTemplateId, string> = { lean_foundation: "01", balanced_growth: "02", accelerated_ai: "03" };
const relevantTimelineEvents = new Set(["intervention_scheduled", "prerequisite_completed", "capability_activated", "milestone_delayed", "conditional_gate_blocked", "scenario_completed"]);

const safeText = (value: string) => value.replaceAll("—", "-").replaceAll("–", "-");
const title = (value: string) => safeText(value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()));
const formatMoney = (value: number) => {
  const formatted = new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR", maximumFractionDigits: 0 }).format(Math.abs(value));
  return value < 0 ? `-${formatted}` : formatted;
};
const pathKey = (template: ScenarioTemplateId, group: string, field: string, band: string) => `${template}.${group}.${field}.${band}`;
const displayPayback = (value: number) => value > 60 ? "More than 60 months" : `${value.toFixed(1)} months`;

const assumptionGroups = [
  { key: "costs", label: "Costs", description: "Implementation, training, and annual recurring planning costs.", fields: [["implementation", "Implementation"], ["training", "Training"], ["annualRecurring", "Annual recurring"]] },
  { key: "operational", label: "Operational value", description: "Manual effort, automatable share, adoption, and loaded hourly cost.", fields: [["manualHoursPerWeek", "Manual hours per week"], ["automatableShare", "Automatable share"], ["adoption", "Adoption"], ["loadedHourlyCost", "Loaded hourly cost"]] },
  { key: "revenue", label: "Revenue", description: "Optional addressable revenue, conversion change, and gross margin.", fields: [["addressableRevenue", "Addressable revenue"], ["conversionChange", "Conversion change"], ["grossMargin", "Gross margin"]] },
  { key: "avoidedRisk", label: "Avoided risk", description: "Optional incident probability, impact, and risk reduction.", fields: [["baselineIncidentProbability", "Baseline incident probability"], ["incidentImpact", "Incident impact"], ["riskReduction", "Risk reduction"]] },
] as const;

function getField(assumptions: ScenarioAssumptions, group: string, field: string): AssumptionValue {
  return (assumptions[group as keyof ScenarioAssumptions] as unknown as Record<string, AssumptionValue>)[field];
}

function draftValues(comparison: ScenarioComparison) {
  const values: Record<string, string> = {};
  for (const scenario of comparison.scenarios) {
    for (const group of assumptionGroups) {
      for (const [field] of group.fields) {
        for (const band of bands) {
          const value = getField(scenario.assumptions, group.key, field).range[band];
          values[pathKey(scenario.templateId, group.key, field, band)] = value === null ? "" : String(value);
        }
      }
    }
    values[`${scenario.templateId}.sensitivity.seed`] = String(scenario.assumptions.sensitivity.seed);
  }
  return values;
}

function RangeTriplet({ range, format = formatMoney, labels = ["Low", "Base", "High"] }: { range: EstimateRange; format?: (value: number) => string; labels?: readonly [string, string, string] }) {
  return <dl className="range-triplet">{bands.map((band, index) => <div key={band}><dt>{labels[index]}</dt><dd>{format(range[band])}</dd></div>)}</dl>;
}

function PaybackTriplet({ scenario }: { scenario: ScenarioResult }) {
  if (scenario.value.payback.status !== "estimated") return <p className="not-estimated">Not estimated</p>;
  const values = [scenario.value.payback.best, scenario.value.payback.base, scenario.value.payback.worst] as const;
  return <dl className="range-triplet payback-triplet">{values.map((value, index) => <div key={`${value}-${index}`}><dt>{["Best", "Base", "Worst"][index]}</dt><dd>{displayPayback(value)}</dd></div>)}</dl>;
}

function MetricBlock({ label, children, note }: { label: string; children: React.ReactNode; note?: string }) {
  return <section className="comparison-metric"><h3>{label}</h3>{children}{note ? <p>{note}</p> : null}</section>;
}

function ScenarioCard({ scenario, focused, preferred, onFocus, onPrefer }: { scenario: ScenarioResult; focused: boolean; preferred: boolean; onFocus: () => void; onPrefer: () => void }) {
  const conditional = scenario.interventions.filter((item) => item.commitment === "conditional");
  const committed = scenario.interventions.filter((item) => item.commitment === "committed");
  return (
    <article className={`scenario-path ${scenario.templateId} ${focused ? "is-focused" : ""} ${preferred ? "is-preferred" : ""}`} data-scenario={scenario.templateId} aria-current={focused ? "true" : undefined}>
      <header className="scenario-path-heading">
        <div className="path-number" aria-hidden="true">{scenarioNumbers[scenario.templateId]}</div>
        <div><p className="scenario-kicker">{scenario.riskLevel === "Higher change" ? "Higher change risk" : `${scenario.riskLevel} change risk`}</p><h2>{scenario.title}</h2><p>{safeText(scenario.intent)}</p></div>
        <div className="path-state" aria-live="polite">{preferred ? <strong className="preferred-state">Preferred path</strong> : null}{focused ? <span className="focus-state">Inspection focus</span> : <span>Available to inspect</span>}</div>
      </header>

      <dl className="scenario-path-glance" aria-label={`${scenario.title} key comparison values`}>
        <div><dt>First-year cost · base</dt><dd>{formatMoney(scenario.costs.firstYear.base)}</dd></div>
        <div><dt>Net value · base</dt><dd>{scenario.value.net.status === "estimated" ? formatMoney(scenario.value.net.range.base) : "Not estimated"}</dd></div>
        <div><dt>Payback · base</dt><dd>{scenario.value.payback.status === "estimated" ? displayPayback(scenario.value.payback.base) : "Not estimated"}</dd></div>
        <div><dt>Budget fit</dt><dd>{budgetLabels[scenario.budgetFit]}</dd></div>
      </dl>
      <details className="scenario-path-breakdown"><summary>Inspect full decision fields <span>Scope, timing, low/base/high ranges, exclusions, and confidence</span></summary>
      <MetricBlock label="Committed scope" note={`${committed.length} evidence-backed capabilities`}>
        <ul className="scope-list">{committed.map((item) => <li key={item.capabilityId}>{safeText(item.title)}</li>)}</ul>
        {conditional.length ? <div className="conditional-scope"><strong>Conditional scope, outside committed economics</strong>{conditional.map((item) => <p key={item.capabilityId}>{safeText(item.title)}</p>)}</div> : <p className="quiet-value">No conditional scope</p>}
      </MetricBlock>
      <MetricBlock label="Timing"><strong className="single-value">{safeText(scenario.timelineLabel)}</strong></MetricBlock>
      <MetricBlock label="First-year cost" note="Planning assumptions, not an Exabytes quote"><RangeTriplet range={scenario.costs.firstYear} /></MetricBlock>
      <MetricBlock label="Annual gross value">{scenario.value.gross.status === "estimated" ? <RangeTriplet range={scenario.value.gross.range} /> : <p className="not-estimated">Not estimated</p>}</MetricBlock>
      <MetricBlock label="Net-value range" note="Negative values are possible under conservative assumptions.">{scenario.value.net.status === "estimated" ? <RangeTriplet range={scenario.value.net.range} /> : <p className="not-estimated">Not estimated</p>}</MetricBlock>
      <MetricBlock label="Payback"><PaybackTriplet scenario={scenario} /></MetricBlock>
      <MetricBlock label="Budget fit"><strong className="single-value">{budgetLabels[scenario.budgetFit]}</strong></MetricBlock>
      <MetricBlock label="Confidence and exclusions"><strong className="single-value">{title(scenario.confidence)} confidence</strong><p>{scenario.value.exclusions.length ? `${scenario.value.exclusions.length} optional value streams excluded` : "No value streams excluded"}</p></MetricBlock>
      <MetricBlock label="Optional value streams"><dl className="optional-streams"><div><dt>Revenue</dt><dd>{scenario.value.revenue.status === "estimated" ? formatMoney(scenario.value.revenue.range.base) : "Not estimated"}</dd></div><div><dt>Avoided risk</dt><dd>{scenario.value.avoidedRisk.status === "estimated" ? formatMoney(scenario.value.avoidedRisk.range.base) : "Not estimated"}</dd></div></dl></MetricBlock>
      {scenario.costs.conditionalExpansionCost ? <MetricBlock label="Conditional expansion cost" note="Excluded while the gate is blocked"><RangeTriplet range={scenario.costs.conditionalExpansionCost} /></MetricBlock> : null}
      </details>

      <footer className="scenario-path-actions">
        <button className="button secondary inspect-action" type="button" onClick={onFocus} aria-pressed={focused}>{focused ? "Inspecting this path" : `Inspect ${scenario.title}`}</button>
        <button className="button select-action" type="button" onClick={onPrefer} aria-pressed={preferred}>{preferred ? "Preferred path selected" : `Select as preferred: ${scenario.title}`}</button>
      </footer>
    </article>
  );
}

function FinancialOutlook({ scenario }: { scenario: ScenarioResult }) {
  return (
    <section className="financial-outlook" aria-labelledby="financial-outlook-title">
      <header><p>Focused decision</p><h3 id="financial-outlook-title">12-month financial outlook</h3></header>
      <div className="financial-outlook-grid">
        <MetricBlock label="Committed first-year cost"><RangeTriplet range={scenario.costs.firstYear} /></MetricBlock>
        <MetricBlock label="Annual gross value">{scenario.value.gross.status === "estimated" ? <RangeTriplet range={scenario.value.gross.range} /> : <p className="not-estimated">Not estimated</p>}</MetricBlock>
        <MetricBlock label="Net value">{scenario.value.net.status === "estimated" ? <RangeTriplet range={scenario.value.net.range} /> : <p className="not-estimated">Not estimated</p>}</MetricBlock>
        <MetricBlock label="Payback"><PaybackTriplet scenario={scenario} /></MetricBlock>
      </div>
      <p className="cost-disclosure">Planning assumptions, not an Exabytes quote. Revenue and avoided risk remain Not estimated until every required input is supplied.</p>
    </section>
  );
}

function ScenarioTimeline({ scenario }: { scenario: ScenarioResult }) {
  return (
    <details className="scenario-schedule" aria-labelledby="scenario-schedule-title">
      <summary><span>Decision sequence</span><strong id="scenario-schedule-title">Inspect months 1 through 12</strong><small>Starts, activations, readiness events, and blocked gates from the scenario engine.</small></summary>
      <ol className="scenario-timeline" aria-label="12-month scenario timeline">
        {scenario.months.map((month) => {
          const events = scenario.events.filter((event) => event.month === month.month && relevantTimelineEvents.has(event.type));
          return <li key={month.month} data-month={month.month}><div className="month-marker"><span>{String(month.month).padStart(2, "0")}</span><strong>Month {month.month}</strong></div><div className="month-events">{events.length ? events.map((event) => <p key={event.id}><strong>{title(event.type)}</strong><span>{safeText(event.explanation)}</span></p>) : <p className="quiet-month">No scheduled change</p>}</div></li>;
        })}
      </ol>
    </details>
  );
}

function ReadinessAndCalculation({ scenario }: { scenario: ScenarioResult }) {
  const conditional = scenario.interventions.filter((item) => item.commitment === "conditional");
  return (
    <div className="decision-evidence-grid">
      <section className="readiness-panel">
        <p className="section-label">Dependencies and readiness</p><h3>What must be true</h3>
        {scenario.dependencies.length ? <ul>{scenario.dependencies.map((item) => <li key={`${item.capabilityId}-${item.dependsOnCapabilityId}`}><strong>{title(item.capabilityId)}</strong><span>Depends on {title(item.dependsOnCapabilityId)}. {safeText(item.policy)}</span></li>)}</ul> : <p>No cross-capability dependency applies to this path.</p>}
        {scenario.warnings.length ? <div className="readiness-warning"><strong>Current readiness notes</strong><ul>{scenario.warnings.map((warning) => <li key={warning}>{safeText(warning)}</li>)}</ul></div> : <p className="readiness-clear">All committed interventions pass their current prerequisite checks.</p>}
        {conditional.map((item) => <section className="conditional-gate" key={item.capabilityId}><strong>Blocked conditional gate: {safeText(item.title)}</strong><p>This capability and its economics remain outside the committed scenario.</p><ul>{item.prerequisiteChecks.map((check) => <li key={check.ruleId}><b>{title(check.status)}</b><span>{safeText(check.label)}. {safeText(check.explanation)}</span></li>)}</ul></section>)}
      </section>
      <section className="calculation-panel">
        <p className="section-label">Calculation explanation</p><h3>How the ranges are built</h3>
        <dl><div><dt>Implementation</dt><dd><RangeTriplet range={scenario.costs.implementation} /></dd></div><div><dt>Training</dt><dd><RangeTriplet range={scenario.costs.training} /></dd></div><div><dt>Annual recurring</dt><dd><RangeTriplet range={scenario.costs.annualRecurring} /></dd></div></dl>
        <details className="formula-disclosure"><summary>Inspect formulas and exclusions</summary><div><p><strong>Operational value</strong>{safeText(scenario.value.operational.formula)}</p><p><strong>Revenue</strong>{safeText(scenario.value.revenue.formula)}</p><p><strong>Avoided risk</strong>{safeText(scenario.value.avoidedRisk.formula)}</p><p><strong>Net value</strong>{safeText(scenario.value.net.formula)}</p><h4>Excluded from the headline ROI</h4><ul>{scenario.value.exclusions.map((item) => <li key={item}>{safeText(item)}</li>)}</ul></div></details>
      </section>
    </div>
  );
}

function ScenarioDetail({ scenario }: { scenario: ScenarioResult }) {
  return (
    <section className="scenario-detail-lab" aria-labelledby="scenario-detail-title" data-focused-scenario={scenario.templateId}>
      <header className="scenario-detail-heading"><div><p className="eyebrow">Inspection focus, not a saved preference</p><h2 id="scenario-detail-title">{scenario.title} decision detail</h2><p>{safeText(scenario.intent)}</p></div><dl><div><dt>Change risk</dt><dd>{scenario.riskLevel}</dd></div><div><dt>Budget fit</dt><dd>{budgetLabels[scenario.budgetFit]}</dd></div><div><dt>Confidence</dt><dd>{title(scenario.confidence)}</dd></div></dl></header>
      <FinancialOutlook scenario={scenario} />
      <ScenarioTimeline scenario={scenario} />
      <ReadinessAndCalculation scenario={scenario} />
    </section>
  );
}

function LiveResultSummary({ scenario }: { scenario: ScenarioResult }) {
  return (
    <aside className="live-result-summary" aria-live="polite" aria-label={`${scenario.title} live result summary`}>
      <header><p>Live result summary</p><h3>{scenario.title}</h3><span>Updates after every valid edit</span></header>
      <dl><div><dt>Gross value, base</dt><dd>{scenario.value.gross.status === "estimated" ? formatMoney(scenario.value.gross.range.base) : "Not estimated"}</dd></div><div><dt>First-year cost, base</dt><dd>{formatMoney(scenario.costs.firstYear.base)}</dd></div><div><dt>Net value, base</dt><dd>{scenario.value.net.status === "estimated" ? formatMoney(scenario.value.net.range.base) : "Not estimated"}</dd></div><div><dt>Payback, base</dt><dd>{scenario.value.payback.status === "estimated" ? displayPayback(scenario.value.payback.base) : "Not estimated"}</dd></div><div><dt>Confidence</dt><dd>{title(scenario.confidence)}</dd></div><div><dt>Budget fit</dt><dd>{budgetLabels[scenario.budgetFit]}</dd></div></dl>
      <section><strong>Exclusions</strong>{scenario.value.exclusions.length ? <ul>{scenario.value.exclusions.map((item) => <li key={item}>{safeText(item)}</li>)}</ul> : <p>None</p>}</section>
    </aside>
  );
}

function AssumptionGroup({ group, scenario, drafts, errors, open, onToggle, onChange }: { group: typeof assumptionGroups[number]; scenario: ScenarioResult; drafts: Record<string, string>; errors: Record<string, string>; open: boolean; onToggle: (open: boolean) => void; onChange: (key: string, value: string) => void }) {
  const optionalStatus = group.key === "revenue" ? scenario.value.revenue.status : group.key === "avoidedRisk" ? scenario.value.avoidedRisk.status : null;
  return (
    <details className={`assumption-section ${group.key}`} open={open} onToggle={(event) => onToggle(event.currentTarget.open)}>
      <summary><span><strong>{group.label}</strong><small>{group.description}</small></span>{optionalStatus === "not_estimated" ? <b>Not estimated</b> : <b>{group.fields.length} assumptions</b>}</summary>
      <fieldset><legend>{group.label} assumptions for {scenario.title}</legend>{group.fields.map(([field, label]) => {
        const value = getField(scenario.assumptions, group.key, field);
        return <div className="assumption-row" key={field} data-assumption={field}><div className="assumption-context"><strong className="assumption-label">{label}</strong><span className={`source-badge source-${value.source}`}>{sourceLabels[value.source as keyof typeof sourceLabels]}</span><details className="assumption-provenance"><summary>Source and rationale</summary><p><strong>Source:</strong> {safeText(value.sourceRef)}</p><p><strong>Rationale:</strong> {safeText(value.rationale)}</p></details></div><div className="range-inputs">{bands.map((band) => {
          const key = pathKey(scenario.templateId, group.key, field, band);
          const errorId = `${key}-error`;
          return <label key={band}><span>{title(band)}</span><span className="input-with-unit"><input name={key} aria-label={`${label} ${title(band)}`} aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? errorId : `${key}-unit`} inputMode="decimal" value={drafts[key] ?? ""} onChange={(event) => onChange(key, event.target.value)} /><small id={`${key}-unit`}>{value.unit}</small></span>{errors[key] ? <small className="field-error" id={errorId}>{errors[key]}</small> : null}</label>;
        })}</div></div>;
      })}</fieldset>
    </details>
  );
}

function SensitivityGroup({ scenario, drafts, errors, open, onToggle, onChange }: { scenario: ScenarioResult; drafts: Record<string, string>; errors: Record<string, string>; open: boolean; onToggle: (open: boolean) => void; onChange: (key: string, value: string) => void }) {
  const key = `${scenario.templateId}.sensitivity.seed`;
  return (
    <details className="assumption-section sensitivity" open={open} onToggle={(event) => onToggle(event.currentTarget.open)}>
      <summary><span><strong>Sensitivity trace</strong><small>A deterministic stress trace, separate from headline ROI.</small></span><b>Trace only</b></summary>
      <fieldset><legend>Sensitivity trace for {scenario.title}</legend><div className="assumption-row"><div className="assumption-context"><label htmlFor={`${scenario.templateId}-seed`}>Deterministic seed</label><span className={`source-badge source-${scenario.assumptions.sensitivity.source}`}>{sourceLabels[scenario.assumptions.sensitivity.source]}</span><p><strong>Source:</strong> {safeText(scenario.assumptions.sensitivity.sourceRef)}</p><p><strong>Rationale:</strong> {safeText(scenario.assumptions.sensitivity.rationale)}</p><p>Delay probability {scenario.assumptions.sensitivity.delayProbability}; maximum delay {scenario.assumptions.sensitivity.maximumDelayMonths} months; adoption variation +/-{scenario.assumptions.sensitivity.adoptionVariation}.</p></div><label className="seed-field"><span>Seed</span><input id={`${scenario.templateId}-seed`} name={key} inputMode="numeric" aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? `${key}-error` : undefined} value={drafts[key] ?? ""} onChange={(event) => onChange(key, event.target.value)} />{errors[key] ? <small className="field-error" id={`${key}-error`}>{errors[key]}</small> : null}</label></div></fieldset>
    </details>
  );
}

function AssumptionWorkbench({ scenario, drafts, errors, onChange, onReset }: { scenario: ScenarioResult; drafts: Record<string, string>; errors: Record<string, string>; onChange: (key: string, value: string) => void; onReset: () => void }) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ costs: true, operational: false, revenue: false, avoidedRisk: false, sensitivity: false });
  const [resetArmed, setResetArmed] = useState(false);
  const toggle = (key: string, open: boolean) => setOpenGroups((current) => ({ ...current, [key]: open }));
  return (
    <section className="assumptions-workbench" aria-labelledby="assumptions-title">
      <header className="workbench-heading"><div><p className="eyebrow">Assumptions workbench</p><h2 id="assumptions-title">Test the decision, not the arithmetic.</h2><p>Edit low, base, and high inputs for the focused path. Invalid text stays in the field while the last valid calculation remains visible.</p></div><p><strong>Focused path</strong><span>{scenario.title}</span></p></header>
      <div className="workbench-layout"><div className="assumption-editor">{assumptionGroups.map((group) => <AssumptionGroup key={group.key} group={group} scenario={scenario} drafts={drafts} errors={errors} open={openGroups[group.key] ?? false} onToggle={(open) => toggle(group.key, open)} onChange={onChange} />)}<SensitivityGroup scenario={scenario} drafts={drafts} errors={errors} open={openGroups.sensitivity} onToggle={(open) => toggle("sensitivity", open)} onChange={onChange} />
        <div className="reset-assumptions">{!resetArmed ? <button type="button" className="button secondary" onClick={() => setResetArmed(true)}>Reset focused path assumptions</button> : <div role="group" aria-label="Confirm assumption reset"><p>Reset {scenario.title} to Model 1.0.0 assumptions?</p><button type="button" className="button secondary" onClick={() => setResetArmed(false)}>Cancel</button><button type="button" className="button reset-confirm" onClick={() => { onReset(); setResetArmed(false); }}>Reset to Model 1.0.0</button></div>}</div>
      </div><LiveResultSummary scenario={scenario} /></div>
    </section>
  );
}

function RecoveryNotice({ status }: { status?: "empty" | "corrupt" | "incompatible" | "stale" }) {
  if (!status) return null;
  const copy = status === "empty" ? "A new comparison was built from your current recommendations." : `The ${status} saved comparison was removed and rebuilt from current evidence.`;
  return <p className="scenario-recovery" data-recovery-status={status} role="status">{copy}</p>;
}

export function ScenariosView({ initialResult, twin, diagnostic, recommendations, onPersist, recoveryStatus }: { initialResult: ScenarioComparison; twin: BusinessTwin; diagnostic: DiagnosticResult; recommendations: RecommendationResult; onPersist?: (result: ScenarioComparison) => void; recoveryStatus?: "empty" | "corrupt" | "incompatible" | "stale" }) {
  const [comparison, setComparison] = useState(initialResult);
  const [focusedId, setFocusedId] = useState<ScenarioTemplateId>("balanced_growth");
  const [drafts, setDrafts] = useState(() => draftValues(initialResult));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const focused = comparison.scenarios.find((item) => item.templateId === focusedId) ?? comparison.scenarios[1];
  const preferred = comparison.scenarios.find((item) => item.id === comparison.selectedScenarioId);
  const eventFactory = () => `event_${crypto.randomUUID().replaceAll("-", "").slice(0, 20)}`;
  const persist = (next: ScenarioComparison) => { onPersist?.(next); return next; };
  const edit = (key: string, value: string) => {
    setDrafts((current) => ({ ...current, [key]: value }));
    const [templateId, group, field, band] = key.split(".") as [ScenarioTemplateId, RangeGroup | "sensitivity", string, RangeBand | undefined];
    const target = comparison.scenarios.find((item) => item.templateId === templateId);
    if (!target) return;
    const parsed = key.endsWith(".sensitivity.seed") ? editSensitivitySeed(target.assumptions, value) : editRangeAssumption(target.assumptions, group as RangeGroup, field, band as RangeBand, value);
    if (!parsed.success) { setErrors((current) => ({ ...current, [key]: "Enter a valid value. Low must be no greater than base, and base no greater than high." })); return; }
    setErrors((current) => { const next = { ...current }; delete next[key]; return next; });
    const next = recalculateScenarioComparison(comparison, twin, recommendations, EXABYTES_SCENARIO_RULES_1_0_0, { [templateId]: parsed.data }, { now: () => new Date().toISOString(), eventId: eventFactory });
    setComparison(next);
    persist(next);
  };
  const reset = () => {
    const template = EXABYTES_SCENARIO_RULES_1_0_0.templates.find((item) => item.id === focusedId)!;
    const source = recommendations.recommendations.filter((item) => focused.interventions.some((intervention) => intervention.capabilityId === item.capabilityId));
    const committed = source.filter((item) => focused.interventions.find((intervention) => intervention.capabilityId === item.capabilityId)?.commitment === "committed");
    const conditional = source.filter((item) => !committed.includes(item));
    const model = deriveAssumptions(twin, template, committed, conditional, EXABYTES_SCENARIO_RULES_1_0_0);
    const next = recalculateScenarioComparison(comparison, twin, recommendations, EXABYTES_SCENARIO_RULES_1_0_0, { [focusedId]: model }, { now: () => new Date().toISOString(), eventId: eventFactory });
    setComparison(next);
    setDrafts(draftValues(next));
    setErrors((currentErrors) => Object.fromEntries(Object.entries(currentErrors).filter(([key]) => !key.startsWith(`${focusedId}.`))));
    persist(next);
  };
  const prefer = (scenario: ScenarioResult) => {
    const next = { ...comparison, selectedScenarioId: scenario.id, updatedAt: new Date().toISOString() };
    setComparison(next);
    persist(next);
  };
  const summary = `${recommendations.recommendations.length} recommendations | maturity ${diagnostic.digitalMaturity.value ?? "Not available"} | AI readiness ${diagnostic.aiReadiness.value ?? "Not available"}`;
  return (
    <PostAssessmentShell businessName={twin.identity.businessName} context="scenarios">
      <main id="main-content" className="scenario-lab-shell">
        <RecoveryNotice status={recoveryStatus} />
        <header className="scenario-lab-heading"><div><p className="eyebrow">Scenario and ROI Lab</p><h1>Choose a path with the evidence in view.</h1><p className="lead">Compare three transformation paths, inspect one in detail, then save a preferred direction for advisor review.</p></div><aside><strong>{twin.identity.businessName}</strong><span>Saved on this device</span><small>{summary}</small><small>Scenario Model {comparison.scenarioModelVersion} | ROI Model {comparison.roiModelVersion}</small></aside></header>
        <section className="comparison-command" aria-labelledby="comparison-title"><header className="comparison-command-heading"><div><p className="eyebrow">Three-path comparison</p><h2 id="comparison-title">Compare the same decision fields in the same order.</h2><p>Balanced Growth starts in inspection focus. Inspection does not save a preference.</p></div><div className={preferred ? "selection-readout has-selection" : "selection-readout"}><span>Saved preference</span><strong>{preferred?.title ?? "None selected"}</strong><small>{preferred ? "You can change this selection at any time." : "Select a path explicitly before Blueprint handoff."}</small></div></header><div className="scenario-command-grid">{comparison.scenarios.map((scenario) => <ScenarioCard key={scenario.id} scenario={scenario} focused={focusedId === scenario.templateId} preferred={comparison.selectedScenarioId === scenario.id} onFocus={() => setFocusedId(scenario.templateId)} onPrefer={() => prefer(scenario)} />)}</div></section>
        <ScenarioDetail scenario={focused} />
        <AssumptionWorkbench scenario={focused} drafts={drafts} errors={errors} onChange={edit} onReset={reset} />
        <section className="scenario-blueprint-handoff"><div><p className="eyebrow">Advisor review and Blueprint</p><h2>{preferred ? `${preferred.title} is your saved direction.` : "A preference has not been saved yet."}</h2><p>{preferred ? "Continue to generate an evidence-linked advisor review and Blueprint from this preferred path." : "Inspection focus is temporary. Select a preferred path before continuing to Blueprint."}</p></div><div><Link className="button secondary" href="/recommendations">Back to recommendations</Link>{preferred ? <Link className="button primary" href="/blueprint">Generate Advisor review and Blueprint</Link> : <span className="button disabled" aria-disabled="true">Select a preferred path first</span>}</div></section>
      </main>
    </PostAssessmentShell>
  );
}

export function ScenariosClient() {
  const router = useRouter();
  const [state, setState] = useState<{ twin: BusinessTwin; diagnostic: DiagnosticResult; recommendations: RecommendationResult; comparison: ScenarioComparison; recoveryStatus?: "empty" | "corrupt" | "incompatible" | "stale" }>();
  useEffect(() => {
    const assessment = loadAssessmentDraft(localStorage);
    if (assessment.status !== "ok" || assessment.draft.status !== "ready_for_review") { router.replace("/assessment"); return; }
    try {
      const twin = rebuildCurrentTwin(assessment.draft);
      const diagnostic = loadDiagnosticResult(localStorage, twin);
      if (diagnostic.status !== "ok") { router.replace("/assessment/analysis"); return; }
      const recommendations = loadRecommendationResult(localStorage, twin, diagnostic.result);
      if (recommendations.status !== "ok") { router.replace("/recommendations"); return; }
      const saved = loadScenarioComparison(localStorage, twin, diagnostic.result, recommendations.result);
      let eventSequence = 0;
      const comparison = saved.status === "ok" ? saved.result : buildScenarioComparison(twin, diagnostic.result, recommendations.result, EXABYTES_SCENARIO_RULES_1_0_0, { now: () => new Date().toISOString(), id: () => `scenario_${crypto.randomUUID().replaceAll("-", "").slice(0, 20)}`, eventId: () => `event_${crypto.randomUUID().replaceAll("-", "").slice(0, 16)}${String(++eventSequence).padStart(4, "0")}` });
      if (saved.status !== "ok") saveScenarioComparison(localStorage, comparison);
      const recoveryStatus = saved.status === "discarded" ? saved.reason : saved.status === "empty" ? "empty" : undefined;
      setState({ twin, diagnostic: diagnostic.result, recommendations: recommendations.result, comparison, recoveryStatus });
    } catch { router.replace("/recommendations"); }
  }, [router]);
  if (!state) return <PostAssessmentShell context="restoring-scenarios"><main id="main-content" className="scenario-restoring"><p className="eyebrow">Building comparison</p><h1>Preparing three reproducible paths.</h1><p>Current evidence, saved assumptions, and model versions are being checked locally.</p><div className="scenario-restoring-shape" aria-hidden="true"><span /><span /><span /></div></main></PostAssessmentShell>;
  return <ScenariosView initialResult={state.comparison} twin={state.twin} diagnostic={state.diagnostic} recommendations={state.recommendations} recoveryStatus={state.recoveryStatus} onPersist={(result) => saveScenarioComparison(localStorage, result)} />;
}
