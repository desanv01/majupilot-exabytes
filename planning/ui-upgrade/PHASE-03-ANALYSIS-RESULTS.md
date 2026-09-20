# UI Upgrade Phase 03 - Analysis and Results

Status: ready for implementation.

Implementer profile: GPT-5.6 Sol, high reasoning.

Branch: `codex/ui-phase-03-analysis-results`.

## Objective

Redesign the finite local-analysis transition and deterministic diagnostic results into a distinctive, evidence-first decision cockpit while preserving every accepted Stage 02 formula, result, persistence, and navigation contract.

## Required reading

- `planning/UI-UX-UPGRADE-PLAYBOOK-AND-SOL-HIGH-PROMPT.md`;
- `planning/stages/STAGE-02-DETERMINISTIC-INTELLIGENCE.md`;
- `planning/design/stage-02/DESIGN-REVIEW.md` and its approved images;
- `planning/ui-upgrade/PHASE-02-ASSESSMENT-BUSINESS-TWIN.md` and accepted Phase 02 evidence;
- `planning/design/ui-upgrade/phase-03-results/selected-results-d.png`;
- `planning/design/ui-upgrade/phase-03-results/states/`;
- `sme-growth-twin/DESIGN.md`;
- `sme-growth-twin/DESIGN-TOKENS.md`;
- `sme-growth-twin/REFERENCE-BOARD.md`;
- `sme-growth-twin/AGENTS.md` and the local Next.js documentation it names.

Use the applicable UI/UX, 12ui, Next.js, React, and browser-verification skills. Design Taste is advisory only for the editorial framing because this phase is primarily dense product UI. The Phase 03 12ui exploration is complete. Do not purchase or generate a duplicate run.

## Design read and dials

Reading this as: a trust-first B2B diagnostic product for Malaysian SME owners and Exabytes judges, with an editorial evidence-cockpit language, leaning toward compact score hierarchy, explicit provenance, and progressive disclosure.

- design variance: 6 of 10;
- motion intensity: 4 of 10;
- information density: 6 of 10 for results and 4 of 10 for analysis.

The density rises by one point because a useful diagnosis must expose ten dimensions, ranked findings, and evidence without forcing unnecessary route changes. It must still remain calmer than a conventional analytics dashboard.

## Visual target

Use `planning/design/ui-upgrade/phase-03-results/selected-results-d.png` as the primary composition reference. It establishes:

- two large, equally prominent score areas;
- score value, band, and confidence as visibly separate concepts;
- a compact desktop scan path from scores to dimensions to gaps and pain points;
- restrained coral ranking accents;
- evidence and edit controls below the diagnostic hierarchy;
- a clear transition from diagnosis to capability recommendations.

Use the generated state images only for structural ideas:

- `states/a.png`: finite analysis hierarchy;
- `states/b.png`: bounded error and retry hierarchy;
- `states/c.png`: score-evidence composition;
- `states/d.png`: pain-point component and evidence composition;
- `states/e.png`: mobile stacking and compact score hierarchy.

The corrections below override every generated image.

## Mandatory corrections to generated references

- Use the real SME Growth Twin mark and existing brand component. Remove every generated leaf logo, botanical rail, illustration, and decorative raster asset.
- Use DM Sans and Libre Baskerville, not generated substitute fonts.
- Use the real post-assessment journey: Discover, Diagnose, Compare, Blueprint. Do not invent Business Context, Analysis, Results, or Recommendations as replacement stages.
- Use exactly the canonical six maturity dimensions and four readiness dimensions from Stage 02.
- Use exact deterministic values, bands, confidence, gaps, pain points, component scores, evidence IDs, triggers, and rule version 1.0.0. Do not use any generated sample value or wording.
- Do not display an assessment date, verified business data, interviews, uploaded documents, system logs, external sources, target-gap arithmetic, or evidence-source count unless it exists in the canonical result.
- Do not treat a score as progress toward a target. A score bar may encode the actual 0-100 value, but it must not imply that 100 is a promised target. Confidence may use a compact proportional visualization because it is a real 0-1 ratio, with its numeric label always visible.
- Do not subtract missing evidence from a score. Missing evidence is excluded and lowers confidence under the accepted formula.
- Keep expanded score and pain evidence on `/results` through native or accessible disclosure. Do not add new routes or replace existing deep-link behavior.
- Do not reveal provisional scores during analysis or imply a remote AI/model call.
- Use ordinary hyphens and grammatical copy. No visible em dashes or en dashes.

## Allowed implementation surface

- `sme-growth-twin/src/app/assessment/analysis/page.tsx`;
- `sme-growth-twin/src/app/results/page.tsx`;
- `sme-growth-twin/src/components/diagnostics/analysis-client.tsx`;
- `sme-growth-twin/src/components/diagnostics/results-client.tsx`;
- new presentational components under `sme-growth-twin/src/components/diagnostics/`;
- a new shared post-assessment journey shell only if it does not alter Phase 01 or Phase 02 behavior;
- analysis/results selectors and semantic tokens in `sme-growth-twin/src/app/styles.css`;
- focused Phase 03 tests, browser harness, screenshots, and evidence documents;
- `sme-growth-twin/package.json` only to add a Phase 03 verification command.

Do not edit scoring formulas, rule packs, bands, pain definitions, stable IDs, Business Twin schemas, assessment behavior, diagnostic schemas, persistence keys/adapters, recommendation logic, catalogue, scenarios, advisor logic, Blueprint, consultation, or lead handling. Escalate any proven compatibility correction to the main task before broadening scope.

## Protected behavior

- `/assessment/analysis` rebuilds the accepted Business Twin and produces the same deterministic result without network or model access.
- The five canonical analysis states remain: validating evidence, calculating digital maturity, calculating AI readiness, ranking evidence-linked pain points, and preparing results.
- Reduced-motion users receive the same readable status and prompt completion without decorative delay.
- A calculation or storage failure resolves into a finite, actionable retry/back state and never an indefinite spinner.
- A valid result persists before navigation to `/results`.
- `/results` loads a compatible result and redirects stale, corrupt, incompatible, or missing state through the accepted recovery path.
- Unknown evidence remains excluded, visible, and confidence-lowering rather than being coerced to zero.
- All displayed scores, dimensions, gaps, pain rankings, components, factors, actions, and evidence come from `DiagnosticResult` and the accepted Business Twin only.
- Edit Business Twin begins the existing edit/revision flow, clears stale diagnostics, and forces recomputation.
- View recommendations continues to `/recommendations` without changing recommendation generation.

## Required analysis composition

1. Carry the accepted brand into a calm post-assessment shell with a compact Discover, Diagnose, Compare, Blueprint rail. Diagnose is current.
2. Say plainly that calculation is local, deterministic, evidence-based, and requires no live model call.
3. Show the five canonical steps as an ordered finite sequence with current, complete, and waiting labels that do not depend on color alone.
4. Do not use a generic spinner as the only feedback. Use a stable shaped placeholder or status composition that anticipates the result hierarchy without revealing values.
5. Keep the user-entered business name visible where available, but do not invent case type, industry, date, or source count.
6. Error state must state that answers remain on the device, show no partial diagnosis, and expose Try again plus Back to review.
7. Do not add generated illustrations. Visual interest must come from typography, spacing, progress structure, and semantic status treatment.

## Required results composition

1. Two prominent score panels with the exact value, official band, numeric confidence, and confidence band. Explain score and confidence separately.
2. Six maturity rows and four readiness rows using exact canonical labels. Each row includes the exact value or unavailable state, evidence confidence, and accessible 0-100 semantics.
3. Three largest available gaps, labelled as the lowest canonical dimensions rather than invented distance-to-target values.
4. Top three pain points with exact title, priority, and short canonical mechanism.
5. All triggered pain findings remain available below the overview for auditability without forcing the overview to repeat every detail.
6. Score disclosures expose recorded evidence, missing evidence, strongest factor, limiting factor, rule version, confidence basis, and improvement action.
7. Pain disclosures expose impact, urgency, strategic alignment, confidence, affected capabilities, audit triggers, and linked recorded evidence.
8. Evidence IDs remain inspectable but secondary to user-readable fact labels and values.
9. Edit Business Twin is visible near the result heading and again only where helpful at the end. View recommendations is the single dominant forward action.
10. The design must distinguish diagnostic explanation from capability recommendation. The improvement action is a scoring explanation, not a product or vendor recommendation.

## Responsive, accessibility, and interaction rules

- At 1024px and above, use the Candidate D scan hierarchy without reproducing its botanical rail. The desktop shell may use a compact deep-ink journey rail or top rail if it stays consistent with Phase 02.
- Below 768px, remove the desktop rail, preserve the brand and current journey stage in a compact header, and stack scores before breakdowns, gaps, pain points, evidence, and actions.
- At 390px and 360px, do not place two score cards side by side if numeric labels or confidence become cramped. The generated mobile image is only a hierarchy reference.
- Native `details`/`summary` or equivalent disclosures must be keyboard operable, visibly focused, and use at least 44px targets.
- Focus must not be obscured by sticky or fixed UI. Do not add a persistent bottom action bar.
- Do not rely on color, circular charts, or bar length alone. Every visual value has adjacent text.
- Prefer CSS and existing primitives. Do not add a chart, icon, or motion dependency for this phase.
- Respect `prefers-reduced-motion`; no width animation or count-up is required to understand a result.
- Do not use `window.addEventListener('scroll')`.

## Required states and evidence

- analysis at initial/current/mid/final step;
- analysis bounded error and retry;
- results restoring state;
- canonical Case A results overview;
- at least one expanded maturity/readiness explanation;
- at least one expanded pain point;
- missing-evidence/low-confidence fixture;
- all-unknown/insufficient-evidence fixture;
- stale diagnostic recovery after Business Twin revision;
- Edit Business Twin and recompute return;
- reduced motion and keyboard-only disclosure/action journey.

Capture final screenshots for analysis, results overview, expanded score evidence, and expanded pain evidence at 1440, 1024, 390, and 360px where state materially changes.

## Acceptance and evidence

Run and report:

- lint;
- type-check;
- Stage 02 scoring, pain, persistence, and render tests plus the full test suite;
- production build;
- exact Case A maturity 37.5 and readiness 42.5 values, dimensions, confidence, gaps, and pain order;
- Case B and Case C regression values through the established Stage 07 golden suite;
- valid restore, stale/corrupt/incompatible recovery, edit/revision invalidation, and retry behavior;
- keyboard traversal through score and pain disclosures;
- full axe WCAG A/AA checks on analysis and results desktop/mobile;
- browser console, failed-request, overlay, target-size, reduced-motion, and horizontal-overflow checks;
- the established Stage 07 complete browser journey.

Return changed files, design decisions, exact command outcomes, screenshot paths, accessibility evidence, limitations, commit, pushed branch, and pull-request URL. Do not merge the pull request and do not begin Phase 04. The main task owns review and acceptance.

## 12ui run note

The four-candidate draft and all five selected-direction branch screens completed. The optional HTML/prototype packaging step hit a Windows `EPERM: operation not permitted, fsync` error after the screens were safely materialized. A resume of the same recorded run returned the same packaging error. The implementation must therefore use the durable images plus this contract, not claim that the optional generated prototype was verified.
