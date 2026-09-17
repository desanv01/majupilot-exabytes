# Stage 02 - Deterministic Intelligence

Status: **Accepted on 2026-09-17 after one correction cycle**  
Implementer profile: **GPT-5.6 Sol, medium reasoning**  
Prerequisite: **Stage 01 accepted**  
Gate owner: **Main task**

## 1. Objective

Turn an accepted Business Twin into a reproducible, evidence-linked diagnosis:

1. a digital-maturity score with six dimensions;
2. an AI-readiness score with four dimensions;
3. confidence and missing-evidence treatment that never turns unknown into zero;
4. ranked business pain points with traceable component scores;
5. a finite analysis transition and a responsive results overview.

No live model is needed. The same Business Twin and rule versions must always
produce the same diagnostic values. Stage 02 does not recommend Exabytes
products, calculate ROI, run scenarios, invoke advisors, generate a blueprint,
or create a lead.

## 2. Required reading

Read completely before implementation:

1. `planning/MASTER-GAMEPLAN.md`, especially sections 3, 8, 9, 10, 17,
   18, 19, 20, 21, 24, 27, and 28;
2. `planning/DECISION-REGISTER.md`;
3. `planning/MIROFISH-REFERENCE-MAP.md`;
4. `planning/EXECUTION-ORCHESTRATION.md`;
5. `planning/stages/STAGE-00-FOUNDATION.md`;
6. `planning/stages/STAGE-01-DISCOVERY-BUSINESS-TWIN.md`;
7. `planning/design/stage-01/DESIGN-REVIEW.md` and approved Candidate D assets;
8. `planning/design/stage-02/DESIGN-REVIEW.md`, its four approved screen
   references, and the responsive results baseline;
9. `sme-growth-twin/docs/architecture.md`;
10. the current Stage 01 domain, core, persistence, components, and tests.

MiroFish may be inspected read-only for lifecycle, traceability, staged
processing, and report-explanation ideas. Do not copy its UI, prompts, routes,
state code, terminology, or implementation.

## 3. Non-negotiable boundaries

- Arithmetic, bands, ranking, tie-breaking, and explanations are pure
  deterministic TypeScript.
- Core modules receive data and rule packs as inputs; they do not access the
  DOM, local storage, routes, network, current time, or random IDs.
- `unknown` and `null` are unavailable evidence, never zero capability.
- Free-text interpretation is not introduced in this stage. Only explicit
  structured answers and normalized Business Twin fields may trigger rules.
- Every displayed finding links to the evidence records used to produce it.
- Rule metadata is versioned independently from the Business Twin schema.
- Results are invalidated and recomputed when `twinRevision` or either rule
  version changes.
- No Stage 03+ output or placeholder that looks like a real recommendation is
  allowed.

## 4. Versioned result contract

Create strict Zod schemas and inferred TypeScript types for:

### 4.1 Diagnostic result

```text
DiagnosticResult
  id
  assessmentSessionId
  businessTwinId
  twinRevision
  generatedAt
  scoreModelVersion = 1.0.0
  painModelVersion = 1.0.0
  digitalMaturity
  aiReadiness
  painPoints[]
```

The generated ID and timestamp are injected. Calculation output must otherwise
be identical for identical input and rule versions.

### 4.2 Metric result

Each overall metric contains:

- `value`: 0-100 rounded to one decimal, or `null` when no evidence exists;
- `bandId` and user-facing `bandLabel`;
- `confidence`: 0-1 rounded to two decimals;
- `confidenceBand`: `low`, `medium`, or `high`;
- `dimensions[]`;
- `evidenceIds[]`, unique and stably ordered;
- `missingEvidence[]` using user-facing labels;
- strongest positive factor;
- largest limiting factor;
- one concrete improvement action;
- rules version.

Each dimension contains its stable ID, label, configured weight, nullable
score, confidence, available evidence weight, total evidence weight,
contributions, evidence IDs, and missing-evidence labels.

### 4.3 Pain-point result

Each pain point contains:

- stable pain ID and title;
- `impact`, `urgency`, `strategicAlignment`, `confidence`, and `priority`, each
  0-100 and rounded to one decimal;
- mechanism in plain business language;
- affected capability IDs;
- evidence IDs;
- trigger codes for auditability;
- pain-model version.

Sort pain points by descending priority, then descending impact, then stable ID
ascending. Persist all triggered pain points and display the top three in the
overview.

## 5. Shared calculation rules

### 5.1 Capability-state points

| State | Points | Availability |
|---|---:|---:|
| `not_used` | 0 | 1 |
| `informal` | 40 | 1 |
| `active` | 100 | 1 |
| `unknown` | excluded | 0 |

### 5.2 Readiness points

| Answer | Points | Availability |
|---:|---:|---:|
| 1 | 0 | 1 |
| 2 | 25 | 1 |
| 3 | 50 | 1 |
| 4 | 75 | 1 |
| 5 | 100 | 1 |
| `null` | excluded | 0 |

### 5.3 Weighted score and confidence

For a dimension:

```text
score = sum(input_points * input_weight for available inputs)
        / sum(input_weight for available inputs)

confidence = available_input_weight / total_input_weight
```

For an overall metric, re-normalize across dimensions whose score is available:

```text
overall = sum(dimension_score * dimension_weight for available dimensions)
          / sum(dimension_weight for available dimensions)

confidence = sum(dimension_confidence * dimension_weight)
             / sum(all configured dimension weights)
```

If no input is available, the value is `null`, the band is
`insufficient_evidence`, and confidence is zero. Never silently coerce missing
evidence to zero.

Confidence bands:

- `high`: confidence >= 0.85;
- `medium`: confidence >= 0.60 and < 0.85;
- `low`: confidence < 0.60.

## 6. Digital-maturity model 1.0.0

The dimension weights are frozen by the master gameplan and total 100%.

| Dimension | Overall weight | Inputs within dimension |
|---|---:|---|
| Website and commerce | 15% | `websiteOrStore` 100% |
| Cloud and collaboration | 15% | `businessEmail` 35%; `cloudProductivity` 65% |
| CRM and customer operations | 20% | `crm` 100% |
| Marketing and measurement | 15% | `digitalMarketingAnalytics` 100% |
| Cybersecurity and continuity | 20% | `cybersecurityControls` 45%; `backup` 55% |
| AI adoption | 15% | `aiTools` 100% |

Digital-maturity bands:

- 0-24.9: `starting` / Starting;
- 25-49.9: `building` / Building foundations;
- 50-74.9: `connected` / Connected;
- 75-100: `optimizing` / Optimizing;
- no available evidence: `insufficient_evidence` / Insufficient evidence.

Improvement action comes from the lowest available dimension, breaking ties by
larger overall weight and then stable dimension ID. Use these fixed actions:

- website: establish an owned, measurable digital customer entry point;
- cloud: standardize business email and shared cloud collaboration;
- CRM: create one shared customer record and follow-up process;
- marketing: connect campaigns to consistent measurement;
- security: formalize core controls, backup, and recovery checks;
- AI: establish governed, task-specific AI use after data/process foundations.

## 7. AI-readiness model 1.0.0

| Dimension | Weight | Business Twin input |
|---|---:|---|
| Leadership sponsorship | 25% | `readiness.leadership` |
| Data availability and quality | 30% | `readiness.data` |
| Employee skills | 20% | `readiness.skills` |
| Process consistency | 25% | `readiness.process` |

`readiness.changeWillingness` is preserved as evidence for adoption-related pain
analysis but is not added to this score; this prevents changing the approved
four-dimension weights.

Readiness bands:

- 0-39.9: `foundation_first` / Foundation first;
- 40-59.9: `prepare_and_pilot` / Prepare and pilot;
- 60-79.9: `targeted_adoption` / Ready for targeted adoption;
- 80-100: `scale_responsibly` / Ready to scale responsibly;
- no available evidence: `insufficient_evidence` / Insufficient evidence.

Improvement actions are fixed per readiness dimension: secure accountable
sponsorship; improve usable structured data; build practical employee skills;
standardize the target process.

## 8. Explanation construction

- Contributions and evidence IDs are sourced from the Business Twin evidence
  links for the exact capability/readiness fact.
- Missing evidence names the question in user language, never an internal key.
- Strongest positive factor is the highest available dimension score; ties use
  configured dimension order.
- Largest limiting factor is the lowest available dimension score; ties use
  larger overall weight, then configured order.
- If there is no available dimension, both factor texts explicitly say that
  more evidence is required.
- Explanations are selected from versioned templates; do not ask an LLM to
  phrase them.

## 9. Pain model 1.0.0

### 9.1 Shared component calculation

For each triggered pain definition:

```text
priority = impact * 0.35
         + urgency * 0.25
         + strategic_alignment * 0.20
         + confidence * 0.20
```

Urgency starts from the explicit Q3 urgency mapping `1→20, 2→40, 3→60,
4→80, 5→100`. Add 10, capped at 100, when implementation pace is
`within_30_days`. Confidence is the arithmetic mean of the unique linked
evidence-record confidences multiplied by 100. If no valid evidence is linked,
the pain point must not be emitted.

Strategic alignment is 100 for an objective in the pain definition's primary
objective set, 75 for a secondary objective, and 50 otherwise.

Impact begins at 90 when the pain matches the explicit biggest challenge; it
begins at 65 when triggered only by capability/readiness evidence. Add 10 for
an applicable severe structured signal below, capped at 100.

### 9.2 Allowed pain definitions

1. `pain_customer_followup`
   - explicit challenge: `customer_management`;
   - capability trigger: CRM is `not_used` or `informal`;
   - severe signal: customer records are `messaging_apps`, `paper`,
     `multiple_places`, or `none`;
   - primary objectives: `increase_revenue`, `acquire_customers`,
     `improve_retention`;
   - affected capabilities: `crm`, `workflow_automation`.

2. `pain_manual_work`
   - explicit challenge: `manual_work`;
   - capability trigger: manual hours are known and >= 5, including the
     normalized manual-hours follow-up band;
   - severe signal: manual hours >= 11 or affected employees >= 5;
   - primary objectives: `reduce_cost`, `increase_productivity`;
   - affected capabilities: `workflow_automation`, `cloud_productivity`.

3. `pain_security_continuity`
   - explicit challenge: `security_continuity`;
   - capability trigger: backup or cybersecurity controls are `not_used`;
   - severe signal: backup frequency is `none` or `ad_hoc`, or security is the
     highest concern;
   - primary objectives: `strengthen_resilience`;
   - affected capabilities: `cybersecurity`, `backup_recovery`.

4. `pain_lead_generation`
   - explicit challenge: `lead_generation`;
   - capability trigger: website/store or marketing/analytics is `not_used`;
   - severe signal: website/store and marketing/analytics are both below
     `active`;
   - primary objectives: `increase_revenue`, `acquire_customers`;
   - affected capabilities: `digital_presence`, `marketing_measurement`.

5. `pain_collaboration`
   - explicit challenge: `team_collaboration`;
   - capability trigger: business email or cloud productivity is `not_used`;
   - severe signal: both are below `active`;
   - primary objectives: `increase_productivity`, `reduce_cost`;
   - affected capabilities: `business_email`, `cloud_productivity`.

6. `pain_data_visibility`
   - explicit challenge: `data_visibility`;
   - capability trigger: data readiness <= 2 or marketing/analytics is
     `not_used`;
   - severe signal: data readiness <= 2 and CRM is below `active`;
   - primary objectives: `increase_productivity`, `increase_revenue`,
     `launch_ai_capability`;
   - affected capabilities: `data_foundation`, `analytics`.

7. `pain_scaling_operations`
   - explicit challenge: `scaling_operations`;
   - capability trigger: process consistency <= 2;
   - severe signal: affected employees >= 5 or manual hours >= 11;
   - primary objectives: `increase_productivity`, `increase_revenue`;
   - affected capabilities: `process_standardization`, `workflow_automation`.

8. `pain_ai_foundation`
   - explicit challenge: none;
   - capability trigger: primary objective is `launch_ai_capability` and any of
     data, skills, or process readiness is <= 2;
   - severe signal: two or more of those readiness dimensions are <= 2;
   - primary objective: `launch_ai_capability`;
   - affected capabilities: `data_foundation`, `ai_governance`.

Use fixed, user-facing titles and mechanisms stored in the pain rule pack.
Follow-up bands must have explicit numeric normalization for threshold checks:
`under_5→2.5`, `5_10→7.5`, `11_20→15.5`, `21_40→30.5`, `over_40→41`.

## 10. Routes and interaction

### `/assessment/review`

`Confirm Business Twin` must synchronously save the ready draft and navigate to
`/assessment/analysis`. It must no longer end at a Stage 01-only notice.

### `/assessment/analysis`

- Validate and rebuild the current Business Twin from the persisted draft.
- Run a finite visible sequence: validating evidence, calculating maturity,
  calculating AI readiness, ranking pain points, preparing results.
- This sequence represents completed local deterministic work; it must not imply
  a remote AI call.
- Provide a hard fallback: calculation error yields a useful retry/back state,
  never an indefinite spinner.
- Persist the validated diagnostic result before navigating to `/results`.
- Reduced-motion users may skip animation while retaining readable status.

### `/results`

- Overall digital maturity and AI readiness with bands and confidence.
- Six maturity-dimension rows and four readiness-dimension rows.
- Largest three gaps and top three ranked pain points.
- Expandable explanation/evidence details for both scores and each pain point.
- Clear `Edit Business Twin` action that returns to review/assessment and causes
  stale diagnostics to be recomputed after revision change.
- Honest next-stage panel: capability recommendations arrive in Stage 03. Do not
  fabricate a recommendation or product.
- Unknown/missing evidence must be visible and understandable.

## 11. Persistence

Create a separate versioned local diagnostic adapter and storage key. Load must
distinguish empty, corrupt, incompatible, and stale. A result is stale when its
session, Business Twin ID/revision, score-model version, or pain-model version
does not match the rebuilt current input. Corrupt, incompatible, and stale
results are removed safely and recalculated through `/assessment/analysis`.

Do not broaden Stage 01's draft schema merely to embed all diagnostics.

## 12. Required tests

### Unit

- maturity dimension and overall weights total 100%;
- readiness weights total 100%;
- all non-null scores and components stay within 0-100;
- state and readiness point maps are exact;
- unknown/null evidence is excluded and lowers confidence;
- all-unknown input produces nullable score and insufficient-evidence band;
- adding capability maturity cannot reduce that same dimension;
- band boundaries are exact;
- strongest/limiting factor tie-breaking is stable;
- evidence IDs are valid, unique, and limited to used evidence;
- rule versions appear in output;
- all eight pain definitions have positive and negative fixtures;
- priority arithmetic and stable tie-breaking are exact;
- no evidence means no pain emission;
- identical inputs and factories produce identical results;
- result storage handles round-trip, corrupt, incompatible, and stale states.

### Golden cases

- Case A exact score expectations under model 1.0.0 are digital maturity 37.5
  (`building`, confidence 1.00) and AI readiness 42.5
  (`prepare_and_pilot`, confidence 1.00). Maturity dimensions are 100, 26, 0,
  100, 18, and 0 in configured order; readiness dimensions are 75, 25, 50,
  and 25. Customer follow-up ranks first; data visibility and scaling
  operations follow under stable tie-breaking. Security/continuity and
  manual-work pains must also be emitted and evidence-linked.
- Add Case B and Case C fixtures from the master gameplan and assert meaningful
  contrasts rather than arbitrary single magic totals.
- These Case A values are frozen by the main-task review of the documented
  formulas. Do not tune rules merely to make a fixture pass.

### Render/integration

- review confirmation reaches analysis;
- analysis completes without network/model access and persists a result;
- results reload from a valid result;
- twin revision change invalidates the old result;
- explanation controls expose evidence and missing evidence;
- no recommendation, product, ROI, scenario, advisor, blueprint, or lead output
  appears;
- mobile 360 px and desktop layouts have no collision or overflow;
- keyboard focus, semantics, reduced motion, and contrast remain usable.

## 13. Acceptance gate

The main task accepts Stage 02 only when:

1. lint, type-check, all tests, and production build pass independently;
2. the deterministic rule packs and output schemas match this packet;
3. Case A runs from accepted review through analysis to results with no LLM;
4. score arithmetic, confidence, missing evidence, pain ranking, and evidence
   links are independently inspected;
5. edit/revision invalidation and refresh persistence work;
6. desktop and 360 px results are visually reviewed against the approved design
   family;
7. no Stage 03+ behavior is present.

After implementation, leave the stage unaccepted and return exact command
results, route checks, Case A values, and screenshot paths to the main task.
