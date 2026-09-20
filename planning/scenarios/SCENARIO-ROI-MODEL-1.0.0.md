# Scenario and ROI Model 1.0.0

Status: **Frozen for Stage 04 implementation**  
Owner: Main planning and integration task  
Frozen: 17 September 2026

## 1. Purpose

This model converts an accepted Business Twin, diagnostic, and recommendation
result into three comparable 12-month transformation paths. It is a planning
model, not a forecast or quote. Every number must be reproducible from visible
inputs, versioned rules, and editable assumptions.

The model uses a configurable environment, typed events, replay, and
investigable reports for SME transformation scenarios. It prevents free-form
agent state mutation through validated data, pure calculations, typed events,
and deterministic reducers.

## 2. Non-negotiable rules

- Code owns scenario composition, dependencies, dates, costs, benefit ranges,
  payback, budget fit, persistence, and recalculation.
- No LLM or network call is required.
- A scenario may only contain capabilities present in the accepted Stage 03
  recommendation result.
- A `why_later` recommendation remains conditional and contributes no committed
  cost or benefit until its hard prerequisites are explicitly satisfied.
- Product catalogue prices are never inferred. Cost ranges are editable internal
  planning assumptions and must be labelled `Not an Exabytes quote`.
- Revenue and avoided-loss value remain `not_estimated` until every required
  input for that value stream is supplied.
- Low/base/high outputs are conditional ranges, never guarantees.
- Identical inputs, assumptions, versions, IDs, time, and seed produce identical
  output.

## 3. Versioned contracts

```text
ScenarioComparison
  id, assessmentSessionId, businessTwinId, twinRevision
  diagnosticResultId, recommendationResultId
  scenarioModelVersion = 1.0.0
  roiModelVersion = 1.0.0
  createdAt, updatedAt
  selectedScenarioId?
  scenarios[3]

ScenarioResult
  templateId = lean_foundation | balanced_growth | accelerated_ai
  title, intent, riskLevel
  seed
  interventions[]
  assumptions
  costs
  value
  budgetFit
  months[12]
  events[]
  dependencies[]
  confidence
  warnings[]

ScenarioIntervention
  capabilityId, recommendationRank, status
  commitment = committed | conditional
  startMonth, completionMonth
  dependencyCapabilityIds[]
  prerequisiteChecks[]

EstimateRange
  low <= base <= high

Assumption
  key, unit, range or nullable range
  source = user_fact | derived_user_fact | planning_default | user_override
  sourceRef, rationale, editable
```

All ratios are stored as decimal fractions. Money is Malaysian ringgit. Months
are integers 1–12. Final money outputs round to the nearest whole ringgit;
payback rounds to one decimal month. Intermediate arithmetic is not rounded.

## 4. Scenario composition

Selection is stable by recommendation rank and then capability ID.

### Lean Foundation

Include every eligible `why_now` recommendation whose phase is Foundation,
then add the highest-ranked eligible recommendation if it is not already
present. Maximum three committed interventions.

### Balanced Growth

Include every eligible `why_now` recommendation, then the highest-ranked `next`
recommendation. Maximum four committed interventions.

### Accelerated AI

Start with the Balanced set. Add `governed_ai_automation` when present in the
recommendation result. If it is `why_later`, retain it as conditional and show
the exact unmet or unknown prerequisites. Maximum four committed interventions
plus one conditional intervention.

Never manufacture a capability to fill a scenario. Empty slots are explained
as `No additional evidence-backed intervention`.

## 5. Scheduling and dependencies

| Phase | Lean | Balanced | Accelerated |
|---|---|---|---|
| Foundation | month 1, duration 2 | month 1, duration 2 | month 1, duration 1 |
| Connect | month 3, duration 3 | month 2, duration 3 | month 1, duration 3 |
| Optimize | not selected by default | month 5, duration 3 | month 4, duration 4 |
| Conditional AI | not selected | not selected | gate review month 6; earliest pilot month 7 |

Dependencies enforce `completionMonth(dependency) < startMonth(dependent)`.
When a schedule violates this rule, move the dependent start to the next month
and cascade its completion. A completion after month 12 becomes `deferred` and
contributes no first-year benefit after month 12.

The Exabytes scenario template supplies dependency policy. For Model 1.0.0:

- governed AI depends on shared customer operations when present;
- governed AI also requires leadership, data, and process readiness >= 3;
- protected web presence depends on an active website, inherited from the
  recommendation prerequisite check;
- no dependency can be marked met merely because the scenario moves faster.

### Typed events

Use only:

- `scenario_started`;
- `intervention_scheduled`;
- `prerequisite_completed`;
- `training_started`;
- `capability_activated`;
- `adoption_changed`;
- `cost_incurred`;
- `benefit_realised`;
- `risk_reduced`;
- `milestone_delayed`;
- `conditional_gate_blocked`;
- `scenario_completed`.

Events include scenario ID, month, type, capability ID when relevant, numeric
payload, and explanation. Stable sorting is month, event priority, capability
ID, then event ID.

## 6. Cost assumptions

The scenario engine aggregates planning ranges by each committed capability's
relative cost tier.

| Tier | Implementation low/base/high | Training low/base/high | Annual recurring low/base/high |
|---:|---:|---:|---:|
| 1 | 500 / 1,000 / 1,500 | 300 / 600 / 900 | 600 / 1,200 / 1,800 |
| 2 | 1,500 / 3,000 / 4,500 | 500 / 1,000 / 1,500 | 1,200 / 2,400 / 3,600 |
| 3 | 3,000 / 6,000 / 9,000 | 1,000 / 2,000 / 3,000 | 2,400 / 4,800 / 7,200 |
| 4 | 6,000 / 12,000 / 18,000 | 2,000 / 4,000 / 6,000 | 4,800 / 9,600 / 14,400 |

Apply the pace multiplier to implementation and training only:

- Lean: 0.90;
- Balanced: 1.00;
- Accelerated: 1.20.

```text
first_year_cost =
  implementation_cost + training_cost + annual_recurring_cost
```

Conditional interventions have a separate `conditionalExpansionCost`; they do
not enter committed first-year ROI until unlocked.

Users may edit the aggregate three cost ranges. An edit changes the source to
`user_override`; reset restores the deterministic tier-derived values.

## 7. Operational-value assumptions

Manual hours come from the current Business Twin process evidence. Follow-up
bands retain the Stage 02 midpoint mapping, so `11_20` becomes 15.5 hours.
Missing manual hours produce `not_estimated` operational value.

Default loaded-hourly-cost range is RM15 / RM25 / RM35 and is explicitly a
planning default, not a wage claim.

| Scenario | Automatable share low/base/high | Adoption low/base/high |
|---|---:|---:|
| Lean | 0.15 / 0.25 / 0.35 | 0.60 / 0.75 / 0.85 |
| Balanced | 0.30 / 0.45 / 0.60 | 0.65 / 0.80 / 0.90 |
| Accelerated | 0.35 / 0.55 / 0.70 | 0.55 / 0.75 / 0.88 |

```text
weekly_hours_saved =
  min(manual_hours_per_week,
      manual_hours_per_week × automatable_share × adoption)

annual_time_value =
  weekly_hours_saved × 52 × loaded_hourly_cost
```

## 8. Optional revenue and avoided-risk value

Revenue value is estimated only when addressable revenue, conversion change,
and gross margin are all present:

```text
annual_incremental_gross_profit =
  addressable_revenue × conversion_change × gross_margin
```

Avoided-loss value is estimated only when baseline incident probability,
incident impact, and risk reduction are all present:

```text
annual_avoided_loss =
  baseline_incident_probability × incident_impact × risk_reduction
```

Partial inputs never become zero. The UI names the missing fields and shows
`Not estimated`. Values entered in the lab are user overrides and are not
written back as assessment facts.

## 9. Range arithmetic

Gross value is the sum of estimated streams. A missing optional stream is
excluded and listed under exclusions; if every stream is missing, gross value
is `not_estimated`.

```text
gross_value = time_value + incremental_gross_profit + avoided_loss

pessimistic_net = low_gross_value - high_first_year_cost
base_net        = base_gross_value - base_first_year_cost
optimistic_net  = high_gross_value - low_first_year_cost

best_payback  = low_first_year_cost  / (high_gross_value / 12)
base_payback  = base_first_year_cost / (base_gross_value / 12)
worst_payback = high_first_year_cost / (low_gross_value / 12)
```

Zero or missing gross value produces `not_estimated` payback. Values beyond 60
months remain numeric in data but display as `More than 60 months`.

## 10. Budget fit

Budget upper bounds are RM5,000; RM15,000; RM50,000; unbounded for `50k_plus`;
and unknown for `unknown`.

- `within_range`: high cost is within the upper bound;
- `base_within`: base is within but high exceeds it;
- `only_low_within`: only low is within it;
- `over`: low exceeds it;
- `unknown`: no upper bound can be evaluated.

Budget fit is a warning and comparison input; it never silently removes an
evidence-backed scenario.

## 11. Seeded sensitivity trace

Each scenario stores an integer seed. A small in-repository deterministic PRNG
may alter only the separate stress trace:

- Lean: delay probability 0.10, maximum one month, adoption variation ±0.05;
- Balanced: 0.20, maximum two months, variation ±0.10;
- Accelerated: 0.35, maximum three months, variation ±0.15.

The seed cannot change headline low/base/high ROI. It only creates reproducible
delay and adoption events for the timeline and is labelled `Sensitivity trace`,
not prediction.

## 12. Frozen Case A fixture

Kopi Kita Café Group supplies 15.5 manual hours per week through the accepted
follow-up midpoint. Revenue and avoided-risk inputs are absent, so both remain
`not_estimated` by default.

| Scenario | Committed capabilities | Conditional capability |
|---|---|---|
| Lean | professional team collaboration; protected business continuity; shared customer operations | none |
| Balanced | all Lean capabilities; protected web presence | none |
| Accelerated | all Balanced capabilities | governed AI automation, blocked by data/process readiness |

Expected committed cost ranges:

- Lean: RM5,640 / RM11,280 / RM16,920;
- Balanced: RM9,200 / RM18,400 / RM27,600;
- Accelerated: RM10,320 / RM20,640 / RM30,960;
- Accelerated conditional AI expansion: RM7,200 / RM14,400 / RM21,600,
  excluded from committed ROI while blocked.

Expected operational annual-value ranges:

- Lean: RM1,088 / RM3,778 / RM8,392;
- Balanced: RM2,358 / RM7,254 / RM15,233;
- Accelerated: RM2,327 / RM8,312 / RM17,377.

Expected net-value ranges, using low benefit minus high cost through high
benefit minus low cost:

- Lean: -RM15,832 / -RM7,502 / RM2,752;
- Balanced: -RM25,242 / -RM11,146 / RM6,033;
- Accelerated: -RM28,633 / -RM12,328 / RM7,057.

Expected payback best/base/worst:

- Lean: 8.1 / 35.8 / 186.6 months;
- Balanced: 7.2 / 30.4 / 140.5 months;
- Accelerated: 7.1 / 29.8 / 159.6 months.

This intentionally conservative default demonstrates why an owner must inspect
and edit assumptions. A separate test supplies explicit fictional revenue
inputs and proves the revenue stream activates without changing stored facts.

