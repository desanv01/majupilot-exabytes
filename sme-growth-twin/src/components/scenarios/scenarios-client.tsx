"use client";

/* eslint-disable react-hooks/set-state-in-effect -- versioned browser records are restored at this client boundary */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { rebuildCurrentTwin } from "@/core/assessment/rebuild-current-twin";
import { buildScenarioComparison, recalculateScenarioComparison } from "@/core/scenarios/build-scenarios";
import { deriveAssumptions } from "@/core/scenarios/run-scenario";
import { EXABYTES_SCENARIO_RULES_1_0_0 } from "@/domain-packs/exabytes/scenario-templates";
import type { BusinessTwin } from "@/domain/business-twin";
import { scenarioAssumptionsSchema, type EstimateRange, type ScenarioAssumptions, type ScenarioComparison, type ScenarioResult, type ScenarioTemplateId } from "@/domain/scenarios";
import type { DiagnosticResult } from "@/domain/scoring";
import type { RecommendationResult } from "@/domain/recommendations";
import { loadAssessmentDraft } from "@/infrastructure/persistence/local-assessment-store";
import { loadDiagnosticResult } from "@/infrastructure/persistence/local-diagnostic-store";
import { loadRecommendationResult } from "@/infrastructure/persistence/local-recommendation-store";
import { loadScenarioComparison, saveScenarioComparison } from "@/infrastructure/persistence/local-scenario-store";

import { Brand } from "../assessment/brand";

const formatMoney = (value: number) => new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR", maximumFractionDigits: 0 }).format(value);
const formatRange = (range: EstimateRange) => `${formatMoney(range.low)} / ${formatMoney(range.base)} / ${formatMoney(range.high)}`;
const budgetLabels = { within_range: "Within range", base_within: "Base within", only_low_within: "Only low within", over: "Over budget", unknown: "Budget unknown" } as const;
const title = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const pathKey = (template: ScenarioTemplateId, group: string, field: string, band: string) => `${template}.${group}.${field}.${band}`;
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

function JourneyRail() {
  return <nav className="journey-rail" aria-label="Growth Twin journey"><ol>{["Discover", "Diagnose", "Compare", "Blueprint"].map((label, index) => <li className={index < 2 ? "done" : index === 2 ? "current" : ""} key={label}><span>{index < 2 ? "✓" : index + 1}</span><em>{label}</em></li>)}</ol></nav>;
}

function Metric({ label, children }: { label: string; children: React.ReactNode }) { return <div className="scenario-metric"><dt>{label}</dt><dd>{children}</dd></div>; }
function StreamValue({ result, kind }: { result: ScenarioResult; kind: "revenue" | "avoidedRisk" }) {
  const stream = result.value[kind];
  return stream.status === "estimated" ? <span>{formatRange(stream.range)}</span> : <span>Not estimated</span>;
}

function ScenarioCard({ scenario, focused, preferred, onFocus, onPrefer }: { scenario: ScenarioResult; focused: boolean; preferred: boolean; onFocus: () => void; onPrefer: () => void }) {
  const conditional = scenario.interventions.filter((item) => item.commitment === "conditional");
  const committed = scenario.interventions.filter((item) => item.commitment === "committed");
  return <article className={`scenario-card ${scenario.templateId} ${focused ? "focused" : ""}`} aria-label={`${scenario.title} scenario`}>
    <header><div><p className="scenario-kicker">{scenario.riskLevel} risk</p><h2>{scenario.title}</h2><p>{scenario.intent}</p></div>{preferred ? <span className="preferred-chip">Preferred</span> : null}</header>
    <dl className="scenario-metrics"><Metric label="Timeline">{scenario.timelineLabel}</Metric><Metric label="Budget fit">{budgetLabels[scenario.budgetFit]}</Metric><Metric label="First-year cost">{formatRange(scenario.costs.firstYear)}</Metric><Metric label="Annual gross value">{scenario.value.gross.status === "estimated" ? formatRange(scenario.value.gross.range) : "Not estimated"}</Metric><Metric label="Net-value range">{scenario.value.net.status === "estimated" ? formatRange(scenario.value.net.range) : "Not estimated"}</Metric><Metric label="Payback">{scenario.value.payback.status === "estimated" ? `${scenario.value.payback.best} / ${scenario.value.payback.base} / ${scenario.value.payback.worst} months` : "Not estimated"}</Metric><Metric label="Confidence">{title(scenario.confidence)}</Metric><Metric label="Exclusions">{scenario.value.exclusions.length ? `${scenario.value.exclusions.length} value streams` : "None"}</Metric><Metric label="Revenue"><StreamValue result={scenario} kind="revenue" /></Metric><Metric label="Avoided risk"><StreamValue result={scenario} kind="avoidedRisk" /></Metric></dl>
    <section className="scenario-scope"><h3>Committed scope · {committed.length}</h3><ul>{committed.map((item) => <li key={item.capabilityId}>{item.title}</li>)}</ul>{conditional.length ? <div className="conditional-scope"><strong>Conditional · excluded from committed ROI</strong>{conditional.map((item) => <p key={item.capabilityId}>{item.title}<br /><small>Expansion cost: {scenario.costs.conditionalExpansionCost ? formatRange(scenario.costs.conditionalExpansionCost) : "—"}</small></p>)}</div> : null}</section>
    <p className="quote-note">Planning assumptions — not an Exabytes quote.</p>
    <div className="scenario-actions"><button className="button secondary" type="button" onClick={onFocus}>{focused ? "Viewing details" : "View scenario details"}</button><button className="button primary" type="button" onClick={onPrefer}>{preferred ? "Preferred scenario" : "Select as preferred"}</button></div>
  </article>;
}

const assumptionGroups = [
  { key: "costs", label: "Costs", fields: [["implementation", "Implementation"], ["training", "Training"], ["annualRecurring", "Annual recurring"]] },
  { key: "operational", label: "Operational value", fields: [["manualHoursPerWeek", "Manual hours per week"], ["automatableShare", "Automatable share"], ["adoption", "Adoption"], ["loadedHourlyCost", "Loaded hourly cost"]] },
  { key: "revenue", label: "Revenue value", fields: [["addressableRevenue", "Addressable revenue"], ["conversionChange", "Conversion change"], ["grossMargin", "Gross margin"]] },
  { key: "avoidedRisk", label: "Avoided risk", fields: [["baselineIncidentProbability", "Baseline incident probability"], ["incidentImpact", "Incident impact"], ["riskReduction", "Risk reduction"]] },
] as const;

function getField(assumptions: ScenarioAssumptions, group: string, field: string) {
  return (assumptions[group as keyof ScenarioAssumptions] as unknown as Record<string, { range: { low: number | null; base: number | null; high: number | null }; unit: string; source: string; sourceRef: string; rationale: string }>)[field];
}
function draftValues(comparison: ScenarioComparison) {
  const values: Record<string, string> = {};
  for (const scenario of comparison.scenarios) for (const group of assumptionGroups) for (const [field] of group.fields) for (const band of ["low", "base", "high"] as const) {
    const value = getField(scenario.assumptions, group.key, field).range[band];
    values[pathKey(scenario.templateId, group.key, field, band)] = value === null ? "" : String(value);
  }
  for (const scenario of comparison.scenarios) values[`${scenario.templateId}.sensitivity.seed`] = String(scenario.assumptions.sensitivity.seed);
  return values;
}

function AssumptionPanel({ scenario, drafts, errors, onChange, onReset }: { scenario: ScenarioResult; drafts: Record<string, string>; errors: Record<string, string>; onChange: (key: string, value: string) => void; onReset: () => void }) {
  return <details className="assumptions-panel" open><summary><span><strong>Assumptions and calculation</strong><small>Edit valid inputs to recalculate synchronously.</small></span><span>Open controls</span></summary><div className="assumption-groups">
    {assumptionGroups.map((group) => <fieldset className={`assumption-group ${group.key}`} key={group.key}><legend>{group.label}</legend>{group.fields.map(([field, label]) => { const value = getField(scenario.assumptions, group.key, field); return <div className="assumption-row" key={field}><div><label>{label}</label><small>{value.unit} · {title(value.source)} · {value.sourceRef}</small><p>{value.rationale}</p></div><div className="range-inputs">{(["low", "base", "high"] as const).map((band) => { const key = pathKey(scenario.templateId, group.key, field, band); return <label key={band}><span>{title(band)}</span><input aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? `${key}-error` : undefined} inputMode="decimal" value={drafts[key] ?? ""} onChange={(event) => onChange(key, event.target.value)} />{errors[key] ? <small className="error" id={`${key}-error`}>{errors[key]}</small> : null}</label>; })}</div></div>; })}<button className="reset-link" type="button" onClick={onReset}>Reset all assumptions to Model 1.0.0</button></fieldset>)}
    <fieldset className="assumption-group sensitivity"><legend>Sensitivity trace</legend><div className="assumption-row"><div><label htmlFor={`${scenario.templateId}-seed`}>Deterministic seed</label><small>Trace only · cannot change headline ROI</small><p>Delay probability {scenario.assumptions.sensitivity.delayProbability}; maximum delay {scenario.assumptions.sensitivity.maximumDelayMonths} months; adoption variation ±{scenario.assumptions.sensitivity.adoptionVariation}.</p></div><input id={`${scenario.templateId}-seed`} inputMode="numeric" value={drafts[`${scenario.templateId}.sensitivity.seed`] ?? ""} onChange={(event) => onChange(`${scenario.templateId}.sensitivity.seed`, event.target.value)} /></div></fieldset>
  </div></details>;
}

function ScenarioDetail({ scenario }: { scenario: ScenarioResult }) {
  return <section className="scenario-detail" aria-labelledby="scenario-detail-title"><header><div><p className="eyebrow">Scenario detail</p><h2 id="scenario-detail-title">{scenario.title}: 12-month path</h2><p>{scenario.intent}</p></div><div className="detail-summary"><strong>{formatRange(scenario.costs.firstYear)}</strong><span>Committed first-year cost</span></div></header>
    <div className="timeline" aria-label="12-month scenario timeline">{scenario.months.map((month) => <article key={month.month}><strong>Month {month.month}</strong>{scenario.interventions.filter((item) => item.startMonth === month.month).map((item) => <span key={item.capabilityId}>{item.commitment === "conditional" ? "Conditional gate: " : "Start: "}{item.title}</span>)}{scenario.interventions.filter((item) => item.completionMonth === month.month && item.commitment === "committed").map((item) => <span key={`done-${item.capabilityId}`}>Activate: {item.title}</span>)}{month.notes.map((note) => <small key={note}>{note}</small>)}</article>)}</div>
    <div className="detail-columns"><section><h3>Dependencies and readiness</h3>{scenario.dependencies.length ? <ul>{scenario.dependencies.map((item) => <li key={`${item.capabilityId}-${item.dependsOnCapabilityId}`}>{title(item.capabilityId)} depends on {title(item.dependsOnCapabilityId)}. {item.policy}</li>)}</ul> : <p>No cross-capability dependency applies to this scope.</p>}{scenario.warnings.length ? <ul className="warning-list">{scenario.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul> : <p>All committed interventions pass their current prerequisite checks.</p>}</section><section><h3>Calculation breakdown</h3><dl><div><dt>Implementation</dt><dd>{formatRange(scenario.costs.implementation)}</dd></div><div><dt>Training</dt><dd>{formatRange(scenario.costs.training)}</dd></div><div><dt>Annual recurring</dt><dd>{formatRange(scenario.costs.annualRecurring)}</dd></div><div><dt>Operational value</dt><dd>{scenario.value.operational.status === "estimated" ? formatRange(scenario.value.operational.range) : "Not estimated"}</dd></div></dl><details><summary>Inspect formulas and exclusions</summary><p>{scenario.value.operational.formula}</p><p>{scenario.value.revenue.formula}</p><p>{scenario.value.avoidedRisk.formula}</p><p>{scenario.value.net.formula}</p><ul>{scenario.value.exclusions.map((item) => <li key={item}>{item}</li>)}</ul></details></section></div>
  </section>;
}

export function ScenariosView({ initialResult, twin, diagnostic, recommendations, onPersist }: { initialResult: ScenarioComparison; twin: BusinessTwin; diagnostic: DiagnosticResult; recommendations: RecommendationResult; onPersist?: (result: ScenarioComparison) => void }) {
  const [comparison, setComparison] = useState(initialResult);
  const [focusedId, setFocusedId] = useState<ScenarioTemplateId>("balanced_growth");
  const [drafts, setDrafts] = useState(() => draftValues(initialResult));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const focused = comparison.scenarios.find((item) => item.templateId === focusedId)!;
  const eventFactory = () => `event_${crypto.randomUUID().replaceAll("-", "").slice(0, 20)}`;
  const updateComparison = (next: ScenarioComparison) => { setComparison(next); onPersist?.(next); };
  const edit = (key: string, value: string) => {
    const nextDrafts = { ...drafts, [key]: value }; setDrafts(nextDrafts);
    const assumptions = clone(focused.assumptions);
    if (key.endsWith(".sensitivity.seed")) assumptions.sensitivity.seed = value.trim() === "" ? Number.NaN : Number(value);
    else {
      const [, group, field, band] = key.split(".");
      const target = getField(assumptions, group, field).range as Record<string, number | null>;
      target[band] = value.trim() === "" ? (["revenue", "avoidedRisk"].includes(group) ? null : Number.NaN) : Number(value);
    }
    const parsed = scenarioAssumptionsSchema.safeParse(assumptions);
    if (!parsed.success) { setErrors({ ...errors, [key]: parsed.error.issues[0]?.message ?? "Enter a valid value." }); return; }
    setErrors((current) => { const next = { ...current }; delete next[key]; return next; });
    updateComparison(recalculateScenarioComparison(comparison, twin, recommendations, EXABYTES_SCENARIO_RULES_1_0_0, { [focusedId]: parsed.data }, { now: () => new Date().toISOString(), eventId: eventFactory }));
  };
  const reset = () => {
    const template = EXABYTES_SCENARIO_RULES_1_0_0.templates.find((item) => item.id === focusedId)!;
    const source = recommendations.recommendations.filter((item) => focused.interventions.some((intervention) => intervention.capabilityId === item.capabilityId));
    const committed = source.filter((item) => focused.interventions.find((intervention) => intervention.capabilityId === item.capabilityId)?.commitment === "committed");
    const conditional = source.filter((item) => !committed.includes(item));
    const model = deriveAssumptions(twin, template, committed, conditional, EXABYTES_SCENARIO_RULES_1_0_0);
    const next = recalculateScenarioComparison(comparison, twin, recommendations, EXABYTES_SCENARIO_RULES_1_0_0, { [focusedId]: model }, { now: () => new Date().toISOString(), eventId: eventFactory });
    setDrafts(draftValues(next)); setErrors({}); updateComparison(next);
  };
  const prefer = (scenario: ScenarioResult) => updateComparison({ ...comparison, selectedScenarioId: scenario.id, updatedAt: new Date().toISOString() });
  const preferredTemplate = comparison.scenarios.find((item) => item.id === comparison.selectedScenarioId)?.templateId;
  const summary = `${recommendations.recommendations.length} recommendations · maturity ${diagnostic.digitalMaturity.value ?? "—"} · AI readiness ${diagnostic.aiReadiness.value ?? "—"}`;
  return <><header className="topbar"><Brand /><span className="save-status">✓ Saved on this device</span></header><JourneyRail /><main className="scenarios-shell"><header className="scenarios-hero"><div><p className="eyebrow">{twin.identity.businessName} · Scenario and ROI Lab</p><h1>Compare transformation paths</h1><p className="lead">Three deterministic 12-month paths built only from your accepted recommendations. Change an assumption and every displayed range updates from code.</p></div><aside><strong>Current decision context</strong><span>{summary}</span><small>Model {comparison.scenarioModelVersion} · ROI {comparison.roiModelVersion}</small></aside></header>
    <section className="comparison-intro"><div><h2>Compare. Inspect. Choose.</h2><p>Balanced is in focus for comparison, but no preferred plan exists until you select one.</p></div><p><strong>Ranges are conditional, not guarantees.</strong><br />Costs are planning assumptions, not an Exabytes quote.</p></section>
    <div className="scenario-grid">{comparison.scenarios.map((scenario) => <ScenarioCard key={scenario.id} scenario={scenario} focused={focusedId === scenario.templateId} preferred={comparison.selectedScenarioId === scenario.id} onFocus={() => setFocusedId(scenario.templateId)} onPrefer={() => prefer(scenario)} />)}</div>
    <ScenarioDetail scenario={focused} /><AssumptionPanel scenario={focused} drafts={drafts} errors={errors} onChange={edit} onReset={reset} />
    <section className="stage-five-handoff"><div><p className="eyebrow">Next stage</p><h2>Advisor review and Blueprint</h2><p>{preferredTemplate ? `${title(preferredTemplate)} is saved as your preferred path.` : "Select a preferred path when you are ready."} Advisor review and the Blueprint are not implemented yet.</p></div><Link className="button secondary" href="/recommendations">Back to recommendations</Link></section>
  </main></>;
}

export function ScenariosClient() {
  const router = useRouter();
  const [state, setState] = useState<{ twin: BusinessTwin; diagnostic: DiagnosticResult; recommendations: RecommendationResult; comparison: ScenarioComparison }>();
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
      setState({ twin, diagnostic: diagnostic.result, recommendations: recommendations.result, comparison });
    } catch { router.replace("/recommendations"); }
  }, [router]);
  if (!state) return <main className="loading">Building three reproducible transformation paths…</main>;
  return <ScenariosView initialResult={state.comparison} twin={state.twin} diagnostic={state.diagnostic} recommendations={state.recommendations} onPersist={(result) => saveScenarioComparison(localStorage, result)} />;
}
