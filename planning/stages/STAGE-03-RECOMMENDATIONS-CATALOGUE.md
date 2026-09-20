# Stage 03 - Recommendations and Catalogue

Status: **Accepted on 17 September 2026 after two focused correction cycles**  
Implementer profile: **GPT-5.6 Sol, medium reasoning**  
Prerequisite: **Stage 02 accepted**  
Gate owner: **Main task**

## 1. Objective

Turn an accepted Business Twin and Stage 02 diagnostic into a deterministic,
evidence-linked action sequence that:

1. ranks business capabilities before products;
2. distinguishes `why now`, `next`, and `why later`;
3. enforces prerequisites, budget, time-to-value, risk, and data readiness;
4. maps eligible capabilities only to Catalogue 1.0.0 offerings;
5. explains every decision with the exact user evidence and rule components;
6. extends the responsive results journey into recommendation overview and
   detail screens.

Stage 03 does not calculate ROI, build scenarios, invoke advisors, generate a
blueprint/report, collect a lead, or contact Exabytes.

## 2. Required reading

Read completely before implementation:

1. `planning/MASTER-GAMEPLAN.md`, especially sections 8-13, 17-25, and 27-28;
2. `planning/DECISION-REGISTER.md`;
3. `planning/EXECUTION-ORCHESTRATION.md`;
4. all prior stage packets;
5. `planning/catalogue/EXABYTES-CATALOGUE-1.0.0.md`;
6. `planning/design/stage-03/DESIGN-REVIEW.md` and its approved references;
7. current domain, assessment, scoring, pain, persistence, UI, and test code.

Implement evidence-to-decision traceability, staged report construction, and
interaction patterns through this project's own contracts and code.

## 3. Non-negotiable boundaries

- Pure deterministic TypeScript owns candidate generation, component scores,
  prerequisites, ranking, status, sequencing, and offering mapping.
- No model or network call is required to produce recommendations.
- No product can be selected before its capability.
- Product facts must be literal data from Catalogue 1.0.0. Free text and an LLM
  may not add features, prices, compatibility, guarantees, or vendor claims.
- Unknown evidence is never silently treated as a positive prerequisite.
- A failed hard prerequisite produces `why_later`; it cannot be offset by a
  high weighted score.
- Capability advice survives catalogue failure; product mapping fails closed.
- Core modules accept rule/catalogue data and never import Exabytes identifiers.
- Every persisted result is invalidated by input revision or rule/catalogue
  version changes.

## 4. Versioned contracts

Add strict Zod schemas and inferred types for:

### 4.1 Capability definition

```text
CapabilityDefinition
  id, title, outcome
  primaryGapIds[], supportingGapIds[]
  costTier (1..4), effortTier (1..4)
  applicableObjectives[]
  risks[]
  prerequisiteRules[]
  defaultRoadmapPhase
```

### 4.2 Catalogue and mapping

```text
Offering
  id, provider, name, active
  capabilityIds[]
  approvedFactSummary
  relativeCostTier
  pricingTreatment = verify_current_quote
  sourceUrl, sourceLabel, verifiedAt, catalogueVersion

OfferingMapping
  capabilityId, offeringId
  selectionRuleId, mappingReason
```

Validate `https` source URLs, stable unique IDs, active entries, known
capabilities, and catalogue version `1.0.0`. The core sees generic offerings;
the Exabytes pack supplies the data.

### 4.3 Recommendation result

```text
RecommendationResult
  id, assessmentSessionId, businessTwinId, twinRevision
  diagnosticResultId
  recommendationModelVersion = 1.0.0
  catalogueVersion = 1.0.0
  generatedAt
  recommendations[]

CapabilityRecommendation
  rank, capabilityId, title, outcome
  fitScore and six ComponentScores
  status = why_now | next | why_later
  whySelected, whyNowOrLater
  addressedPainPointIds[], evidenceIds[]
  prerequisites[] with met | unmet | unknown
  expectedImpact, effortTier, relativeCostTier, timeToValueTier
  risks[], roadmapPhase
  mappedOffering? with approved facts/source/version
  alternativeOfferingIds[]
```

IDs and timestamps are injected. Identical inputs, rule packs, and catalogue
must otherwise yield identical output.

## 5. Capability catalogue 1.0.0

| Capability | Primary gaps | Supporting gaps | Cost | Effort | Default phase |
|---|---|---|---:|---:|---|
| `shared_customer_operations` | `crm`, `data_foundation` | `workflow_automation` | 2 | 2 | Connect |
| `protected_business_continuity` | `backup_recovery`, `cybersecurity` | - | 1 | 1 | Foundation |
| `professional_team_collaboration` | `business_email`, `cloud_productivity` | `process_standardization` | 1 | 1 | Foundation |
| `measurable_digital_growth` | `digital_presence`, `marketing_measurement` | `analytics` | 1 | 1 | Connect |
| `protected_web_presence` | `cybersecurity` when a website is active | `digital_presence` | 2 | 2 | Connect |
| `scalable_cloud_operations` | evidenced infrastructure/scaling need only | `process_standardization` | 4 | 4 | Optimize |
| `governed_ai_automation` | `ai_governance` | `workflow_automation` | 3 | 3 | Optimize |

Candidate generation uses the union of capabilities with a primary match to a
triggered pain plus direct assessed gaps. Supporting gaps can strengthen an
existing candidate but cannot create one alone. `governed_ai_automation` may
also be emitted as `why_later` when AI tools are `not_used` and AI readiness is
below 60, so the sequence explicitly explains why AI is not first.

## 6. Recommendation model 1.0.0

Use the master formula exactly:

```text
fit = pain_point_fit * 0.30
    + prerequisite_readiness * 0.20
    + budget_fit * 0.15
    + time_to_value * 0.15
    + risk_fit * 0.10
    + data_readiness * 0.10
```

Round component values and the final fit to one decimal. Sort eligible
recommendations by fit descending, highest matched pain priority descending,
then stable capability ID ascending. Put `why_later` after eligible items,
using the same stable sort within that group.

### 6.1 Pain-point fit

- primary-gap match: use the highest matched pain priority;
- supporting-gap-only match on an already-created candidate: priority × 0.70;
- direct assessed gap with no pain: `not_used=60`, `informal=40`,
  `unknown=20`, `active=0`;
- use the maximum applicable value, never a sum.

### 6.2 Prerequisite readiness

Each prerequisite returns `met=100`, `partial=60`, `unknown=25`, or `unmet=0`;
average them, or use 100 when there are none.

Hard rules:

- `protected_web_presence` requires an active website/store;
- `scalable_cloud_operations` requires an explicit scaling/infrastructure need
  and leadership sponsorship >= 3;
- `governed_ai_automation` requires AI readiness >= 60, data readiness >= 3,
  process consistency >= 3, and leadership sponsorship >= 3.

Any hard rule that is unmet or unknown forces `why_later`.

### 6.3 Budget fit

Budget capacity is `under_5k=1`, `5k_15k=2`, `15k_50k=3`, `50k_plus=4`,
`unknown=2`. Compare it with the capability cost tier:

- capacity >= tier: 100;
- one tier short: 65;
- two tiers short: 30;
- three tiers short: 0.

This is relative implementation fit, not an Exabytes quote. A value below 50
forces `why_later`.

### 6.4 Time-to-value

Pace capacity is `within_30_days=1`, `1_3_months=2`, `3_6_months=3`,
`6_12_months=4`. Compare with effort tier: capacity >= effort gives 100; one
tier short gives 70; two or more tiers short gives 35.

### 6.5 Risk fit

- `cost`: use budget fit;
- `complexity`: effort 1=100, 2=80, 3=55, 4=30;
- `security`: continuity/web-protection capabilities=100, others=70;
- `adoption`: map change willingness `1..5` to `20,40,60,80,100`; unknown=50;
- `disruption`: effort 1=100, 2=80, 3=55, 4=30.

### 6.6 Data readiness

Map data readiness `1..5` to `0,25,50,75,100`; unknown=25.

- customer operations uses `max(50, mapped value)` because creating a shared
  record is itself foundational;
- measurable digital growth uses the mapped value;
- governed AI uses the mapped value with no floor;
- all other capabilities use 100.

### 6.7 Status and phase

- forced by a hard rule or budget < 50: `why_later`;
- otherwise top three eligible recommendations with fit >= 70: `why_now`;
- all other eligible recommendations: `next`.

Never hide a generated `why_later` item. Its unmet prerequisite and the action
that unlocks it must be displayed. Preserve the capability's default phase,
but move a forced-later capability to Optimize.

## 7. Offering mapping

Use the exact selection rules in
`planning/catalogue/EXABYTES-CATALOGUE-1.0.0.md`. A mapping occurs only after
status and capability ranking are known. A `why_later` capability may show a
future-fit offering, clearly labelled as not yet recommended for purchase.

Every mapped card displays:

- capability outcome first and vendor offering second;
- why it maps;
- only the approved fact summary;
- `Verify current quote with Exabytes`;
- official source link;
- catalogue version and verification date;
- a disclaimer that final plan/fit requires consultation.

External source links open safely in a new tab with `noopener noreferrer`.

## 8. Frozen Case A behavior

For Kopi Kita Café Group, the result must be plausible and stable:

- `shared_customer_operations` is the first `why_now` capability and maps to
  Freshsales CRM;
- `protected_business_continuity` and
  `professional_team_collaboration` are visible near-term capabilities, with
  their relative ordering determined by the formula and stable tie-breaks;
- professional collaboration maps to EBiz Mail Pro because professional email
  is absent and cost is the highest concern; Lark, Google Workspace, and
  Microsoft 365 appear only as consultant-validated alternatives;
- `governed_ai_automation` is visible as `why_later`, with low AI readiness,
  data readiness, and process consistency named as blockers;
- no price, savings, ROI, guarantee, or unsupported product detail appears.

Case B must favour collaboration/process/data foundations before AI. Case C
must not recommend already-active foundations merely to fill the page.

## 9. Routes and interaction

### `/results`

Replace the Stage 02 placeholder with a clear `View recommendations` action.
Keep score and pain evidence intact.

### `/recommendations`

- concise diagnostic carry-over for the current business;
- ranked capability sequence grouped into Why now, Next, and Why later;
- capability title/outcome before any product name;
- fit score plus readable six-component breakdown;
- addressed pain points and evidence access;
- phase, effort, relative cost, time-to-value, risk, and prerequisites;
- visible catalogue/version/source discipline;
- no ROI or scenario values; use an honest Stage 04 next-step panel.

### Recommendation detail

Use an accessible in-page disclosure, dialog, or
`/recommendations/[capabilityId]` route. It must show the full calculation,
evidence, prerequisite checks, mapping reason, approved facts, official source,
why-now/later explanation, alternatives, and limitations.

At 360 px, preserve one column, readable evidence, 44 px targets, no clipped
tables or sticky-action collisions, and no horizontal overflow.

## 10. Persistence

Create a separate local recommendation adapter/key. Load distinguishes empty,
corrupt, incompatible, and stale. Stale means any mismatch in session,
Business Twin ID/revision, diagnostic ID, score/pain/recommendation model
version, or catalogue version. Invalid data is removed safely and recomputed.

Do not embed recommendation results in the assessment or diagnostic schemas.

## 11. Required tests

### Unit

- weights total 100%; all components and fit remain 0-100;
- exact component tables, rounding, sort, and tie-breaking;
- primary/supporting/gap-only candidate rules;
- prerequisites and budget hard gates cannot be outweighed;
- unknown prerequisites fail closed;
- active capabilities are not manufactured as recommendations;
- status and roadmap rules;
- catalogue schema, unique IDs, HTTPS sources, version, and active-entry checks;
- no mapping before capability selection; unknown/expired mapping fails closed;
- product output is a strict subset of approved catalogue fields;
- identical inputs/factories produce identical results;
- persistence round-trip, corrupt, incompatible, and every stale dimension.

### Golden and integration

- exact frozen Case A behavior in section 8;
- meaningful Case B and C contrasts;
- results action reaches recommendations and refresh reloads valid data;
- editing the twin invalidates and recomputes recommendations;
- evidence IDs resolve to the current Business Twin/diagnostic;
- source links are safe; there is no price, ROI, scenario, advisor, blueprint,
  lead, or network/model dependency;
- desktop and actual 360 px layouts pass keyboard, semantics, reduced-motion,
  contrast, collision, and overflow checks.

## 12. Acceptance gate

The main task accepts Stage 03 only when:

1. lint, type-check, all tests, and production build pass independently;
2. contracts and pure rules match this packet;
3. Case A runs from Stage 02 results through the complete recommendation view;
4. capability-first ordering, hard gates, evidence, explanations, and catalogue
   allow-list are independently inspected;
5. stale/corrupt persistence and catalogue fail-closed behavior work;
6. desktop and 360 px screens are reviewed against the approved Stage 03
   design family;
7. no Stage 04+ behavior exists.

Return exact command results, Case A order/status/fit components, changed file
list, route checks, and screenshot paths. Do not mark the stage accepted.
