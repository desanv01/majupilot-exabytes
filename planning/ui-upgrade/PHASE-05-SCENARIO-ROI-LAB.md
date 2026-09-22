# UI Upgrade Phase 05 - Scenario and ROI Lab

Status: **Ready for implementation**  
Implementation profile: **GPT-5.6 Sol High**  
Gate owner: **Main planning and integration task**  
Prerequisite: **UI Upgrade Phase 04 accepted**

## 1. Objective

Turn `/scenarios` into a calm, high-trust decision laboratory where an SME
owner can compare three genuinely different transformation paths, inspect one
path without losing comparison context, understand the source of every range,
edit assumptions safely, and explicitly select a preferred path.

This phase changes presentation, information hierarchy, responsive behavior,
interaction clarity, and visual evidence only. The accepted Stage 04 scenario
composition, ROI arithmetic, schemas, persistence, IDs, route, and downstream
Blueprint contract remain authoritative and unchanged.

## 2. Design read and dials

> Reading this as: a trust-first financial decision room for Malaysian SMEs,
> with an editorial evidence-cockpit language, a strong three-path comparison,
> and inspectable assumptions instead of dashboard decoration.

| Dial | Value | Reason |
|---|---:|---|
| DESIGN_VARIANCE | 6 | The three paths need character without becoming three unrelated products. |
| MOTION_INTENSITY | 3 | State changes may orient the user; arithmetic must never wait for animation. |
| VISUAL_DENSITY | 6 | Comparison and provenance are information-dense but must remain scannable. |

## 3. Required reading and visual authority

Read completely before editing:

1. `planning/UI-UX-UPGRADE-PLAYBOOK-AND-SOL-HIGH-PROMPT.md`;
2. `planning/stages/STAGE-04-SCENARIO-ROI-LAB.md`;
3. `planning/scenarios/SCENARIO-ROI-MODEL-1.0.0.md`;
4. `planning/design/stage-04/DESIGN-REVIEW.md`;
5. the three approved composition references in
   `planning/design/stage-04/branch/branch/screens/`;
6. accepted Phase 03 and Phase 04 UI evidence and the current shared shell;
7. current scenario, ROI, persistence, Blueprint handoff, CSS, and tests.

Use UI/UX Pro Max for comparison, disclosure, form, chart/timeline,
accessibility, and responsive guidance. Use Taste Skill for hierarchy,
typography, copy discipline, and anti-template judgment. Reuse the approved
Stage 04 12ui references; do not purchase or claim a new generation. Product
contracts and exact runtime data override every generated visual.

## 4. Frozen behavior and arithmetic

Do not change:

- scenario, ROI, recommendation, catalogue, or persistence schemas and versions;
- Lean Foundation, Balanced Growth, or Accelerated AI composition rules;
- default Balanced visual focus or the requirement for explicit selection;
- formulas, range propagation, pace multipliers, dependencies, event ordering,
  budget-fit policy, sensitivity behavior, or exclusion policy;
- valid/invalid edit behavior, provenance, reset semantics, or stale detection;
- the `/scenarios` route or the selected-scenario handoff to `/blueprint`;
- storage keys, analytics semantics, trusted values, stable IDs, or timestamps;
- the four-step Discover, Diagnose, Compare, Blueprint journey.

The frozen Case A values remain:

| Path | First-year cost low/base/high | Operational value low/base/high | Net value low/base/high | Payback best/base/worst | Budget fit |
|---|---|---|---|---|---|
| Lean | RM5,640 / RM11,280 / RM16,920 | RM1,088 / RM3,778 / RM8,392 | -RM15,832 / -RM7,502 / RM2,752 | 8.1 / 35.8 / More than 60 months | Base within |
| Balanced | RM9,200 / RM18,400 / RM27,600 | RM2,358 / RM7,254 / RM15,233 | -RM25,242 / -RM11,146 / RM6,033 | 7.2 / 30.4 / More than 60 months | Only low within |
| Accelerated | RM10,320 / RM20,640 / RM30,960 | RM2,327 / RM8,312 / RM17,377 | -RM28,633 / -RM12,328 / RM7,057 | 7.1 / 29.8 / More than 60 months | Only low within |

Accelerated conditional expansion cost remains RM7,200 / RM14,400 / RM21,600
and remains outside committed ROI while its gate is blocked. Default Case A
revenue and avoided risk remain `Not estimated`.

## 5. Required experience

### 5.1 Shared frame

- Use the accepted `PostAssessmentShell` and Phase 03/04 visual language.
- Keep Compare current in the journey rail and make progress readable at 360 px.
- Show the business identity and saved-device state without competing with the
  decision title.
- Lead with the decision: compare three paths, inspect evidence, then select.
- Do not repeat a large generic hero or create a second navigation system.

### 5.2 Comparison command surface

Create one dominant comparison surface, not three unrelated equal cards packed
with prose. The user must be able to compare the same fields in the same order:

1. strategic intent and risk;
2. committed scope and conditional scope;
3. timing;
4. first-year cost;
5. annual gross value;
6. net-value range;
7. payback;
8. budget fit;
9. confidence and exclusions.

Balanced may be the initial inspection focus, but no card, badge, CTA, or copy
may imply it is selected or recommended before explicit user action. Focus and
preferred selection must be visually and semantically different. Each path has
one inspect action and one select action. Only one primary CTA intent should
dominate the page at a time.

Ranges must label low, base, and high at the point of use rather than relying on
a slash-only value. Negative net values need calm explanatory treatment, not
alarm styling. Costs must show `Planning assumptions, not an Exabytes quote`.
Optional value streams must show `Not estimated`, never zero.

### 5.3 Focused scenario detail

- Preserve comparison context while showing the focused path.
- Present months 1 through 12 exactly once.
- Desktop may use a horizontal schedule only when it is fully readable without
  page-level horizontal scrolling; 390/360 px must use a vertical month path.
- Show starts, activations, readiness conditions, and blocked conditional gates
  from actual engine data only.
- Separate financial outlook, dependencies/readiness, and calculation
  explanation into a clear reading order.
- Disclosures must be native, keyboard operable, and have visible focus.
- Conditional AI must be identifiable by text and structure, not colour alone.

### 5.4 Assumptions workbench

Treat editing as a deliberate workbench, not a wall of form controls:

- group Costs, Operational value, Revenue, Avoided risk, and Sensitivity;
- surface a compact live result summary for the focused path;
- show low, base, high, unit, source type, source reference, and rationale;
- visually distinguish user fact, derived user fact, planning default, and user
  override without changing stored provenance;
- keep optional Revenue and Avoided risk collapsed or quiet until inspected;
- preserve the last valid calculation while invalid text is being corrected;
- place field errors beside their field and associate them programmatically;
- reset only the focused path to Model 1.0.0 assumptions after an explicit act;
- update visible results synchronously after every valid edit;
- keep the deterministic sensitivity trace clearly separate from headline ROI.

At 390/360 px, ranges may stack, but labels, units, errors, sources, and values
must stay adjacent. No field, disclosure, or reset action may require horizontal
scrolling.

### 5.5 Selection and Blueprint handoff

- Before selection, explain that inspection focus is not a saved decision.
- After selection, show the exact preferred scenario title and a persistent,
  unambiguous selected treatment.
- The Blueprint CTA becomes available only after explicit selection.
- The CTA copy must describe advisor review and Blueprint generation honestly.
- Back to recommendations remains secondary and preserves current data.

## 6. Required state cycle

Implement and verify:

1. loading/building state with finite, honest copy;
2. default comparison with Balanced focused and no preferred selection;
3. each scenario focused;
4. explicit preferred selection and changed selection;
5. focused detail with formulas/exclusions disclosed;
6. assumption group collapsed and expanded;
7. valid edit with immediate recalculation and user-override provenance;
8. invalid edit with last valid outputs retained and an associated error;
9. reset to Model 1.0.0;
10. `Not estimated` optional value streams;
11. conditional AI blocked and excluded from committed economics;
12. valid persisted restore;
13. empty, corrupt, incompatible, and stale recovery;
14. reduced motion, keyboard-only operation, and print-safe content where used.

## 7. Responsive and accessibility contract

- Test 1440, 1024, 390, and 360 CSS pixels.
- No page-level horizontal overflow, clipped range, sticky overlap, or floating
  action covering content.
- Minimum 44 by 44 CSS pixel target for every interactive control.
- One-column reading order at 390/360 px.
- Focus order matches visual order; all focus indicators are clearly visible.
- Current focus, preferred selection, warning, and conditional status do not
  rely on colour alone.
- Use semantic headings, `dl` for metrics, fieldset/legend for grouped inputs,
  and native buttons/details where appropriate.
- Axe A/AA must report zero critical or serious violations in default,
  selected, expanded-assumption, invalid-edit, and mobile states.
- Respect `prefers-reduced-motion`; no numeric result waits for a transition.
- Visible product copy contains no em dash.

## 8. Allowed implementation surface

Primary allowed files:

```text
sme-growth-twin/src/components/scenarios/*
sme-growth-twin/src/components/diagnostics/post-assessment-shell.tsx
sme-growth-twin/src/app/scenarios/page.tsx
sme-growth-twin/src/app/styles.css
sme-growth-twin/tests/unit/*phase05*ui*.test.tsx
sme-growth-twin/tests/unit/stage04-render-integration.test.tsx
sme-growth-twin/scripts/phase05-browser-check.mjs
sme-growth-twin/package.json
planning/evidence/ui-upgrade/phase-05-scenario-roi/*
```

Any edit to `src/core`, `src/domain`, `src/domain-packs`, or persistence requires
a demonstrated UI-only necessity and explicit main-task approval. Do not change
trusted arithmetic or schema output to simplify rendering. Do not install a new
dependency unless the existing stack cannot meet a proven requirement.

## 9. Verification

Run at minimum:

```text
npm run lint
npm run type-check
npm test
npm run build
npm run test:phase05:browser
npm run test:stage07:browser
```

The Phase 05 browser harness must record:

- exact Case A values for all three paths and conditional expansion;
- no preselection, explicit selection, selection switching, and persisted
  restoration;
- valid edit, invalid edit, reset, provenance, and immediate recalculation;
- months 1 through 12 exactly once and vertical mobile schedule;
- `Not estimated`, exclusions, formulas, dependency, and conditional-gate text;
- keyboard disclosure, edit, selection, and Blueprint-handoff journey;
- reduced-motion behavior and visible focus;
- axe results for required states;
- target sizing, overflow, overlay, console, failed-request, and framework-error
  checks at 1440, 1024, 390, and 360 px;
- screenshots of comparison, focused detail, assumptions, invalid edit, selected
  state, and mobile equivalents.

## 10. Acceptance gate

The main task accepts Phase 05 only when:

1. the implementation diff stays within this visual/interaction boundary;
2. frozen Stage 04 arithmetic, persistence, and downstream identity are unchanged;
3. the full test, production build, Phase 05 browser, and Stage 07 regression
   suites pass independently;
4. comparison is materially easier to scan than the current three dense cards;
5. focus and explicit selection cannot be confused;
6. every range, assumption, source, exclusion, and conditional item remains
   inspectable and honest;
7. all four required viewports and accessibility states pass;
8. screenshots, exact command results, limitations, and changed files are
   committed in a focused PR with green CI.

The implementation task reports completion but does not merge or mark this
phase accepted. The main task owns review, correction cycles, merge, and ledger
transition.
