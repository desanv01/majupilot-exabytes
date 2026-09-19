# UI Upgrade Phase 06 - Blueprint and Advisor Experience

Status: **Accepted on 2026-09-19**
Implementation profile: **GPT-5.6 Sol High; final correction directed under the owner's Sol Medium override**
Gate owner: **Main planning and integration task**  
Prerequisite: **UI Upgrade Phase 05 accepted**

## 1. Objective

Turn `/blueprint` from a long technically complete report into a credible
advisor-review and transformation-Blueprint experience. The user must quickly
understand whether the review is ready, which advisor perspectives were live or
fallback, where they agree or disagree, what decision was preserved, and how to
navigate or print the complete evidence-linked report.

This is a visual, information-hierarchy, interaction, accessibility, and print
upgrade only. Stage 05 advisor orchestration, API budgets, schemas, evidence
invariants, fallback rules, synthesis, immutable Blueprint identity,
persistence, section order, and all upstream numeric records remain unchanged.

## 2. Design read and dials

> Reading this as: an executive transformation brief and evidence room for an
> SME owner and consultant, with editorial report quality, visible specialist
> challenge, and audit-grade provenance.

| Dial | Value | Reason |
|---|---:|---|
| DESIGN_VARIANCE | 7 | The report should feel authored and consequential, not like stacked SaaS cards. |
| MOTION_INTENSITY | 3 | Finite advisor-state changes need orientation, never theatrical waiting. |
| VISUAL_DENSITY | 5 | The on-screen report must be inspectable while print remains comprehensive. |

## 3. Required reading and authority

Read completely before editing:

1. `planning/UI-UX-UPGRADE-PLAYBOOK-AND-SOL-HIGH-PROMPT.md`;
2. `planning/ui-upgrade/PHASE-06-BLUEPRINT-ADVISORS.md`;
3. `planning/stages/STAGE-05-ADVISOR-BLUEPRINT.md`;
4. `planning/advisors/ADVISOR-BLUEPRINT-MODEL-1.0.0.md`;
5. `planning/design/stage-05/DESIGN-CONTRACT.md`;
6. accepted Phase 03 through Phase 05 UI evidence and shared application shell;
7. current Blueprint, advisor API, fallback, persistence, print, and tests.

Use UI/UX Pro Max for report navigation, progress/status, disclosures,
accessibility, responsive behavior, and print. Use Taste Skill for editorial
hierarchy, typography, content discipline, and anti-template judgment. The
frozen Stage 05 design contract and current accepted application family are the
visual references. Do not purchase or claim a new 12ui run.

## 4. Frozen behavior and content

Do not change:

- advisor roles, stable order, prompts, API request/response, retry/time/token
  budgets, rate limits, or model/fallback choice;
- advisor review, synthesis, provenance, model-call, or Blueprint schemas;
- evidence-reference validation, lossless synthesis, decision policy, or any
  trusted score/recommendation/scenario/ROI value;
- Blueprint ID, generated timestamp, source identity, persistence, restoration,
  invalidation, or regeneration semantics;
- all 16 report sections and Model 1.0.0 order;
- consultation handoff claims or the `/blueprint` and `/consultation` routes;
- storage keys, security boundaries, server-only provider use, or fallback
  honesty.

An advisor may interpret but never replace deterministic facts. `model` and
`deterministic_fallback` origins must remain explicit. No new chat, stochastic
simulation, score, recommendation, price, quote, guarantee, benchmark,
testimonial, or Exabytes fact may be invented.

## 5. Required experience

### 5.1 Shared frame and command header

- Continue the accepted warm paper, deep ink, teal evidence, and restrained
  amber condition system from Phases 03 through 05.
- Blueprint is the current fourth journey step.
- The command header must identify the business and preferred scenario, state
  that numbers remain deterministic, and expose only these primary actions:
  Back to scenarios, Generate/Regenerate review, Print or save as PDF, and
  Request consultation after a Blueprint exists.
- Loading and missing-preference states must use the same product frame and
  explain the safe next action.
- Application chrome and actions must never appear in print.

### 5.2 Finite advisor review state

Create a real five-role review board in frozen role order. Every role shows one
of `ready`, `reviewing`, `live`, `fallback`, or `failed-safe` in text and visual
structure. Requirements:

- no indefinite spinner, fake streaming, or fabricated per-role timing;
- explain live review is optional and deterministic facts remain authoritative;
- during review, keep all five roles visible and the page operable;
- final origin counts and any fallback notice are prominent but calm;
- failure-safe copy confirms upstream records were not changed;
- origin and status never rely on colour alone.

### 5.3 Executive decision overview

Before the full report, provide a compact orientation surface derived only from
the immutable Blueprint:

1. selected path and synthesis decision;
2. maturity and readiness;
3. first-year cost, operational value, net value, and payback as labelled
   low/base/high or best/base/worst ranges;
4. advisor origin summary;
5. agreement, disagreement, conditions, and open-question counts;
6. top decision conditions or risks with links into the report.

This overview may summarize; it must not create a 17th Blueprint section or
alter report data. Negative values receive explanation, not danger styling.

### 5.4 Advisor panel

The five advisor cards must be recognizable as specialist lenses without
becoming five decorative colour cards. Each shows:

- role and objective;
- position;
- model-origin or deterministic-fallback badge;
- confidence;
- support, concerns, missing evidence, and proposed adjustments;
- inspectable evidence references.

Use progressive disclosure to keep the first scan concise while ensuring print
and keyboard users can access everything. The card summary must state the
headline and material counts. Empty groups remain explicit, not hidden.

### 5.5 Synthesis

- Visually separate Agreement, Disagreement, Conditions, and Open questions.
- If disagreement is empty, display exactly `No material disagreement detected`.
- Each material statement keeps its contributing advisor identities and
  evidence references.
- Make consensus and unresolved conditions scannable before the reader enters
  all advisor detail.
- Do not convert synthesis into a chat transcript or sentiment score.

### 5.6 Printable Blueprint

Preserve the exact Model 1.0.0 content and section order:

1. Cover;
2. Executive summary;
3. Business profile;
4. Digital maturity and AI readiness;
5. Pain points;
6. Recommended capabilities and mapped offerings;
7. Three-scenario comparison;
8. Selected transformation plan;
9. ROI assumptions, ranges, formulas, and exclusions;
10. Month-by-month roadmap;
11. Risks, warnings, and prerequisites;
12. Five advisor reviews;
13. Synthesis;
14. Consultant notes;
15. Evidence, provenance, versions, and methodology;
16. Consultation handoff.

On screen:

- use a sticky contents rail only where it does not cover content;
- highlight the current section when practical without scroll listeners;
- at tablet/mobile, replace the rail with a compact native section menu or
  grouped contents list, never a swipe-only carousel;
- use labelled range triplets instead of slash-only finance strings;
- make IDs, versions, provenance, evidence, formulas, exclusions, limitations,
  and model-call disclosures readable but subordinate;
- visible copy contains no en dash or em dash.

In print:

- target clean A4 output with appropriate margins and page-break control;
- hide all application chrome, controls, status boards, and consultation CTA;
- expand every advisor/provenance/formula disclosure needed to interpret claims;
- do not clip timelines, evidence IDs, long references, or advisor groups;
- avoid background-dependent meaning and excessive ink;
- retain Blueprint ID, generated time, model version, and page/report context;
- verify every one of the 16 sections and all five advisors is present.

### 5.7 Consultation handoff

- Keep consultation secondary until the Blueprint exists.
- State exactly what the prototype does: the next step reviews shared content,
  collects details and explicit consent, and records a process-local request.
- Do not imply email, CRM delivery, human response, or vendor fulfilment.

## 6. Required state cycle

Implement and verify:

1. validating/loading state;
2. missing preferred scenario and safe return to `/scenarios`;
3. ready, no-Blueprint state;
4. all five advisors reviewing;
5. complete all-fallback state;
6. complete mixed live/fallback state through fixtures or render tests;
7. failed-safe state;
8. restored immutable Blueprint with unchanged identity;
9. stale/corrupt/incompatible recovery notice and regeneration;
10. regenerate creates a new identity without changing upstream records;
11. advisor cards collapsed and expanded;
12. synthesis with populated and empty-disagreement fixtures;
13. contents navigation on desktop and mobile;
14. print preview/output;
15. consultation handoff.

## 7. Responsive and accessibility contract

- Test 1440, 1024, 390, and 360 CSS pixels.
- No horizontal overflow, sticky overlap, clipped contents link, or floating
  control covering report content.
- Minimum 44 by 44 CSS pixel interactive targets.
- Advisor cards, synthesis, ranges, report grids, and roadmap stack to one
  column where necessary at 390/360 px.
- Body text remains at least 16 px on mobile; labels and references at least 14 px.
- Evidence IDs and version strings wrap safely.
- Use native headings, landmarks, lists, links, buttons, and details; focus order
  follows reading order and focus remains visible.
- Axe A/AA reports zero critical or serious violations for ready, reviewing,
  fallback-complete, expanded-advisor, synthesis, report, and mobile states.
- Respect reduced motion; status changes remain understandable without motion.

## 8. Allowed implementation surface

Primary allowed files:

```text
sme-growth-twin/src/components/blueprint/*
sme-growth-twin/src/components/diagnostics/post-assessment-shell.tsx
sme-growth-twin/src/app/blueprint/page.tsx
sme-growth-twin/src/app/styles.css
sme-growth-twin/tests/unit/*phase06*ui*.test.tsx
sme-growth-twin/tests/unit/stage05-render-integration.test.tsx
sme-growth-twin/scripts/phase06-browser-check.mjs
sme-growth-twin/package.json
planning/evidence/ui-upgrade/phase-06-blueprint-advisors/*
```

Do not edit advisor/core/domain/domain-pack/API/persistence modules to fit the
visual design. Any demonstrated functional defect outside this boundary must be
reported to the main task before editing. Do not add dependencies unless a
proven requirement cannot be met by the existing stack.

## 9. Verification

Run at minimum:

```text
npm run lint
npm run type-check
npm test
npm run build
npm run test:phase06:browser
npm run test:stage05:browser
npm run test:stage07:browser
```

The Phase 06 harness must record:

- exact Blueprint ID stability after reload and identity change after explicit
  regeneration;
- exact selected Case A path and frozen numeric values;
- five roles in frozen order with finite status and origin disclosure;
- all 16 report sections and five advisor reviews;
- fallback notice, no hidden disagreement, evidence references, origin counts,
  provenance, versions, formulas, exclusions, limitations, and model calls;
- keyboard generation, disclosure, contents, print, and consultation journey;
- print media results and a rendered A4 PDF or page screenshots for visual QA;
- reduced-motion behavior and visible focus;
- axe results for required states;
- target sizing, overflow, overlay, console, failed-request, and framework-error
  checks at 1440, 1024, 390, and 360 px;
- screenshots of ready, reviewing, completed overview, advisor detail, synthesis,
  report navigation, mobile, and print states.

Live Gateway use is optional for this UI phase. Deterministic fallback must
complete the full journey. Never expose or commit a credential.

## 10. Acceptance gate

The main task accepts Phase 06 only when:

1. the diff stays within this visual/interaction boundary;
2. advisor, synthesis, Blueprint identity, persistence, and trusted upstream
   values are unchanged;
3. the full test, production build, Phase 06, Stage 05, and Stage 07 browser
   suites pass independently;
4. a first-time reader can identify decision, advisor origins, material
   consensus/conditions, and next action before reading all 16 sections;
5. the complete report remains evidence-linked and every disclosure is
   accessible on screen and in print;
6. A4 and all four required screen widths pass visual and accessibility review;
7. screenshots, print evidence, exact results, limitations, and changed files
   are committed in a focused PR with green CI.

The implementation task reports completion but does not merge or mark this
phase accepted. The main task owns review, correction, merge, and ledger state.

## 11. Acceptance record

Accepted by the main planning and integration task on 19 September 2026 after
independent code, browser, accessibility, responsive, regression, and all-page
PDF review. PR #18 merged at `33addcc`. The acceptance cycle corrected real
1440 px overflow and a fragmented print version block before merge.
