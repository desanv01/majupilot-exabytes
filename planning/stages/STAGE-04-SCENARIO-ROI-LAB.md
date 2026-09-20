# Stage 04 - Scenario and ROI Lab

Status: **Accepted**
Implementer profile: **GPT-5.6 Sol, medium reasoning**
Prerequisite: **Stage 03 accepted and published**
Gate owner: **Main task**

## 1. Objective

Deliver a deterministic Scenario and ROI Lab that converts the accepted Stage
03 recommendations into Lean Foundation, Balanced Growth, and Accelerated AI
12-month paths. Users can compare intervention sequence, cost, adoption, risk,
dependencies, benefit ranges, payback, and budget fit; inspect every assumption;
edit assumptions; reproduce results; select a preferred path; and refresh
without losing valid work.

## 2. Required reading

Read completely before implementation:

1. `planning/MASTER-GAMEPLAN.md`, especially Sections 3, 6, 12, 13, 17–25,
   and 27–29;
2. `planning/scenarios/SCENARIO-ROI-MODEL-1.0.0.md`;
3. `planning/DECISION-REGISTER.md`;
4. `planning/EXECUTION-ORCHESTRATION.md`;
5. all previous stage packets;
6. `planning/design/stage-04/DESIGN-REVIEW.md` and approved screen images;
7. current assessment, diagnostic, recommendation, persistence, and UI code.

Implement environment configuration, lifecycle, typed actions, task visibility,
replay, and report investigation through this project's own contracts.

## 3. Non-negotiable boundaries

- Pure TypeScript owns all numeric and state transitions.
- No LLM, model-provider, server, or network dependency.
- Core receives scenario rules as data and contains no `Exabytes`, `exb_`, or
  domain-pack import.
- Scenario composition uses only current recommendation IDs.
- Hard prerequisites fail closed.
- `why_later` AI remains conditional for Case A.
- Costs are planning assumptions, not catalogue prices or vendor quotes.
- Missing revenue/risk inputs remain `not_estimated`.
- No advisor panel, blueprint, PDF, lead, authentication, or production database.

## 4. Required contracts and modules

Add strict Zod schemas and inferred types for assumptions, interventions,
dependencies, monthly state, typed events, ROI value streams, comparison
results, and persisted records. IDs and timestamps are injected.

Expected implementation areas:

```text
src/app/scenarios/page.tsx
src/components/scenarios/*
src/core/scenarios/build-scenarios.ts
src/core/scenarios/run-scenario.ts
src/core/scenarios/seeded-sensitivity.ts
src/core/roi/calculate-roi.ts
src/domain/scenarios.ts
src/domain-packs/exabytes/scenario-templates.ts
src/infrastructure/persistence/local-scenario-store.ts
tests/unit/scenarios-stage04.test.ts
tests/unit/roi-stage04.test.ts
tests/unit/stage04-render-integration.test.tsx
```

Adapt file names to the existing architecture only when it improves separation.

## 5. Routes and interaction

### `/recommendations`

Replace the Stage 04 placeholder with `Compare transformation scenarios`.
Preserve recommendation evidence and details.

### `/scenarios`

- carry over business name, maturity/readiness, and recommendation count;
- show three comparable summary cards, never a horizontally clipped table;
- default focus to Balanced but do not preselect a preferred plan;
- display scope, committed/conditional items, first-year cost, annual gross
  value, net-value range, payback, budget fit, timeline, and risk;
- distinguish committed and conditional AI cost/value;
- open a scenario detail view without losing comparison context;
- provide an accessible assumptions drawer/panel grouped into Costs,
  Operational value, Revenue value, Avoided risk, and Sensitivity;
- show low/base/high fields with units, sources, rationale, validation, and
  reset-to-model action;
- recalculate synchronously after valid edits;
- retain the last valid result while an input is invalid and explain the error;
- show calculation breakdowns and exclusions;
- allow selecting one preferred scenario and persist the choice;
- label the next stage honestly as Advisor review and Blueprint, not implemented;
- support an accessible 360 px single-column layout, 44 px targets, keyboard
  operation, visible focus, reduced motion, no sticky overlap, and no overflow.

## 6. Persistence and invalidation

Use a separate versioned local key. Load distinguishes empty, corrupt,
incompatible, and stale. Stale includes mismatch in session, Business Twin ID
or revision, diagnostic ID/version, recommendation ID/model/catalogue version,
scenario model, or ROI model. Remove invalid data safely and rebuild.

User overrides and preferred scenario survive refresh only while the source
chain remains current. A reset restores generated Model 1.0.0 assumptions.

## 7. Required tests

### Contracts and arithmetic

- schemas reject NaN, Infinity, negative money/hours, ratios outside 0–1,
  invalid ranges, invalid months, duplicate capabilities, and unknown events;
- scenario composition and stable ordering match Model 1.0.0;
- a scenario never introduces a capability absent from recommendations;
- dependency cascading and month-12 deferral are exact;
- conditional interventions contribute no committed cost or benefit;
- tier aggregation, pace multipliers, budget statuses, value streams, net
  ranges, exclusions, and payback match hand calculations;
- partial revenue/risk inputs stay `not_estimated`;
- identical seeds reproduce the same stress trace and different seeds can vary
  only delay/adoption events, never headline ROI;
- all event references resolve and remain stably sorted;
- persistence handles round-trip, overrides, preference, corrupt,
  incompatible, and every stale dimension.

### Golden cases

- Case A matches every capability, cost, operational value, net value, payback,
  budget-fit, conditional-AI, and exclusion value frozen in Model 1.0.0;
- an explicit fictional Case A revenue override activates gross-profit value
  without mutating the Business Twin;
- Case B prioritises foundation/workflow sequencing and does not unlock AI from
  low data/process readiness;
- Case C does not re-add active foundations and may include a feasible governed
  AI path only when its Stage 03 recommendation and prerequisites permit it.

### Render and integration

- recommendations reaches scenarios;
- valid scenarios restore after refresh;
- upstream revision invalidates the result;
- editing assumptions updates displayed outputs immediately;
- missing optional value streams show `Not estimated` and missing fields;
- conditional AI is visibly distinct and excluded from committed ROI;
- preferred selection persists;
- source/rationale and full formulas are inspectable;
- no advisor, blueprint, lead, fake quote, guarantee, or model request appears;
- desktop and actual 360 px layouts pass semantics, keyboard, contrast,
  collision, target-size, and horizontal-overflow checks.

## 8. Acceptance gate

The main task accepts Stage 04 only when:

1. lint, type-check, all tests, and production build pass independently;
2. the provider-neutral boundary scan is clean;
3. all Model 1.0.0 arithmetic and Case A values are independently checked;
4. three scenarios recalculate immediately from edited valid assumptions;
5. prerequisites, conditional AI, budget fit, exclusions, and stale persistence
   behave exactly as specified;
6. desktop and 360 px implementations are reviewed against the approved Stage
   04 design family;
7. GitHub pull-request CI passes and review corrections are resolved;
8. no Stage 05+ implementation is present.

Return the exact changed-file list, commands/results, Case A values, browser
checks, screenshots, assumptions, and limitations. Do not mark the stage
accepted and do not merge the branch.

## 9. Acceptance record

Accepted by the main planning/integration task on 17 September 2026 after two
implementation correction cycles and a cross-stage domain-boundary correction.

- Lint and TypeScript checks passed independently.
- All 12 test files and 74 tests passed independently.
- The production build emitted all eight expected product routes.
- Exact frozen Case A cost, operational-value, net-value, payback, budget-fit,
  and conditional-expansion figures matched.
- Editable assumptions retained `user_override` provenance, monthly state
  reconciled to numeric events, and invalid edits preserved the last valid result.
- The reusable core contained no current Exabytes capability, prerequisite, or
  scenario-template identifiers.
- Desktop and 360 px browser checks passed with 44 px targets, no horizontal
  overflow, and no console or framework-overlay errors.
- GitHub pull request #2 passed repository CI before this acceptance transition.
