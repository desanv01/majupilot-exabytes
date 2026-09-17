# Stage 01 - Discovery and Business Twin

Status: **Accepted on 2026-09-17 after two correction cycles**  
Implementer profile: **GPT-5.6 Sol, medium reasoning**  
Prerequisite: **Stage 00 accepted**  
Gate owner: **Main task**

## 1. Objective

Deliver the first complete user-facing vertical slice: a Malaysian SME owner can
start an assessment, complete five concise grouped questions, receive no more
than three deterministic follow-ups when useful, review/edit the normalized
Business Twin, refresh the browser without losing progress, and clearly see
that analysis is the next stage.

This stage captures and normalizes evidence. It does not calculate scores,
rank pain points, recommend products, simulate scenarios, or call an LLM.

## 2. Required reading

Read these files completely before implementation:

1. `planning/MASTER-GAMEPLAN.md`, especially sections 3, 6, 7, 8, 17, 18, 21, 22, 24, 25, and 27;
2. `planning/DECISION-REGISTER.md`;
3. `planning/MIROFISH-REFERENCE-MAP.md`;
4. `planning/EXECUTION-ORCHESTRATION.md`;
5. `planning/stages/STAGE-00-FOUNDATION.md`;
6. `sme-growth-twin/docs/architecture.md`;
7. `planning/design/stage-01/DESIGN-REVIEW.md` and the approved images it references.

MiroFish may be inspected read-only for staged workflow and lifecycle ideas.
Do not copy its UI, state-management code, text, prompts, routes, or structure.

## 3. User journey

```text
Home
  -> Start assessment
  -> Q1 Business identity and context
  -> Q2 Current digital foundation
  -> Q3 Main business friction
  -> Q4 Growth objective and constraints
  -> Q5 AI and change readiness
  -> 0-3 conditional follow-ups
  -> Business Twin review and edit
  -> Assessment ready for analysis (Stage 02 handoff)
```

Target: the five core steps take 2-3 minutes and the whole Stage 01 journey
remains under four minutes in the Case A fixture.

## 4. Canonical routes and screen states

- `/`: retain product identity; replace foundation-only status with one primary `Start assessment` action and a short trust/explainability statement.
- `/assessment`: the single wizard route. Step is application state, not five duplicated routes.
- `/assessment/review`: normalized Business Twin review with section-level edit links back to `/assessment?step=N`.

Required wizard states:

- empty/new;
- valid partially completed;
- field validation error;
- saved locally;
- restored after refresh;
- corrupted/incompatible local state safely discarded with a clear message;
- follow-up sequence;
- complete and ready for review.

The browser back button, explicit Back action, and edit-from-review action must
not erase valid answers. Do not create an unusable dead-end at the end.

## 5. Exact core question contract

Create versioned Zod schemas and TypeScript types for each step. Labels may be
polished for clarity, but meaning and value codes must remain stable.

### Q1 - Business identity and context

| Field | Contract |
|---|---|
| `businessName` | required trimmed string, 2-100 characters |
| `industry` | one of `food_beverage`, `retail_ecommerce`, `professional_services`, `manufacturing`, `technology_digital`, `health_wellness`, `education_training`, `logistics_distribution`, `construction_property`, `other` |
| `industryOther` | required 2-80 characters only when industry is `other` |
| `businessModel` | `b2b`, `b2c`, or `hybrid` |
| `employeeBand` | `1_9`, `10_24`, `25_49`, `50_99`, or `100_plus` |
| `description` | required trimmed string, 10-500 characters |

### Q2 - Current digital foundation

Each capability uses `not_used`, `informal`, `active`, or `unknown`:

- `websiteOrStore`;
- `businessEmail`;
- `cloudProductivity`;
- `crm`;
- `digitalMarketingAnalytics`;
- `backup`;
- `cybersecurityControls`;
- `aiTools`.

Explain the four choices in plain language. `unknown` is valid and must lower
confidence later; it must never be silently converted to `not_used`.

### Q3 - Main business friction

| Field | Contract |
|---|---|
| `biggestChallenge` | `lead_generation`, `customer_management`, `manual_work`, `team_collaboration`, `data_visibility`, `security_continuity`, `scaling_operations`, or `other` |
| `challengeOther` | required 2-120 characters only for `other` |
| `manualWorkflow` | required trimmed string, 3-300 characters |
| `manualHoursPerWeek` | integer 0-168 or `null` for not sure |
| `affectedEmployees` | integer 1-10000 or `null` for not sure |
| `urgency` | integer 1-5 with visible anchors |

### Q4 - Growth objective and constraints

| Field | Contract |
|---|---|
| `primaryObjective` | `increase_revenue`, `acquire_customers`, `improve_retention`, `reduce_cost`, `increase_productivity`, `strengthen_resilience`, or `launch_ai_capability` |
| `budgetBand` | `under_5k`, `5k_15k`, `15k_50k`, `50k_plus`, or `unknown` |
| `implementationPace` | `within_30_days`, `1_3_months`, `3_6_months`, or `6_12_months` |
| `highestConcern` | `cost`, `complexity`, `security`, `adoption`, or `disruption` |

Currency context is Malaysian ringgit, but Stage 01 does not attach exact costs
or infer a budget midpoint.

### Q5 - AI and change readiness

Each field is `1`, `2`, `3`, `4`, `5`, or `null` for not sure:

- `leadershipSponsorship`;
- `usableData`;
- `employeeDigitalSkills`;
- `processConsistency`;
- `changeWillingness`.

Show consistent anchors: 1 = very limited, 3 = developing, 5 = strong. Do not
present these values as an AI-readiness score in this stage.

## 6. Deterministic follow-up policy

Follow-up selection is a pure, versioned function. It returns at most three
unique questions ordered by `priority DESC`, then stable question ID. Every
question includes a one-sentence `whyWeAsk` shown to the user.

Implement this initial registry:

| ID | Trigger | Captured value | Priority | Why it can change a later decision |
|---|---|---|---:|---|
| `fu_manual_hours` | `manualHoursPerWeek` is null | hours band: `under_5`, `5_10`, `11_20`, `21_40`, `over_40`, `unknown` | 100 | materially affects pain and ROI estimates |
| `fu_customer_records` | challenge is lead/customer management and CRM is `not_used`, `informal`, or `unknown` | `spreadsheets`, `messaging_apps`, `accounting_system`, `paper`, `multiple_places`, `unknown` | 90 | changes CRM need and migration complexity |
| `fu_backup_frequency` | backup is `not_used` or `unknown`, or highest concern is security | `none`, `ad_hoc`, `weekly`, `daily`, `managed`, `unknown` | 80 | changes continuity and security urgency |
| `fu_sales_channel` | website/store is `active` or objective is acquire customers/increase revenue | `physical_only`, `social_messaging`, `marketplace`, `own_website`, `multiple`, `unknown` | 70 | changes commerce and marketing capability needs |
| `fu_ai_usage` | AI tools are `informal` or `active` | short multi-select from `content`, `customer_support`, `analysis`, `administration`, `development`, `other`, `unknown` | 60 | separates experimentation from governed adoption |
| `fu_change_barrier` | any readiness field is 1 or 2, or highest concern is adoption/disruption | `time`, `skills`, `leadership_alignment`, `employee_resistance`, `unclear_value`, `other`, `unknown` | 50 | changes adoption risk and sequencing |

Rules:

- evaluate after Q5;
- ask only triggered questions;
- select at most three;
- never repeat a fact already known;
- every answer supports `unknown`;
- preserve selected follow-up IDs for replay even if the user edits an earlier answer; on recalculation, clearly reconcile obsolete answers rather than attaching them to the wrong question;
- no LLM decides or phrases the follow-up set in Stage 01.

## 7. Business Twin v1 contract

Extend the Stage 00 `BusinessTwin` schema without removing its identifier,
revision, schema version, facts, evidence, assumptions, or generated timestamp.

Add these normalized sections:

```text
identity
  businessName, industry, industryOther?, businessModel, employeeBand, description
objectives[]
  objectiveId, type, timeHorizonMonths
capabilities[]
  capabilityId, currentState, evidenceIds[], confidence
processes[]
  processId, name, manualHoursPerWeek?, participants?, painSignals[], evidenceIds[]
constraints
  budgetBand, implementationPace, concerns[]
readiness
  leadership, data, skills, process, changeWillingness
followUps[]
  questionId, answer, whyWeAsked
```

Evidence generated from answers must contain:

- stable evidence ID;
- `source = user_fact`;
- originating core question or follow-up ID;
- raw answer;
- normalized value;
- captured time;
- confidence.

Use confidence `1` for explicit structured answers and a lower documented value
for `unknown`/not-sure inputs. Do not invent evidence or assumptions. The
mapping from assessment answers to Business Twin is a pure deterministic
function with injected ID/time factories for reproducible tests.

## 8. State and persistence decision

For the hackathon assessment path, persist a versioned assessment draft in
browser `localStorage` through an infrastructure adapter. This is not the final
production persistence architecture.

Requirements:

- schema-validate data both when saving and restoring;
- use one namespaced key containing schema version;
- never place storage access in `src/core` or `src/domain`;
- work without authentication, database, model provider, or network;
- show `Saved on this device`, never imply cloud sync;
- recover safely from invalid JSON or an incompatible version;
- provide an explicit `Start over` action with confirmation;
- keep the pure assessment reducer and twin builder independently testable.

Do not add Zustand/Redux or a database for this stage. React reducer/context and
a narrow storage adapter are sufficient.

## 9. Visual and interaction contract

The approved Candidate D screen family under
`planning/design/stage-01/branch/screens` is the visual target. The successful
responsive baseline is
`planning/design/stage-01/converted/current-digital-foundation/winner.html`.
The generated artifacts govern composition and visual language only; the stage
packet and `planning/design/stage-01/DESIGN-REVIEW.md` govern content, behavior,
scope, and mandatory corrections.

Regardless of the chosen direction, preserve:

- high-trust advisory tone for Malaysian SME owners;
- visible progress and estimated remaining time;
- one grouped question per screen;
- large, clear selection targets;
- short definitions beside unfamiliar terms;
- persistent Back/Continue actions without covering content;
- desktop and 360px mobile usability;
- semantic labels, fieldsets/legends, error association, focus management, and keyboard operation;
- AA contrast, visible focus, reduced-motion support, and no information conveyed by color alone;
- calm loading/restoration states and no fake AI animation;
- facts and unknowns visibly distinct on review.

Avoid generic purple AI gradients, chatbot bubbles, decorative dashboards,
unnecessary glassmorphism, fake scores, and dense enterprise forms.

After implementation, run the 12ui improve/target close workflow against the
approved image and apply the resulting fidelity fixes without changing the
functional contract.

## 10. Expected implementation areas

The exact file split may follow established Next.js conventions, but the stage
should primarily affect:

```text
src/app/page.tsx
src/app/assessment/page.tsx
src/app/assessment/review/page.tsx
src/components/assessment/*
src/core/assessment/*
src/domain/assessment.ts
src/domain/business-twin.ts
src/domain/ids.ts
src/infrastructure/persistence/local-assessment-store.ts
tests/unit/assessment-*.test.ts
tests/unit/business-twin-*.test.ts
tests/unit/local-assessment-store.test.ts
tests/unit/page-smoke.test.tsx
```

Add route-level or component tests using the lightest reliable approach. A new
testing dependency requires a clear reason. Do not add a general UI kit merely
to implement common form controls.

## 11. Required tests

At minimum prove:

1. every core step accepts a valid answer and rejects invalid/conditional fields;
2. `unknown` remains unknown and is not normalized to zero/false/not-used;
3. the follow-up selector is deterministic, stable, unique, and never returns more than three;
4. a no-trigger case returns zero follow-ups;
5. Case A produces the expected three highest-priority follow-ups;
6. answer-to-twin mapping is deterministic with injected IDs/time;
7. each normalized capability references existing evidence;
8. facts, assumptions, computed values, and model interpretations are not conflated;
9. valid local state round-trips and invalid/corrupt state is rejected safely;
10. Back/edit actions preserve answers and rebuilding increments or deliberately controls twin revision;
11. home, wizard, follow-up, and review states render without fabricated scores or recommendations;
12. deterministic core still passes the architecture-boundary test.

## 12. Out of scope

Do not implement:

- maturity or readiness score calculation;
- pain-point ranking;
- recommendation/catalogue logic;
- ROI, scenarios, advisors, blueprint, PDF, or leads;
- an LLM call or provider adapter;
- server/database persistence or authentication;
- document upload;
- deployment;
- P1/P2 features.

## 13. Required validation

Run and report:

```text
npm run lint
npm run type-check
npm test
npm run build
```

Also manually verify at desktop and 360px mobile widths:

- full Case A completion;
- keyboard-only navigation;
- refresh restoration;
- one validation failure and recovery;
- edit from review and return;
- corrupt storage recovery;
- Start over confirmation.

Capture screenshots of the implemented core question state and Business Twin
review for main-task visual inspection.

## 14. Acceptance criteria

The main task may accept Stage 01 only if:

1. the five-step journey and bounded follow-ups are complete and understandable;
2. all input is schema validated and unknowns remain explicit;
3. the Business Twin matches the approved normalized structure with evidence traceability;
4. progress survives refresh and corrupt state fails safely;
5. the UI follows the approved visual target and accessibility contract at desktop and mobile widths;
6. no score, recommendation, scenario, advisor, or fake AI output appears;
7. deterministic logic is pure and independent of browser, database, and model provider;
8. required automated and manual checks pass;
9. the implementer returns exact evidence and stops for main review.

## 15. Required completion report

Return:

- outcome and user journey summary;
- files created, changed, or removed;
- schema and mapping decisions;
- follow-up selection evidence;
- dependency changes and reasons;
- exact commands and results;
- automated-test counts and what they prove;
- manual desktop/mobile/accessibility/restoration results;
- screenshot paths;
- known limitations or risks;
- explicit confirmation that Stage 02+ work and deployment were not started.

Then stop and wait for main-task review.
