# UI Upgrade Phase 07 - Consultation, Demo, and Release Hardening

Status: **Accepted on 2026-09-19**
Implementation profile: **GPT-5.6 Sol Medium with medium reasoning**
Gate owner: **Main planning and integration task**
Prerequisite: **UI Upgrade Phase 06 accepted at `33addcc`**

## 1. Objective

Complete the visual product journey from the accepted Blueprint to an honest,
high-confidence consultation request, then harden the fictional-demo and release
experience for judging. The final application must feel like one authored
decision product rather than a sequence of differently styled feature pages.

This phase refines presentation, interaction, responsive behavior,
accessibility, demo reliability, and release evidence. It does not change
accepted scoring, recommendation, scenario, advisor, Blueprint, consent, lead,
security, or persistence contracts.

## 2. Design read and dials

> Reading this as: the closing act of an evidence-led advisory journey - calm
> enough for an SME owner to trust, precise enough for a consultant to review,
> and controlled enough for a live hackathon demonstration.

| Dial | Value | Reason |
|---|---:|---|
| DESIGN_VARIANCE | 6 | Consultation and demo surfaces should feel authored without competing with the Blueprint. |
| MOTION_INTENSITY | 2 | Only state confirmation and orientation require motion; every flow works without it. |
| VISUAL_DENSITY | 5 | Forms and receipts stay calm while release/demo evidence remains inspectable. |

## 3. Required reading and authority

Read completely before editing:

1. `planning/UI-UX-UPGRADE-PLAYBOOK-AND-SOL-HIGH-PROMPT.md`, including the Phase 07 Sol Medium override;
2. this contract;
3. `planning/stages/STAGE-06-CONSULTATION-FULL-UX.md`;
4. `planning/stages/STAGE-07-HARDENING-SUBMISSION.md`;
5. `planning/design/stage-06/DESIGN-REVIEW.md` and accepted desktop references;
6. `planning/design/stage-07/DESIGN-BRIEF.md` and `DESIGN-REVIEW.md`;
7. accepted UI Phase 01-06 evidence and shared shell;
8. consultation, demo-fixture, reset, lead API, security, release, and test code;
9. `planning/submission/*`, `README.md`, and `SECURITY.md`.

Use the UI/UX Pro Max and Taste design skills for form hierarchy, receipts,
errors, responsive behavior, accessibility, and cross-route consistency. Use
the accepted local design references and current product family. The 12ui
allowance is exhausted: do not purchase, fabricate, or claim a new 12ui result.

## 4. Frozen contracts

Do not change:

- assessment fields, follow-up policy, scores, recommendations, catalogue facts,
  scenario math, ROI, advisor behavior, Blueprint content, or exact A/B/C outputs;
- consultation route, required fields, unchecked consent default, schema,
  honeypot, idempotency, changed-payload rejection, lead receipt, or API claims;
- known storage keys, scoped reset semantics, fictional fixture schemas, or
  navigation destinations;
- process-local lead-store truth, process-local rate-limit truth, security
  headers, server-only credentials, or no-email/no-CRM limitations;
- release scripts and evidence semantics except to make them current and
  reproducible;
- existing accepted typography, warm paper, deep ink, teal evidence, amber
  condition, coral error, spacing, focus, and responsive system.

No real PII, testimonial, benchmark, vendor promise, response-time guarantee,
email/CRM claim, security guarantee, or competition result may be invented.

## 5. Required consultation experience

### 5.1 Blueprint-to-consultation handoff

- Preserve the accepted shared journey frame and mark consultation as the next
  action after Blueprint review, without inventing a fifth diagnostic step.
- Carry only the existing safe context: business name, selected path, Blueprint
  identity, maturity/readiness, and request purpose already allowed by contract.
- Explain exactly what will be recorded and what will not happen.
- Keep a clear route back to the Blueprint without losing the accepted record.

### 5.2 Form composition

- Present one calm form with a concise context summary, contact section,
  consultation preferences, explicit consent, and final submission action.
- Required and optional status must be visible in text, not colour alone.
- Labels remain persistent; helper and error copy is placed next to its field.
- Consent is unchecked and visually distinct from marketing decoration.
- Submission state is finite: idle, validating, submitting, recoverable failure,
  success, and idempotent replay.
- Preserve entered values after validation or recoverable API failure.
- Do not use floating labels, multi-column mobile fields, modal-only errors,
  fake calendars, or celebratory animation that obscures receipt details.

### 5.3 Success receipt

- Lead with `Request recorded`, not a promise of contact or fulfilment.
- Display the safe receipt ID, submitted business, requested consultation focus,
  and recorded time already returned by the accepted boundary.
- State the prototype limitation: no email, CRM delivery, durable production
  storage, or guaranteed human response occurred.
- Provide only two strong next actions: return to Blueprint and start/reset a
  new assessment through the accepted scoped flow.
- A duplicate idempotent request renders the same trustworthy receipt rather
  than appearing to create a second request.

## 6. Demo and recording experience

- Keep `Start assessment` the dominant home action.
- Treat A/B/C as a clearly labelled `Fictional demonstration cases` utility,
  with Case A recommended for the live narrative but no implied superiority.
- Each case card states sector, core challenge, and why it demonstrates a
  different rules path; it must not reveal unsupported final conclusions before
  the journey runs.
- Loading a case gives an accessible confirmation and persistent fictional-demo
  banner across the journey.
- Reset requires deliberate confirmation, clears only known project keys,
  preserves unrelated browser storage, stays safe under repeated use, and
  announces completion.
- The reliability strip may state only verified properties: deterministic core,
  evidence-linked outputs, bounded advisor fallback, and scoped demo reset.
- Provide clean recording views at 1440 and 1024 without debug UI, clipped
  banners, route overlays, or duplicate CTAs.
- Make recoverable empty, stale, corrupt, validation, API, rate-limit, and
  fallback states visually consistent across the journey.

## 7. Cross-route release polish

Audit `/`, `/assessment`, `/assessment/review`, `/results`, `/recommendations`,
`/scenarios`, `/blueprint`, and `/consultation` as one story:

- shared logo, type, colours, spacing rhythm, buttons, focus, status, and error
  language remain consistent;
- no legacy generic card/button style visibly conflicts with accepted phases;
- current journey context is clear without oversized navigation;
- headings follow one logical order and body text remains readable;
- no en dash or em dash appears in visible product copy;
- no horizontal overflow, sticky overlap, clipped banner, or floating control;
- no indefinite spinner, unsupported metric, hidden limitation, or fake data;
- reduced-motion mode retains every state cue.

## 8. Responsive and accessibility contract

- Test 1440, 1024, 390, and 360 CSS pixels.
- Minimum interactive target is 44 by 44 CSS pixels.
- At 390/360, all form fields, context cells, consent, actions, receipt facts,
  demo cards, banners, errors, and reset controls stack to one readable column.
- Body and form text remain at least 16 px on mobile; labels and evidence remain
  at least 14 px unless they are non-essential metadata.
- Use native form controls, fieldsets/legends where useful, associated labels,
  semantic errors, status/live regions, buttons, links, headings, and landmarks.
- Focus order follows reading order, visible focus is never clipped, and focus
  moves to the first invalid field or receipt heading when appropriate.
- Axe A/AA reports zero serious or critical violations for home pristine/demo,
  consultation idle/error/submitting/success, and representative mobile states.
- Keyboard-only completion covers fixture load, journey continuation,
  consultation validation, consent, submit, receipt, return, and scoped reset.

## 9. Allowed implementation surface

Primary allowed files:

```text
sme-growth-twin/src/app/page.tsx
sme-growth-twin/src/app/consultation/*
sme-growth-twin/src/components/home/*
sme-growth-twin/src/components/consultation/*
sme-growth-twin/src/components/demo/*
sme-growth-twin/src/components/diagnostics/post-assessment-shell.tsx
sme-growth-twin/src/app/styles.css
sme-growth-twin/scripts/phase07-ui-browser-check.mjs
sme-growth-twin/tests/unit/*phase07*ui*.test.tsx
sme-growth-twin/package.json
planning/evidence/ui-upgrade/phase-07-consultation-demo-release/*
planning/submission/*
README.md
SECURITY.md
```

Inspect actual paths before editing. Changes to API, domain, scoring, catalogue,
scenario, advisor, Blueprint, persistence, fixture, or security implementation
require a demonstrated defect and main-task approval. Do not add dependencies
unless an existing tool cannot satisfy a proven requirement.

## 10. Required state cycle

Implement and verify:

1. pristine home and standard assessment entry;
2. A/B/C launcher at desktop and mobile;
3. case load confirmation and persistent fictional banner;
4. reset confirmation, completion, cancellation, and repeated reset;
5. consultation with valid Blueprint context;
6. missing/stale/corrupt context and safe return;
7. untouched form with unchecked consent;
8. required-field, format, and consent errors with value preservation;
9. submitting state with duplicate-action prevention;
10. recoverable API and rate-limit errors;
11. success receipt and idempotent replay;
12. back-to-Blueprint and start-new-assessment actions;
13. full Case A journey and exact Case B/C golden regression;
14. deterministic advisor fallback with no credentials;
15. recording views and production deployment verification.

## 11. Verification and evidence

Run at minimum:

```text
npm run lint
npm run type-check
npm test
npm run build
npm run test:phase06:browser
npm run test:stage05:browser
npm run test:stage06:browser
npm run test:stage07:golden
npm run test:stage07:security
npm run test:stage07:browser
npm run audit:production
npm run release:manifest
git diff --check
```

Add a focused Phase 07 UI harness that records:

- exact A/B/C golden outputs and unchanged Case A values;
- complete home-to-recorded-request Case A journey under five minutes;
- consultation idle, validation, submitting, failure, rate-limit, success,
  idempotent replay, and safe receipt states;
- scoped load/reset behavior, unrelated-storage preservation, and fictional
  disclosure persistence;
- axe, keyboard, focus, target-size, reduced-motion, overflow, overlay, console,
  same-origin request, and framework-error results;
- screenshots at 1440, 1024, 390, and 360 for pristine/demo home, form,
  validation, error, success receipt, banner, reset, and representative journey;
- current release manifest, third-party register, demo script, submission
  checklist, and test evidence without fabricated manual completion.

Evidence generation must be deterministic or explicitly document volatile IDs
and timestamps. Harnesses use isolated profiles and clean up temporary state.
Do not commit credentials, real contact data, `.env.local`, or browser profiles.

## 12. Acceptance gate

The main task accepts Phase 07 only when:

1. the consultation and demo surfaces visibly belong to the accepted product;
2. every frozen domain/API/privacy/security behavior remains unchanged;
3. all state-cycle and responsive requirements pass independently;
4. exact A/B/C golden outputs and the 16-section Blueprint remain unchanged;
5. Case A completes from home to safe receipt in deterministic fallback mode;
6. consultation errors preserve data and success makes no unsupported promise;
7. zero serious/critical axe findings, no overflow, no undersized controls, and
   no console/network/overlay failures remain at required widths;
8. release documentation is current, internally consistent, and distinguishes
   automated evidence from manual pending gates;
9. CI and Vercel preview are green, production is verified after merge, and the
   deployment remains clearly labelled a fictional-data prototype;
10. screenshots, machine-readable evidence, limitations, and changed files are
    committed in a focused PR reviewed and merged by the main task.

The implementation task reports completion but does not merge or mark the phase
accepted. The main task owns correction cycles, independent verification,
deployment review, merge, production verification, and final ledger state.

## 13. Acceptance record

Accepted by the main planning and integration task on 19 September 2026 after
PR #20 merged at `a115c88`. Focused verification passed TypeScript checking,
the four Phase 07 UI unit tests, all eight Stage 07 security tests, the
production build, and the Phase 07 browser journey. The committed browser
evidence contains 35 screenshots across 1440, 1024, 390, and 360 px with no
overflow, serious or critical accessibility findings, console errors, or
failed requests. Scoped reset preserves unrelated browser storage and visibly
confirms completion. GitHub validation and Vercel deployment passed, and the
public home and consultation routes returned HTTP 200 after production release.
