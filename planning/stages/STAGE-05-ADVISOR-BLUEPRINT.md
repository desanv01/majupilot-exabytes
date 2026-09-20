# Stage 05 - Advisor Panel and Blueprint

Status: **Accepted on 2026-09-18**
Implementer profile: **GPT-5.6 Sol, medium reasoning**
Prerequisite: **Stage 04 accepted and published**
Gate owner: **Main task**

## 1. Objective

Deliver five bounded, evidence-linked advisor reviews for the explicitly selected
scenario; deterministic synthesis that preserves conditions, disagreements, and
missing evidence; and an immutable, print-ready Digital and AI Transformation
Blueprint assembled only from validated Stage 01-04 records.

## 2. Required reading

Read completely before editing:

1. `planning/MASTER-GAMEPLAN.md`, Sections 2-3, 14-15, 17-25, and 27-29;
2. `planning/advisors/ADVISOR-BLUEPRINT-MODEL-1.0.0.md`;
3. `planning/design/stage-05/DESIGN-CONTRACT.md`;
4. `planning/DECISION-REGISTER.md`;
5. `planning/EXECUTION-ORCHESTRATION.md`;
6. all prior stage packets and current code/tests;
7. installed AI SDK documentation under `node_modules/ai/docs` before using APIs.

Build bounded personas, report investigation, task lifecycle, replay, and
fallback behavior through this project's own contracts, prompts, terminology,
interface, and code.

## 3. In scope

- Strict Zod schemas, IDs, versions, and types for advisor definitions, review
  context, findings, adjustments, reviews, synthesis, model-call records, and
  blueprints.
- Exabytes domain-pack advisor definitions and deterministic fallback rules.
- Provider-neutral core review validation and deterministic synthesis.
- Server-only optional live model adapter using current AI SDK structured output.
- Five-role orchestration with per-role timeout/retry/fallback and stable order.
- Immutable blueprint assembly and strict upstream stale detection.
- Versioned local persistence for validated blueprint records.
- `/blueprint` advisor panel, synthesis, report preview, provenance, methodology,
  limitations, regenerate action, and browser print/save-as-PDF action.
- Stage 04 handoff that requires an explicit preferred scenario.
- Print CSS, desktop layout, and actual 360 px layout.
- Golden Case A, fallback, mixed-origin, invalid-output, stale-record, render,
  browser, and print verification.

## 4. Required architecture

Expected implementation areas:

```text
src/app/blueprint/page.tsx
src/app/api/advisors/review/route.ts
src/components/blueprint/*
src/core/advisors/*
src/core/blueprint/*
src/domain/advisors.ts
src/domain/blueprint.ts
src/domain-packs/exabytes/advisor-rules.ts
src/infrastructure/model-provider/*
src/infrastructure/persistence/local-blueprint-store.ts
tests/unit/advisors-stage05.test.ts
tests/unit/blueprint-stage05.test.ts
tests/unit/stage05-render-integration.test.tsx
scripts/stage05-browser-check.mjs
```

The deterministic core cannot import Next.js, `server-only`, infrastructure,
environment state, the AI SDK, or Exabytes modules/identifiers. Advisor roles,
fallback content rules, and report-domain knowledge belong to the domain pack.
The API route validates both request and response and reveals no secret or raw
provider error.

## 5. Live-model boundary

- Use `generateText` plus `Output.object({ schema })` from the installed AI SDK;
  do not use obsolete `generateObject` examples.
- Read the gateway model from `AI_GATEWAY_MODEL`. If model/credential setup is
  absent, return a typed unavailable result and use deterministic fallback.
- Do not add a hard-coded model ID, client-visible key, tool call, model-written
  HTML, or model-controlled numeric field.
- Delimit untrusted business text; keep system instructions and schemas fixed.
- Reject unknown/duplicate advisor IDs and any evidence reference absent from
  the supplied allow-list.
- Bound requests to five roles, one retry, a finite timeout, and concise output.
- Record provider/model/prompt/schema versions, latency, retry count, status,
  evidence IDs, and a redacted error category. Do not persist hidden reasoning.

## 6. Blueprint and navigation rules

- No preferred scenario: do not generate; show a link back to scenarios.
- Valid current stored blueprint: restore exactly without rerunning models.
- Stale/corrupt/incompatible blueprint: discard safely and regenerate only after
  the user initiates generation.
- Regeneration creates a new blueprint ID and timestamp.
- All upstream numeric values are copied exactly; no rounding beyond existing
  display rules and no advisor-written replacements.
- `Print / save as PDF` calls the browser print dialog and is labelled honestly.
- Consultation is preview-only; no contact fields, consent, lead, or external send.

## 7. Required tests

### Contracts and boundaries

- Schemas reject unknown roles, invalid confidence, empty unsupported findings,
  unknown evidence references, duplicates, and extra fields.
- Core contains no Exabytes advisor IDs, AI SDK import, environment access, or
  infrastructure/server dependency.
- Domain pack owns the five roles and fallback decision knowledge.
- Model output cannot change scores, costs, ROI, schedule, recommendations,
  selection, catalogue facts, or Business Twin state.

### Advisor behavior

- All five roles are distinct and stable in the frozen order.
- No configuration, timeout, provider error, invalid JSON/object, unknown evidence,
  and partial failure each fall back safely per role.
- Mixed live/fallback results disclose origin accurately.
- Synthesis preserves disagreement and missing evidence and de-duplicates
  conditions without inventing claims.
- Identical validated inputs produce identical fallback reviews and synthesis.
- Case A meets every expectation in Model 1.0.0.

### Blueprint behavior

- Requires a selected scenario that belongs to the current comparison.
- Snapshot contains all 16 required sections and exact upstream identities.
- Case A figures exactly match Stage 04; revenue/risk remain not estimated.
- Persistence round-trips and invalidates every upstream ID/version/revision,
  selected scenario, advisor model, and blueprint model dimension.
- Regeneration changes blueprint identity without mutating upstream records.

### Render, browser, and print

- Scenario selection reaches `/blueprint`; missing selection fails clearly.
- Loading is finite and fallback completes without network/configuration.
- Advisor cards expose position, origin, confidence, evidence, and adjustment.
- Empty agreement/disagreement/missing sections use explicit empty states.
- All material blueprint claims show provenance or evidence/method reference.
- Print media hides controls/navigation and expands report content.
- Desktop and 360 px pass keyboard order, headings/landmarks, 44 px controls,
  wrapping, contrast, reduced motion, and horizontal-overflow checks.
- No Stage 06 contact, consent, lead storage, or external delivery is present.

## 8. Validation commands

Run sequentially and report exact results:

```text
npm run lint
npm run type-check
npm test -- --run
npm run build
node scripts/stage05-browser-check.mjs
```

Inspect the generated desktop, 360 px, and print screenshots. Do not weaken
existing tests or update golden values merely to make them pass.

## 9. Acceptance gate

The main task accepts Stage 05 only when all validation is independently green,
the provider/domain/core boundaries are clean, live failure falls back honestly,
the immutable blueprint matches upstream records exactly, all five perspectives
are substantively distinct, responsive and print views pass visual review, PR CI
passes, and no Stage 06+ implementation appears.

Return changed files, architecture decisions, exact commands/results, Case A
advisor and blueprint evidence, model/fallback behavior, screenshots, and known
limitations. Do not push, open/merge a PR, or mark the stage accepted.

## 10. Acceptance record

The main task accepted Stage 05 after one correction cycle and independent local
verification: lint and type-check passed; 17 test files and 103 tests passed; the
production build passed; and the hardened browser/print gate passed at desktop
and 360 px. GitHub PR #3 CI also passed before acceptance. The verified fallback
journey preserved exact Stage 04 Case A figures, stable persistence across reload,
all 16 Blueprint sections, evidence-linked advisor outputs, 44 px controls, no
horizontal overflow, and a clean console. Live AI Gateway execution was not run
without credentials; its bounded retry and failure behavior is covered by
deterministic tests, while the complete no-credential product path was exercised
end to end.
