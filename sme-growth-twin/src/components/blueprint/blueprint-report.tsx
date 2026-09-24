import Link from "next/link";
import type { ReactNode } from "react";

import type { AdvisorReview } from "@/domain/advisors";
import type { Blueprint } from "@/domain/blueprint";
import { EXABYTES_ADVISORS_1_0_0 } from "@/domain-packs/exabytes/advisor-rules";

import { BlueprintContentsNavigation } from "./blueprint-contents-navigation";

const reportSections = [
  ["cover", "Cover"],
  ["executive-summary", "Executive summary"],
  ["business-profile", "Business profile"],
  ["maturity-readiness", "Maturity and readiness"],
  ["pain-points", "Pain points"],
  ["recommendations", "Capabilities"],
  ["scenario-comparison", "Scenario comparison"],
  ["selected-plan", "Selected plan"],
  ["roi", "ROI assumptions"],
  ["roadmap", "Roadmap"],
  ["risks", "Risks and prerequisites"],
  ["advisor-reviews", "Advisor reviews"],
  ["synthesis", "Synthesis"],
  ["consultant-notes", "Consultant notes"],
  ["methodology", "Evidence and methodology"],
  ["consultation-preview", "Consultation handoff"],
] as const;

const money = (value: number) =>
  new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR", maximumFractionDigits: 0 }).format(value);

const cleanText = (value: string) => value.replace(/[–—]/g, "-");
const reportReference = (id: string) => `MP-${id.slice(-8).toUpperCase()}`;
const humanize = (value: string) =>
  cleanText(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const advisorLabel = (advisor: string) =>
  EXABYTES_ADVISORS_1_0_0.find((definition) => definition.id === advisor)?.label ?? humanize(advisor);

export function originStatuses(blueprint: Blueprint): Record<string, "live" | "fallback"> {
  return Object.fromEntries(
    blueprint.advisorReviews.map((review) => [review.advisor, review.origin === "model" ? "live" : "fallback"]),
  );
}

function Provenance({ category, children }: { category: string; children: ReactNode }) {
  return <span className={`phase06-provenance provenance-${category}`}>{children}</span>;
}

function Evidence({ refs }: { refs: readonly string[] }) {
  return (
    <details className="phase06-evidence">
      <summary>{refs.length} evidence reference{refs.length === 1 ? "" : "s"}</summary>
      <div aria-label="Evidence references">
        {refs.map((reference, index) => <code key={`${reference}-${index}`}>{cleanText(reference)}</code>)}
      </div>
    </details>
  );
}

function RangeTriplet({
  labels = ["Low", "Base", "High"],
  values,
}: {
  labels?: readonly [string, string, string];
  values: readonly [string, string, string];
}) {
  return (
    <dl className="phase06-range-triplet">
      {labels.map((label, index) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{values[index]}</dd>
        </div>
      ))}
    </dl>
  );
}

function CurrencyRange({ value }: { value: { low: number; base: number; high: number } }) {
  return <RangeTriplet values={[money(value.low), money(value.base), money(value.high)]} />;
}

function ReportHeading({ index, children }: { index: number; children: ReactNode }) {
  return (
    <header className="phase06-report-heading">
      <p>Section {index} of 16</p>
      <h2>{children}</h2>
    </header>
  );
}

function AdvisorFindingList({ label, items }: { label: string; items: AdvisorReview["support"] }) {
  return (
    <section>
      <h4>{label}</h4>
      {items.length ? (
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              <p>{cleanText(item.statement)}</p>
              <Evidence refs={item.evidenceRefs} />
            </li>
          ))}
        </ul>
      ) : <p className="phase06-empty-copy">None recorded.</p>}
    </section>
  );
}

function AdvisorCard({ review }: { review: AdvisorReview }) {
  const definition = EXABYTES_ADVISORS_1_0_0.find((item) => item.id === review.advisor)!;
  const itemCount = review.support.length + review.concerns.length + review.missingEvidence.length + review.adjustments.length;
  return (
    <details className={`phase06-advisor-card advisor-${review.advisor}`}>
      <summary>
        <span className="phase06-advisor-index">{String(EXABYTES_ADVISORS_1_0_0.findIndex((item) => item.id === review.advisor) + 1).padStart(2, "0")}</span>
        <span className="phase06-advisor-summary">
          <small>{definition.label}</small>
          <strong>{cleanText(review.headline)}</strong>
          <span>{itemCount} material item{itemCount === 1 ? "" : "s"} across support, concerns, evidence gaps, and adjustments</span>
        </span>
        <span className="phase06-advisor-badges">
          <b>{humanize(review.position)}</b>
          <b className={`origin-${review.origin}`}>{review.origin === "model" ? "Live model review" : "Deterministic fallback"}</b>
        </span>
      </summary>
      <div className="phase06-advisor-body">
        <div className="phase06-advisor-context">
          <p>{cleanText(definition.objective)}</p>
          <dl>
            <div><dt>Confidence</dt><dd>{Math.round(review.confidence * 100)}%</dd></div>
            <div><dt>Source</dt><dd>{cleanText(review.sourceRef)}</dd></div>
          </dl>
        </div>
        <div className="phase06-advisor-groups">
          <AdvisorFindingList label="Support" items={review.support} />
          <AdvisorFindingList label="Concerns" items={review.concerns} />
          <AdvisorFindingList label="Missing evidence" items={review.missingEvidence} />
          <section>
            <h4>Advisory adjustments</h4>
            {review.adjustments.length ? (
              <ul>
                {review.adjustments.map((item) => (
                  <li key={item.id}>
                    <p>{cleanText(item.action)}</p>
                    <Evidence refs={[item.targetRef, ...item.evidenceRefs]} />
                  </li>
                ))}
              </ul>
            ) : <p className="phase06-empty-copy">No adjustment proposed.</p>}
          </section>
        </div>
      </div>
    </details>
  );
}

function SynthesisPanel({ blueprint }: { blueprint: Blueprint }) {
  const groups = [
    ["Agreement", blueprint.synthesis.agreement, "agreement"],
    ["Disagreement", blueprint.synthesis.disagreement, "disagreement"],
    ["Conditions", blueprint.synthesis.conditions, "conditions"],
    ["Open questions", blueprint.synthesis.openQuestions, "questions"],
  ] as const;

  return (
    <div className="phase06-synthesis-grid synthesis-grid">
      {groups.map(([label, entries, className]) => (
        <details className={`phase06-synthesis-panel ${className}`} key={label}>
          <summary><strong>{label}</strong><span>{entries.length} topic{entries.length === 1 ? "" : "s"}</span></summary>
          {entries.length ? (
            <ul>
              {entries.map((entry) => (
                <li key={entry.topic}>
                  <strong>{humanize(entry.topic)}</strong>
                  <ul className="phase06-perspectives">
                    {entry.perspectives.map((perspective, index) => (
                      <li key={`${perspective.kind}-${perspective.statement}-${index}`}>
                        <span>{humanize(perspective.kind)}</span>
                        <p>{cleanText(perspective.statement)}</p>
                        <small>Contributors: {perspective.advisorIds.map(advisorLabel).join(", ")}</small>
                        <Evidence refs={perspective.evidenceRefs} />
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          ) : (
            <p className="phase06-empty-copy">
              {label === "Disagreement" ? "No material disagreement detected" : `No ${label.toLowerCase()} recorded.`}
            </p>
          )}
        </details>
      ))}
    </div>
  );
}

export function DecisionOverview({ blueprint }: { blueprint: Blueprint }) {
  const { diagnostic, selectedScenario: selected } = blueprint.snapshot;
  const modelCount = blueprint.advisorReviews.filter((review) => review.origin === "model").length;
  const fallbackCount = blueprint.advisorReviews.length - modelCount;
  const financialNote =
    selected.value.net.status === "estimated" && (selected.value.net.range.low < 0 || selected.value.net.range.base < 0)
      ? "Negative net values reflect the current operational-value assumptions and excluded value streams. They are not treated as an error state."
      : undefined;
  const topConditions = blueprint.synthesis.conditions.slice(0, 3);

  return (
    <section className="phase06-overview no-print" aria-labelledby="decision-overview-title">
      <header>
        <div>
          <p className="eyebrow">Executive decision overview</p>
          <h2 id="decision-overview-title">{selected.title}: {humanize(blueprint.synthesis.decision)}</h2>
        </div>
        <Link href="#executive-summary">Enter the full report</Link>
      </header>
      <div className="phase06-overview-grid">
        <section className="phase06-overview-decision">
          <h3>Decision context</h3>
          <dl>
            <div><dt>Digital maturity</dt><dd>{diagnostic.digitalMaturity.value ?? "Not calculated"} / 100</dd></div>
            <div><dt>AI readiness</dt><dd>{diagnostic.aiReadiness.value ?? "Not calculated"} / 100</dd></div>
            <div><dt>Advisor origins</dt><dd>{modelCount} live, {fallbackCount} fallback</dd></div>
          </dl>
          <div className="phase06-counts" aria-label="Synthesis counts">
            <a href="#synthesis"><strong>{blueprint.synthesis.agreement.length}</strong><span>Agreement</span></a>
            <a href="#synthesis"><strong>{blueprint.synthesis.disagreement.length}</strong><span>Disagreement</span></a>
            <a href="#synthesis"><strong>{blueprint.synthesis.conditions.length}</strong><span>Conditions</span></a>
            <a href="#synthesis"><strong>{blueprint.synthesis.openQuestions.length}</strong><span>Open questions</span></a>
          </div>
        </section>
        <section className="phase06-overview-finance">
          <h3>First-year financial range</h3>
          <div><h4>Cost</h4><CurrencyRange value={selected.costs.firstYear} /></div>
          <div><h4>Operational value</h4>{selected.value.operational.status === "estimated" ? <CurrencyRange value={selected.value.operational.range} /> : <p>Not estimated</p>}</div>
          <div><h4>Net value</h4>{selected.value.net.status === "estimated" ? <CurrencyRange value={selected.value.net.range} /> : <p>Not estimated</p>}</div>
          <div><h4>Payback</h4>{selected.value.payback.status === "estimated" ? <RangeTriplet labels={["Best", "Base", "Worst"]} values={[`${selected.value.payback.best} months`, `${selected.value.payback.base} months`, `${selected.value.payback.worst} months`]} /> : <p>Not estimated</p>}</div>
          {financialNote ? <p className="phase06-finance-note">{financialNote}</p> : null}
        </section>
        <section className="phase06-overview-conditions">
          <h3>Conditions to resolve</h3>
          {topConditions.length ? (
            <ol>
              {topConditions.map((condition) => <li key={condition.topic}><a href="#synthesis">{humanize(condition.topic)}</a></li>)}
            </ol>
          ) : <p>No conditions recorded.</p>}
          <a href="#risks">Review risks and prerequisites</a>
        </section>
      </div>
    </section>
  );
}

export function BlueprintReport({ blueprint }: { blueprint: Blueprint }) {
  const { twin, diagnostic, recommendations, comparison, selectedScenario: selected } = blueprint.snapshot;
  const modelCount = blueprint.advisorReviews.filter((review) => review.origin === "model").length;
  const fallbackCount = blueprint.advisorReviews.length - modelCount;

  return (
    <div className="phase06-blueprint-layout">
      <BlueprintContentsNavigation sections={reportSections} />
      <article className="phase06-report blueprint-report" aria-label="Digital and AI Transformation Blueprint">
        <section id="cover" className="phase06-report-cover">
          <p className="eyebrow">Digital and AI Transformation Blueprint</p>
          <h1>{cleanText(twin.identity.businessName)}</h1>
          <p>{cleanText(selected.title)}</p>
          <p>12-month transformation plan</p>
          <dl>
            <div><dt>Report reference</dt><dd>{reportReference(blueprint.id)}</dd></div>
            <div><dt>Generated</dt><dd>{new Date(blueprint.generatedAt).toLocaleString("en-MY", { dateStyle: "long", timeStyle: "short" })}</dd></div>
            <div><dt>Planning horizon</dt><dd>12 months</dd></div>
          </dl>
          <details className="phase06-cover-technical">
            <summary>Technical report details</summary>
            <p>Blueprint ID <code>{blueprint.id}</code></p>
            <p>Model version <code>{blueprint.modelVersion}</code></p>
          </details>
        </section>

        <section id="executive-summary">
          <ReportHeading index={2}>Executive summary</ReportHeading>
          <div className="phase06-executive-summary">
            <div>
              <p className="phase06-decision-label">Selected path</p>
              <h3>{cleanText(selected.title)}</h3>
              <p>{cleanText(selected.intent)}</p>
            </div>
            <dl>
              <div><dt>Synthesis decision</dt><dd>{humanize(blueprint.synthesis.decision)}</dd></div>
              <div><dt>Digital maturity</dt><dd>{diagnostic.digitalMaturity.value ?? "Not calculated"} / 100</dd></div>
              <div><dt>AI readiness</dt><dd>{diagnostic.aiReadiness.value ?? "Not calculated"} / 100</dd></div>
              <div><dt>Review origins</dt><dd>{modelCount} live, {fallbackCount} fallback</dd></div>
            </dl>
          </div>
          <p>
            The accepted scenario scope and numeric results remain unchanged. Five bounded specialist reviews add interpretation,
            conditions, and evidence questions without replacing deterministic facts.
          </p>
          <Provenance category="calculated_rule">Calculated rule</Provenance>
        </section>

        <section id="business-profile">
          <ReportHeading index={3}>Business profile</ReportHeading>
          <dl className="phase06-report-grid">
            <div><dt>Sector</dt><dd>{humanize(twin.identity.industry)}</dd></div>
            <div><dt>Business model</dt><dd>{twin.identity.businessModel.toUpperCase()}</dd></div>
            <div><dt>Employees</dt><dd>{humanize(twin.identity.employeeBand)}</dd></div>
            <div><dt>Objective</dt><dd>{humanize(twin.objectives[0]?.type ?? "unknown")}</dd></div>
            <div><dt>Budget band</dt><dd>{humanize(twin.constraints.budgetBand)}</dd></div>
            <div><dt>Implementation pace</dt><dd>{humanize(twin.constraints.implementationPace)}</dd></div>
          </dl>
          <Provenance category="user_fact">User fact</Provenance>
        </section>

        <section id="maturity-readiness">
          <ReportHeading index={4}>Digital maturity and AI readiness</ReportHeading>
          <div className="phase06-score-pair">
            <article><strong>{diagnostic.digitalMaturity.value ?? "Not calculated"}</strong><span>Digital maturity</span><small>{cleanText(diagnostic.digitalMaturity.bandLabel)}</small></article>
            <article><strong>{diagnostic.aiReadiness.value ?? "Not calculated"}</strong><span>AI readiness</span><small>{cleanText(diagnostic.aiReadiness.bandLabel)}</small></article>
          </div>
          <p>{cleanText(diagnostic.digitalMaturity.improvementAction)}</p>
          <Provenance category="calculated_rule">Calculated rule</Provenance>
        </section>

        <section id="pain-points">
          <ReportHeading index={5}>Top five pain points</ReportHeading>
          <ol className="phase06-report-list">
            {diagnostic.painPoints.slice(0, 5).map((pain) => (
              <li key={pain.id}>
                <header><strong>{cleanText(pain.title)}</strong><span>Priority {pain.priority}</span></header>
                <p>{cleanText(pain.mechanism)}</p>
                <Evidence refs={pain.evidenceIds} />
              </li>
            ))}
          </ol>
        </section>

        <section id="recommendations">
          <ReportHeading index={6}>Recommended capabilities and mapped offerings</ReportHeading>
          <div className="phase06-capability-list">
            {recommendations.recommendations.map((item) => (
              <article key={item.capabilityId}>
                <header><strong>{item.rank}. {cleanText(item.title)}</strong><span>{humanize(item.status)}</span></header>
                <p>{cleanText(item.outcome)}</p>
                {item.mappedOffering ? (
                  <p><Provenance category="catalogue_fact">Catalogue fact</Provenance> <strong>{cleanText(item.mappedOffering.name)}:</strong> {cleanText(item.mappedOffering.approvedFactSummary)}</p>
                ) : null}
                <Evidence refs={item.evidenceIds.length ? item.evidenceIds : [recommendations.id]} />
              </article>
            ))}
          </div>
        </section>

        <section id="scenario-comparison">
          <ReportHeading index={7}>Three-scenario comparison</ReportHeading>
          <div className="phase06-report-scenarios">
            {comparison.scenarios.map((scenario) => (
              <article key={scenario.id}>
                <h3>{cleanText(scenario.title)}</h3>
                <h4>First-year cost</h4>
                <CurrencyRange value={scenario.costs.firstYear} />
                <dl className="phase06-scenario-facts">
                  <div><dt>Budget fit</dt><dd>{humanize(scenario.budgetFit)}</dd></div>
                  <div><dt>Net value</dt><dd>{scenario.value.net.status === "estimated" ? "Estimated range shown in source model" : "Not estimated"}</dd></div>
                  <div><dt>Base payback</dt><dd>{scenario.value.payback.status === "estimated" ? `${scenario.value.payback.base} months` : "Not estimated"}</dd></div>
                </dl>
              </article>
            ))}
          </div>
          <Provenance category="calculated_rule">Scenario and ROI model</Provenance>
        </section>

        <section id="selected-plan">
          <ReportHeading index={8}>Selected transformation plan</ReportHeading>
          <h3>{cleanText(selected.title)}</h3>
          <p>{cleanText(selected.intent)}</p>
          <ul className="phase06-plan-list">
            {selected.interventions.map((item) => (
              <li key={item.capabilityId}>
                <strong>{cleanText(item.title)}</strong>
                <span>{humanize(item.commitment)}, month {item.startMonth} to {item.completionMonth}{item.status === "blocked" ? ". Blocked pending prerequisites." : ""}</span>
              </li>
            ))}
          </ul>
          <Provenance category="scenario_assumption">Selected scenario</Provenance>
        </section>

        <section id="roi">
          <ReportHeading index={9}>ROI assumptions, ranges, formulas, and exclusions</ReportHeading>
          <div className="phase06-roi-grid">
            <article><h3>First-year cost</h3><CurrencyRange value={selected.costs.firstYear} /></article>
            <article><h3>Operational value</h3>{selected.value.operational.status === "estimated" ? <CurrencyRange value={selected.value.operational.range} /> : <p>Not estimated</p>}</article>
            <article><h3>Net value</h3>{selected.value.net.status === "estimated" ? <CurrencyRange value={selected.value.net.range} /> : <p>Not estimated</p>}</article>
            <article><h3>Payback</h3>{selected.value.payback.status === "estimated" ? <RangeTriplet labels={["Best", "Base", "Worst"]} values={[`${selected.value.payback.best} months`, `${selected.value.payback.base} months`, `${selected.value.payback.worst} months`]} /> : <p>Not estimated</p>}</article>
          </div>
          <p><strong>Budget fit:</strong> {humanize(selected.budgetFit)}. <strong>Revenue:</strong> {humanize(selected.value.revenue.status)}. <strong>Avoided risk:</strong> {humanize(selected.value.avoidedRisk.status)}.</p>
          <details className="phase06-disclosure">
            <summary>Inspect formulas and exclusions</summary>
            <div>
              <h3>Formulas</h3>
              <ul>
                <li>{cleanText(selected.value.operational.formula)}</li>
                <li>{cleanText(selected.value.revenue.formula)}</li>
                <li>{cleanText(selected.value.avoidedRisk.formula)}</li>
                <li>{cleanText(selected.value.net.formula)}</li>
              </ul>
              <h3>Exclusions</h3>
              <ul>{selected.value.exclusions.map((item) => <li key={item}>{cleanText(item)}</li>)}</ul>
            </div>
          </details>
          <Provenance category="scenario_assumption">Scenario assumptions</Provenance>
        </section>

        <section id="roadmap">
          <ReportHeading index={10}>Month-by-month roadmap</ReportHeading>
          <details className="phase06-roadmap-disclosure">
            <summary>Inspect the complete 12-month sequence <span>Starts, activations, and the business owner placeholder for every month</span></summary>
          <div className="phase06-timeline">
            {selected.months.map((month) => (
              <article key={month.month}>
                <strong>Month {month.month}</strong>
                {selected.interventions.filter((item) => item.startMonth === month.month).map((item) => <p key={item.capabilityId}>Start: {cleanText(item.title)}</p>)}
                {selected.interventions.filter((item) => item.completionMonth === month.month && item.commitment === "committed").map((item) => <p key={item.capabilityId}>Activate: {cleanText(item.title)}</p>)}
                <small>Owner: to be assigned by the business</small>
              </article>
            ))}
          </div>
          </details>
        </section>

        <section id="risks">
          <ReportHeading index={11}>Risks, warnings, and prerequisites</ReportHeading>
          {selected.warnings.length ? <ul>{selected.warnings.map((warning) => <li key={warning}>{cleanText(warning)}</li>)}</ul> : <p className="phase06-empty-copy">No additional deterministic warning is recorded.</p>}
          <ul>
            {selected.interventions.flatMap((item) =>
              item.prerequisiteChecks
                .filter((check) => check.status !== "met")
                .map((check) => <li key={`${item.capabilityId}-${check.ruleId}`}><strong>{cleanText(item.title)}:</strong> {cleanText(check.explanation)}</li>),
            )}
          </ul>
        </section>

        <section id="advisor-reviews">
          <ReportHeading index={12}>Five advisor reviews</ReportHeading>
          <p>Open each specialist lens to inspect every supporting point, concern, evidence gap, adjustment, and evidence reference.</p>
          <div className="phase06-advisor-list">{blueprint.advisorReviews.map((review) => <AdvisorCard review={review} key={review.advisor} />)}</div>
        </section>

        <section id="synthesis">
          <ReportHeading index={13}>Agreement, disagreement, conditions, and missing evidence</ReportHeading>
          <SynthesisPanel blueprint={blueprint} />
        </section>

        <section id="consultant-notes">
          <ReportHeading index={14}>Consultant notes</ReportHeading>
          <p className="phase06-empty-notes">No consultant notes have been added. This area remains intentionally empty until a human consultant reviews the Blueprint.</p>
          <Provenance category="human_note">Human note: empty</Provenance>
        </section>

        <section id="methodology">
          <ReportHeading index={15}>Evidence, provenance, versions, and methodology</ReportHeading>
          <p>Deterministic code owns scores, rankings, scenario composition, schedules, costs, and ROI. Optional model output is schema-validated and evidence-bounded. Invalid or unavailable output falls back per role.</p>
          <p><strong>Evidence references</strong> appear beside every supported claim so a consultant can trace the source record without inferring provenance.</p>
          <details className="phase06-disclosure phase06-technical-ledger">
            <summary>Inspect record IDs and model versions</summary>
            <dl className="phase06-versions">
              <div><dt>Twin</dt><dd>{twin.id}<br />Revision {twin.revision}<br />{twin.schemaVersion}</dd></div>
              <div><dt>Diagnostic</dt><dd>{diagnostic.id}<br />{diagnostic.scoreModelVersion}<br />{diagnostic.painModelVersion}</dd></div>
              <div><dt>Recommendations</dt><dd>{recommendations.id}<br />{recommendations.recommendationModelVersion}<br />Catalogue {recommendations.catalogueVersion}</dd></div>
              <div><dt>Scenario</dt><dd>{comparison.id}<br />{comparison.scenarioModelVersion}<br />{comparison.roiModelVersion}</dd></div>
              <div><dt>Advisor and Blueprint</dt><dd>{blueprint.synthesis.modelVersion}<br />{blueprint.modelVersion}</dd></div>
            </dl>
          </details>
          <details className="phase06-disclosure">
            <summary>Inspect claim provenance</summary>
            <ul>
              {blueprint.provenance.map((item) => (
                <li key={item.claimId}><strong>{humanize(item.category)}</strong>: {humanize(item.sectionId)}<Evidence refs={item.sourceRefs} /></li>
              ))}
            </ul>
          </details>
          <details className="phase06-disclosure">
            <summary>Inspect model-call disclosure</summary>
            <ul>
              {blueprint.modelCalls.map((call) => (
                <li key={call.id}>
                  <strong>{advisorLabel(call.advisor)}</strong>: {humanize(call.status)}. Provider {cleanText(call.provider)}. Model {cleanText(call.model)}. Latency {call.latencyMs} ms. Retry count {call.retryCount}.
                  {call.evidenceIds.length ? <Evidence refs={call.evidenceIds} /> : <p className="phase06-empty-copy">No model-call evidence IDs were recorded.</p>}
                </li>
              ))}
            </ul>
          </details>
          <details className="phase06-disclosure">
            <summary>Inspect limitations</summary>
            <ul>{blueprint.limitations.map((item) => <li key={item}>{cleanText(item)}</li>)}</ul>
          </details>
        </section>

        <section id="consultation-preview">
          <ReportHeading index={16}>Consultation handoff</ReportHeading>
          <p>The next step reviews the exact report, collects contact details and explicit consent, and creates a durable consultation handoff.</p>
          <p>It does not send email, create a CRM record, promise a human response, or provide vendor fulfilment.</p>
          <div className="phase06-consultation-action report-consultation-action no-print">
            <Link className="button primary" href="/consultation">Request consultation</Link>
          </div>
        </section>

        <footer className="phase06-report-footer">
          <span>Report {reportReference(blueprint.id)}</span>
          <span>Generated {new Date(blueprint.generatedAt).toLocaleString("en-MY")}</span>
          <span>Technical identity available in methodology</span>
        </footer>
      </article>
    </div>
  );
}
