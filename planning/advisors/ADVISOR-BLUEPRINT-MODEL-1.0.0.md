# Advisor and Blueprint Model 1.0.0

Status: **Frozen**
Frozen: **18 September 2026**
Applies to: **Stage 05**

## 1. Purpose

Stage 05 turns one explicitly selected Stage 04 scenario into an evidence-first
review and an immutable Digital and AI Transformation Blueprint. Advisors may
challenge or qualify the plan, but cannot change assessment facts, scores,
recommendations, scenario membership, schedules, costs, ROI, or prerequisites.

## 2. Preconditions

A blueprint can be created only when all current records are valid and linked:

1. assessment draft and Business Twin;
2. diagnostic result;
3. recommendation result;
4. Scenario Comparison 1.0.0;
5. one `selectedScenarioId` that belongs to the comparison.

If no scenario is preferred, the UI returns the user to `/scenarios` with a
plain explanation. It never silently selects Balanced Growth.

## 3. Advisor roles

The domain pack defines exactly five roles in this order:

| ID | Objective | Required lens |
|---|---|---|
| `growth` | measurable acquisition, conversion, and retention | customer value, measurement gaps, growth prerequisites |
| `operations` | stable, lower-friction workflows | process readiness, dependencies, ownership, operational load |
| `finance` | protect cash flow and assumption quality | budget fit, payback, missing value streams, phased commitment |
| `cybersecurity` | reduce exposure and improve recovery | security dependencies, continuity, recovery evidence, new exposure |
| `change` | maximize adoption and delivery capacity | sequencing load, training, ownership, employee adoption |

Roles and their decision rules belong to the Exabytes domain pack. The reusable
core accepts definitions and review outputs as data.

## 4. Advisor review contract

Every role returns one strict record:

```ts
interface AdvisorReview {
  advisor: "growth" | "operations" | "finance" | "cybersecurity" | "change";
  position: "support" | "support_with_conditions" | "oppose" | "insufficient_evidence";
  headline: string;
  support: Finding[];
  concerns: Finding[];
  missingEvidence: Finding[];
  adjustments: Adjustment[];
  confidence: number; // 0..1
  origin: "model" | "deterministic_fallback";
  sourceRef: string; // prompt version or rule-pack version
}
```

Each `Finding` has a stable ID, concise statement, one or more valid evidence
IDs or result references, and a claim source. Unsupported model text is rejected
or placed in `missingEvidence`; an empty evidence list cannot support a claim.
Each `Adjustment` is advisory only and must reference an existing capability,
scenario intervention, assumption, or explicit missing-evidence requirement.

## 5. Bounded model context

The model receives only a redacted, structured review context:

- business sector, model, employee band, objective, constraints, and readiness;
- score values and evidence-linked pain points;
- approved capability recommendations and catalogue mappings;
- the selected scenario, interventions, dependencies, costs, value ranges,
  payback, assumptions, exclusions, warnings, and evidence IDs;
- its single advisor definition and allowed output schema.

Free-text business answers are delimited as untrusted data. Contact details,
credentials, environment variables, hidden prompts, unrelated local storage,
and other advisors' draft outputs are excluded.

## 6. Model execution and fallback

- Server-only Vercel AI SDK `generateText` with `Output.object({ schema })`.
- Vercel AI Gateway model ID is supplied by `AI_GATEWAY_MODEL`; no stale model
  name is hard-coded. Gateway credentials remain server-only.
- Maximum five advisor calls, at most one retry per role, bounded output, and a
  hard timeout. No tools and no model-written HTML.
- Calls may run concurrently, but results are restored to the frozen role order.
- A missing configuration, timeout, provider error, invalid object, invalid
  evidence reference, or unsafe claim triggers deterministic fallback for that
  role only.
- The UI labels every review `Live model review` or `Deterministic fallback`.
- Numeric values are copied from trusted records and never accepted from model
  output.

The provider-neutral core and full blueprint remain usable with no network.

## 7. Deterministic synthesis

The synthesis engine is pure TypeScript. It does not rewrite advisor language.

- `agreement`: a normalized topic supported or conditioned by at least four
  roles; records all contributing advisor IDs and evidence references.
- `disagreement`: opposing positions or conflicting adjustments for the same
  normalized topic; preserves both sides.
- `openQuestion`: missing-evidence topics raised by at least one role.
- `decision`: overall status is `proceed`, `proceed_with_conditions`, `revise`,
  or `insufficient_evidence` using a versioned rule table.
- `conditions`: de-duplicated adjustments and missing-evidence requirements.

Model confidence never overrides a hard prerequisite, budget state, or missing
numeric input. No advisor or synthesis result mutates upstream records.

## 8. Blueprint identity and immutability

`Blueprint 1.0.0` stores IDs and versions for every upstream record, the exact
selected scenario ID, advisor-review set, synthesis, generation timestamp, and
a stable blueprint ID. It embeds a validated snapshot for rendering but retains
the source identity chain for stale checks.

Changing any assessment revision, result ID/model version, catalogue version,
scenario/ROI version, selected scenario, advisor model version, or blueprint
model version invalidates the stored blueprint. Regeneration creates a new ID;
it does not silently edit the old record.

## 9. Required blueprint sections

1. Cover and assessment identity.
2. Executive summary with review origin disclosure.
3. Business profile.
4. Digital maturity and AI readiness.
5. Top five pain points.
6. Recommended capabilities and mapped catalogue offerings.
7. Three-scenario comparison.
8. Selected transformation plan.
9. ROI assumptions, ranges, formulas, exclusions, and budget fit.
10. Month-by-month roadmap with dependencies and capability ownership prompts.
11. Risks, warnings, and prerequisites.
12. Five advisor reviews.
13. Agreement, disagreement, conditions, and missing-evidence synthesis.
14. Consultant notes placeholder, clearly empty until a human adds notes.
15. Evidence, claim-provenance, versions, and methodology appendix.
16. Consultation preview explaining that consented handoff arrives in Stage 06.

## 10. Claim provenance

Every material displayed claim is labelled as one of:

- `user_fact`;
- `catalogue_fact`;
- `calculated_rule`;
- `scenario_assumption`;
- `model_interpretation`;
- `deterministic_fallback`;
- `human_note`.

Model and fallback interpretations are never styled as catalogue facts or
calculated outcomes.

## 11. Print and export

Stage 05 provides a print-optimized HTML blueprint and `Print / save as PDF`
through the browser print dialog. Print output must:

- use A4-friendly page margins and readable type;
- remove navigation, interactive controls, and stage-only notices;
- preserve headings with following content where practical;
- avoid clipped tables, cards, timelines, and evidence references;
- show the blueprint ID, generation date, version, page-safe URLs, assumptions,
  limitations, and provenance;
- never claim a server-generated PDF when none exists.

## 12. Frozen Case A review expectations

For the selected Balanced Growth scenario:

- Growth supports customer operations but conditions value claims on missing
  revenue/conversion evidence.
- Operations supports the dependency-aware sequence and flags process readiness
  and ownership.
- Finance flags `only_low_within`, the 30.4-month base payback, and unestimated
  revenue/risk; it recommends phased commitment without changing the scenario.
- Cybersecurity supports continuity/web protection and requests recovery-test
  evidence and accountable ownership.
- Change flags four committed initiatives and requires named owners, training,
  and adoption checkpoints.

The exact scenario figures remain Stage 04's values. Advisor text may explain
them but cannot replace or recalculate them.

## 13. Explicit exclusions

Stage 05 does not implement contact capture, consent submission, lead storage,
email/CRM delivery, authentication, production database storage, consultant
editing, report chat, or a server-side PDF generator. Those remain Stage 06+
unless the main task re-plans them.
