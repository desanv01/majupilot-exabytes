# UI Upgrade Phase 04 - Recommendations and Catalogue

Status: ready for implementation.

Implementer profile: GPT-5.6 Sol, high reasoning.

Branch: `codex/ui-phase-04-recommendations-catalogue`.

## Objective

Redesign `/recommendations` as a distinctive capability decision sequence that
makes the first action unmistakable, keeps later work ordered, and reveals
calculation, evidence, prerequisite, and catalogue provenance on demand. Preserve
every accepted Stage 03 recommendation rule, result, mapping, persistence, and
navigation contract.

## Required reading

- `planning/UI-UX-UPGRADE-PLAYBOOK-AND-SOL-HIGH-PROMPT.md`;
- `planning/stages/STAGE-03-RECOMMENDATIONS-CATALOGUE.md`;
- `planning/design/stage-03/DESIGN-REVIEW.md` and all four approved images;
- `planning/ui-upgrade/PHASE-03-ANALYSIS-RESULTS.md` and accepted Phase 03 evidence;
- `sme-growth-twin/DESIGN.md`;
- `sme-growth-twin/DESIGN-TOKENS.md`;
- `sme-growth-twin/REFERENCE-BOARD.md`;
- `planning/MIROFISH-REFERENCE-MAP.md`;
- `sme-growth-twin/AGENTS.md` and the local Next.js documentation it names.

Use the applicable UI/UX, 12ui, Next.js, React, and browser-verification skills.
Design Taste is advisory only for editorial hierarchy because this is dense
product UI. A new Phase 04 12ui draft was attempted on 18 September 2026 but
stopped before generation because the account had no free allowance or prepaid
balance. Do not purchase or repeat that run. Use the already approved Stage 03
recommendation family and accepted Phase 03 application system as the visual
authority.

## Design read and dials

Reading this as: a trust-first B2B advisory decision workspace for Malaysian SME
owners and hackathon judges, with an editorial sequence and evidence-led product
language, leaning toward one dominant first move rather than a generic dashboard.

- design variance: 7 of 10;
- motion intensity: 3 of 10;
- information density: 7 of 10 expanded, 5 of 10 collapsed.

The page must feel more composed than three equal status columns. Its hierarchy
is the recommendation itself: first move, ordered next moves, and intentionally
deferred work.

## Visual target

Use these approved references as one corrected family:

- `planning/design/stage-03/branch/branch/screens/a.png`: overview hierarchy;
- `planning/design/stage-03/branch/branch/screens/b.png`: capability explanation;
- `planning/design/stage-03/branch/branch/screens/c.png`: catalogue provenance;
- `planning/design/stage-03/branch/branch/screens/d.png`: mobile disclosure ideas;
- `planning/design/ui-upgrade/phase-03-results/selected-results-d.png`: current
  shell, typography, color, spacing, and journey continuity.

Retain the warm paper, deep ink, Libre Baskerville editorial headings, DM Sans
body, evidence teal, restrained cobalt, and limited coral warning treatment.
Reuse the real post-assessment shell. Do not reintroduce the legacy assessment
top bar or five-step assessment progress component.

## Mandatory corrections and anti-patterns

- Use the real SME Growth Twin brand. Do not use generated leaf marks, botanical
  imagery, stock photographs, decorative product logos, or robot illustrations.
- Keep the accepted journey Discover, Diagnose, Compare, Blueprint with Diagnose
  current on recommendations. Scenario comparison is the transition to Compare.
- Bind all values, order, status, explanations, prerequisites, evidence, and
  offering fields to the canonical result. Generated references have no factual
  authority.
- Use capability title and outcome before any provider or product name.
- Do not render three equal dashboard columns, a repetitive card wall, a large
  empty hero, oversized score rings, fake target progress, or excessive pills.
- Do not add prices, savings, ROI, guarantees, implementation team sizes,
  unsupported time ranges, vendor proof points, testimonials, or alternatives
  outside Catalogue 1.0.0.
- Do not imply that `Catalogue entry active` means certification or endorsement.
- Use regular hyphens in visible copy. Remove visible em dashes and en dashes,
  including the current `11-20 hours` and addressed-pain separator cases.
- Do not add a sticky bottom action bar, animated count-up, scroll listener, chart
  dependency, icon dependency, or decorative motion.

## Allowed implementation surface

- `sme-growth-twin/src/app/recommendations/page.tsx` only if metadata or a
  presentation boundary needs correction;
- `sme-growth-twin/src/components/recommendations/recommendations-client.tsx`;
- new presentational components under
  `sme-growth-twin/src/components/recommendations/`;
- `sme-growth-twin/src/components/diagnostics/post-assessment-shell.tsx` only for
  a backwards-compatible context or current-stage prop;
- recommendation and shared post-assessment selectors in
  `sme-growth-twin/src/app/styles.css`;
- focused Phase 04 render tests, browser harness, screenshots, and evidence;
- `sme-growth-twin/package.json` only to add a Phase 04 verification command.

Do not edit recommendation formulas, component weights, candidate generation,
prerequisite rules, hard gates, sorting, capability definitions, stable IDs,
catalogue content, offering selection, Business Twin or diagnostic contracts,
persistence keys/adapters, scenarios, advisors, Blueprint, consultation, or lead
handling. Escalate any proven compatibility issue before broadening scope.

## Protected behavior

- `/recommendations` restores a compatible persisted result or deterministically
  recomputes and saves one without network or model access.
- Missing, corrupt, incompatible, and stale upstream state follows the accepted
  recovery routes.
- Identical inputs produce identical recommendation content and order.
- The Case A first item remains Shared customer operations with `why_now`, fit
  `92.9`, phase Connect, and Freshsales CRM as a subordinate catalogue mapping.
- The rest of Case A remains in canonical rule order. Do not hard-code an image's
  order or status.
- Every one of the six component values remains visible in the expanded view.
- Hard prerequisite failures and unknowns remain visible and fail closed.
- Capability guidance survives unavailable catalogue mapping.
- Product data remains a strict subset of the approved catalogue fields.
- Official source links retain `target="_blank"` and `noopener noreferrer`.
- The next action remains `/scenarios`, and the back action remains `/results`.

## Required composition

### 1. Shared shell and diagnostic handoff

Use `PostAssessmentShell` so the recommendations page visibly continues the
accepted results experience. The desktop rail and compact mobile header must use
the real brand and Diagnose journey state. The shell note may explain that
capabilities are ranked before products. Keep the business name visible.

At the top of the work area, show a compact diagnostic handoff containing exact
digital maturity, AI readiness, and confidence. This is context, not another
results dashboard. Link back to results for the full diagnosis.

### 2. First move

Give the first `why_now` capability the strongest spatial position. It must show:

- rank, `Why now`, capability title, outcome, exact fit, and roadmap phase;
- a plain statement that the product mapping is subordinate to the capability;
- the mapped offering name when available, using `Supported by` or `Future-fit`
  exactly as the result requires;
- one clear, accessible control to inspect the decision.

Do not manufacture a different first move when another case or evidence set
changes the deterministic result.

### 3. Ordered sequence

Show all remaining recommendations in one semantic ordered sequence. Use section
labels for Why now, Next, and Why later, but avoid three equal card columns. A
vertical decision ledger or stepped sequence is preferred. Preserve rank and
status from the result and keep `why_later` items visible.

Empty status groups may be omitted from the visual sequence, but the accessible
structure and tests must not claim that a group has decisions when it does not.

### 4. Decision disclosure

Use native `details` and `summary` or an equivalent accessible disclosure. Each
expanded decision must expose:

- why selected and why now, next, or later;
- all six exact component scores plus the visible formula;
- roadmap phase, effort tier, relative cost tier, and time-to-value tier;
- every prerequisite status, explanation, and unlock action;
- addressed pain, expected impact, risks, and current evidence;
- mapped offering facts, mapping reason, alternatives, provenance, quote notice,
  and consultation limitation.

Avoid nested accordions. One expanded decision should scan as a calm editorial
record with clear sections and compact definition lists.

### 5. Catalogue evidence

Treat catalogue mapping as provenance, not a sales card. The approved fact
summary, official source, catalogue version, checked date, relative pricing
treatment, and limitation must be visually distinct. Long source URLs and IDs
must wrap safely. If mapping fails closed, keep the capability explanation and
state the mapping limitation without a broken placeholder.

### 6. Scenario handoff

End with one clear next-stage panel: `Compare transformation scenarios`. Explain
that the next step compares Lean, Balanced, and Accelerated paths with explicit
assumptions and ROI ranges. Do not display any scenario value on this page.
`Back to results` stays visibly secondary.

## Responsive, accessibility, and interaction rules

- At 1024px and above, keep the deep-ink rail and use the wider work area for the
  dominant first move plus an ordered ledger. The layout must not become a row of
  equal cards.
- Below 768px, remove the rail through the existing shell behavior, preserve the
  compact journey header, and stack context, first move, sequence, disclosures,
  and actions in reading order.
- At 390px and 360px, use a real single-column viewport. Do not duplicate a card
  when it expands, clip long evidence IDs or URLs, or place numeric fit beside text
  if either becomes cramped.
- Every summary, button, and link has at least a 44px target and visible keyboard
  focus. Tab order follows visual order. Focus must not be obscured.
- Status, prerequisite state, rank, and fit are communicated with adjacent text,
  never color or a bar alone.
- All bar-like score treatments include textual values and accessible semantics.
- Respect `prefers-reduced-motion`. Use only brief opacity or transform feedback
  when it clarifies state.
- Do not use `window.addEventListener('scroll')`.

## Required states and evidence

- canonical Case A overview at 1440, 1024, 390, and 360px;
- first decision expanded with all six fit components;
- catalogue provenance expanded with safe official-source handling;
- governed AI expanded in `why_later` with blockers and unlock actions;
- unmapped-offering fail-closed fixture;
- low-evidence or unknown prerequisite fixture;
- empty, stale, corrupt, and incompatible persistence recovery;
- Case B and Case C sequence regressions;
- keyboard-only disclosure and action journey;
- reduced motion, long content wrapping, 44px targets, and no horizontal overflow.

## Acceptance and evidence

Run and report:

- lint;
- type-check;
- Stage 03 recommendation, persistence, catalogue, and render tests plus the full
  test suite;
- production build;
- exact Case A order, statuses, fits, all first-item components, and mapping;
- Case B and Case C golden recommendation sequences;
- deterministic restore and all recovery behavior;
- product-field allow-list and safe source-link checks;
- axe WCAG A/AA checks on collapsed and expanded desktop/mobile states;
- keyboard traversal, console, failed-request, overlay, target-size,
  reduced-motion, and horizontal-overflow checks;
- the established Stage 07 complete browser journey.

Capture final screenshots for the overview, expanded first decision, expanded
catalogue evidence, expanded why-later decision, and actual 390/360px layouts.
Return changed files, design decisions, exact command outcomes, screenshot paths,
accessibility evidence, limitations, commit, pushed branch, and pull-request URL.
Do not merge the pull request and do not begin Phase 05. The main task owns review
and acceptance.

## 12ui run note

The new Phase 04 draft stopped before corpus completion or image generation
because the connected 12ui account had exhausted its free allowance and had no
prepaid balance. No Phase 04 candidate was generated and no paid design run is
claimed. The accepted Stage 03 recommendation references and accepted Phase 03
application visual system therefore remain the binding design authority.
