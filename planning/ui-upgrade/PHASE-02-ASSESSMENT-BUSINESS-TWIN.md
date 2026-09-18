# UI Upgrade Phase 02 - Assessment and Business Twin Review

Status: ready for implementation.

Implementer profile: GPT-5.6 Sol, high reasoning.

Branch: `codex/ui-phase-02-assessment-business-twin`.

## Objective

Redesign the complete five-question assessment, deterministic follow-up sequence, and editable Business Twin review into a calm, trustworthy advisory workspace while preserving every accepted Stage 01 behavior and contract.

## Required reading

- `planning/UI-UX-UPGRADE-PLAYBOOK-AND-SOL-HIGH-PROMPT.md`;
- `planning/stages/STAGE-01-DISCOVERY-BUSINESS-TWIN.md`;
- `planning/design/stage-01/DESIGN-REVIEW.md` and its approved images;
- `planning/ui-upgrade/PHASE-01-HOME-FIRST-VIEWPORT.md` and accepted Phase 01 evidence;
- `sme-growth-twin/DESIGN.md`;
- `sme-growth-twin/DESIGN-TOKENS.md`;
- `sme-growth-twin/REFERENCE-BOARD.md`;
- `planning/MIROFISH-REFERENCE-MAP.md`;
- `sme-growth-twin/AGENTS.md` and the local Next.js documentation it names.

Use the applicable UI/UX, Design Taste, 12ui, Next.js, React, and browser-verification skills. The approved 12ui exploration is already complete, so do not purchase or generate a duplicate run.

## Visual target

Use `planning/design/ui-upgrade/phase-02-assessment/selected-assessment-b.png` as the composition reference. Candidate B establishes a deep-ink desktop context rail and warm-paper work area. The corrections in `REFERENCE-BOARD.md` are mandatory and override the generated logo, leaf decoration, Inter suggestion, pill buttons, and content placement.

Design dials remain variance 6, motion 4, density 5. Forms should feel calmer than the homepage while clearly belonging to the same product.

## Allowed implementation surface

- `sme-growth-twin/src/app/assessment/page.tsx`;
- `sme-growth-twin/src/app/assessment/review/page.tsx`;
- `sme-growth-twin/src/components/assessment/assessment-client.tsx`;
- `sme-growth-twin/src/components/assessment/progress.tsx`;
- `sme-growth-twin/src/components/assessment/review-client.tsx`;
- new presentational components under `sme-growth-twin/src/components/assessment/`;
- assessment and review selectors in `sme-growth-twin/src/app/styles.css`;
- focused component/page tests and Phase 02 evidence documents.

Do not edit the assessment schemas, stable codes, reducer, follow-up selector, Business Twin builder, ID/revision policy, persistence keys, storage adapter, diagnostic engine, recommendations, scenarios, advisor logic, lead logic, or later routes unless an existing acceptance test proves a compatibility correction is unavoidable. Escalate such a correction to the main task before broadening scope.

## Protected behavior

- Exactly five grouped questions with the existing field names, meanings, and stable values.
- Unknown and not-sure values remain explicit and distinct from absent or zero.
- No more than three deterministic follow-ups, with current priority, ordering, reconciliation, and `whyWeAsk` behavior.
- Valid drafts save locally, survive refresh, and restore to the correct step.
- Invalid or incompatible drafts are safely discarded with an understandable message.
- Back, browser back, validation recovery, edit-from-review, and Start over preserve the accepted reducer and revision behavior.
- Confirming the Business Twin follows the existing honest analysis route without changing deterministic output.
- No scores, recommendations, scenario advice, product claims, or AI conclusions leak into assessment or review.

## Required assessment composition

1. Desktop deep-ink context rail using the real brand, local-save/trust language, concise help, and no decorative image asset.
2. Stable five-step desktop progress with current, complete, and future states that do not rely on color alone.
3. Below 768px, a compact product header plus `Step N of 5`, current topic, and progress bar. Do not squeeze five labels into one row.
4. One grouped question per view with a restrained heading, concise helper copy, and an accurate remaining-time cue.
5. Persistent Back and Continue actions that never cover content.
6. Start over separated from primary navigation and protected by the existing confirmation.
7. Saved, saving/restored, invalid-draft, validation, and storage-unavailable messages placed near the context they describe.
8. All controls at least 44px, input text at least 16px, explicit labels, fieldset/legend semantics, visible focus, and error association.
9. Capability questions stack clearly on mobile; four-state choices may form a two-by-two grid only when labels remain readable.
10. Follow-ups show the real `whyWeAsk` statement and remain visibly part of evidence collection rather than a new product stage.

## Required Business Twin review composition

- Treat the review as an editable evidence record, not a dashboard or final report.
- Preserve this order: Identity, Objectives, Capabilities, Process Friction, Constraints, Readiness, Evidence.
- Each section has one obvious Edit action that returns to the correct assessment step.
- Distinguish explicit facts, unknown/not-sure values, and evidence source references through labels as well as color.
- Keep IDs and technical provenance available where already accepted, but do not let them dominate owner-facing facts.
- Preserve Confirm Business Twin as the only dominant forward action and keep edit/start-over choices secondary.
- Do not show maturity bands, readiness scores, pain rankings, recommendations, products, ROI, scenarios, or advisor findings.

## Required states and evidence

- Q1 pristine and partially completed;
- Q2 eight-capability selection including `unknown`;
- one validation error and recovery;
- follow-up with `whyWeAsk`;
- restored valid draft;
- discarded invalid draft;
- storage-unavailable degradation;
- complete Business Twin review;
- edit from review and return;
- Start over cancelled and confirmed;
- keyboard-only completion and reduced motion.

Capture final screenshots for Q1, Q2, a follow-up, validation, and Business Twin review at 1440, 1024, 390, and 360px where the state materially changes.

## Implementation rules

- Reuse the Phase 01 DM Sans and Libre Baskerville setup and semantic tokens.
- Use the existing brand mark. Do not ship the generated leaf logo, botanical cutout, or a raw 12ui asset.
- Use 8px input, 10px button, and 16px panel radii. Full pills are status-only.
- Use CSS or small isolated state transitions. Do not add a motion dependency for this phase and do not use window scroll listeners.
- Use regular hyphens rather than visible em dashes or en dashes.
- Keep assessment logic in the existing client boundary and avoid new global state.
- Preserve focus placement and announcements when validation or step state changes.
- Do not alter Phase 01 home composition except for a compatibility fix proven by tests.

## Acceptance and evidence

Run and report:

- lint;
- type-check;
- all Stage 01-focused tests and the full test suite;
- production build;
- full Case A keyboard assessment through review and edit-return;
- refresh restoration, invalid-draft recovery, and both Start over outcomes;
- the established Stage 07 complete browser journey;
- browser console, failed-request, overlay, and horizontal-overflow checks;
- full homepage-independent axe A/AA audit on assessment and review;
- target-size, focus, reduced-motion, 1440, 1024, 390, and 360px evidence.

Return changed files, design decisions, exact command outcomes, screenshot paths, limitations, commit, pushed branch, and pull-request URL. Do not merge the pull request and do not begin Phase 03. The main task owns review and acceptance.
