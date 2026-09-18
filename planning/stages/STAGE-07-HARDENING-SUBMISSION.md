# Stage 07 - Hardening and Submission

Status: **Frozen for implementation**  
Owner: **Main planning and integration task**  
Implementer: **Dedicated GPT-5.6 Sol Medium task**  
Date frozen: **18 September 2026**

## 1. Objective

Turn the accepted Stage 06 prototype into a reproducible, submission-ready
release candidate. Close the remaining software-owned security, resilience,
accessibility, golden-case, demo-reset, end-to-end, release-evidence, and
deployment-readiness gaps without changing the accepted business rules or
claiming that human/external submission actions occurred.

The user-visible outcome is a judge-safe application that can start normally or
load any of three clearly fictional golden cases, recover to a clean state,
complete the full deterministic fallback journey, and demonstrate its evidence,
limitations, and implementation quality locally and on an inspected deployment.

## 2. Prerequisites and authority

Read in full before editing:

1. `planning/MASTER-GAMEPLAN.md`;
2. `planning/DECISION-REGISTER.md`;
3. `planning/EXECUTION-ORCHESTRATION.md`;
4. `planning/EXECUTION-CHECKLIST.md`;
5. `planning/STAGE-LEDGER.md`;
6. `planning/MIROFISH-REFERENCE-MAP.md`;
7. this contract;
8. `planning/design/stage-07/DESIGN-BRIEF.md` and `DESIGN-REVIEW.md`;
9. `SECURITY.md`, repository `README.md`, and application documentation;
10. `sme-growth-twin/AGENTS.md` and the relevant Next.js 16 bundled guides.

Stages 00-06 are immutable accepted prerequisites. Preserve their exact Case A
outputs, deterministic arithmetic, evidence links, recommendation sequencing,
scenario calculations, advisor invariants, Blueprint identity, consent rules,
and lead privacy guarantees.

## 3. Scope boundary

### In scope

- three typed, schema-validated fictional golden demo cases;
- safe demo load and reset controls using only known application storage keys;
- Case A, B, and C end-to-end deterministic tests;
- a complete Case A browser journey under five minutes in deterministic mode;
- keyboard-only critical-flow verification and automated critical accessibility
  scanning on representative routes/states;
- desktop and 360 px layout checks across every public product route;
- explicit output-token/time/call budgets for the advisor analysis endpoint;
- privacy-minimizing rate limiting for the expensive advisor endpoint as well as
  the existing lead endpoint;
- security headers, dependency audit, secret/client-boundary checks, and safe
  error/fallback verification;
- repeatable local release and offline-model demonstration commands;
- deployment configuration and an inspected Vercel preview/production artifact;
- release manifest, checksums, test evidence, architecture/methodology material,
  third-party register, demo script, captions/shot list, judge Q&A, manual
  submission checklist, rollback notes, and exact known limitations;
- README, architecture, security, and operator documentation updates;
- focused CI additions that remain reliable on GitHub-hosted Ubuntu runners.

### Out of scope

- changing score weights, catalogue mappings, ROI formulas, or frozen scenario
  and advisor rules;
- authentication, organizations, consultant administration, CRM integration,
  email/webhook delivery, or durable production lead storage;
- storing real customer data or presenting the deployment as production-ready;
- adding document upload, bilingual support, graph databases, event sourcing,
  multi-run stochastic simulation, or advisor chat;
- inventing user-test results, judge-rehearsal results, catalogue approval,
  YouTube visibility, competition-form submission, or a submission receipt;
- uploading a video or submitting the competition entry without a later explicit
  action using the actual accounts and final materials;
- weakening prior tests or substituting screenshots for behavioral evidence.

## 4. Golden demo-case contract

Create one production-owned, typed module for fictional demo fixtures; tests and
UI must import the same source rather than maintain copies.

Each case contains a stable public ID, label, sector, short challenge summary,
`CoreAnswers`, selected follow-up IDs, follow-up answers, fixture version, and a
clear fictional/demo marker. Validate every fixture with existing domain schemas
at module initialization. Do not pre-store diagnostic, recommendation, scenario,
advisor, Blueprint, consent, or lead records: downstream artifacts must be
recomputed through the actual application journey.

### Case A - Kopi Kita Café Group

- Primary recommended demo.
- Preserve the exact accepted Stage 02-06 answers and follow-ups.
- Expected frozen headline outputs include digital maturity `37.5`, AI readiness
  `42.5`, Balanced Growth, first-year cost `9200/18400/27600`, and payback
  `7.2/30.4/140.5` months.

### Case B - Precision Parts Manufacturing

- 48-employee B2B manufacturing business.
- Business email and local accounting exist; quotation tracking and quality
  records remain manual/shared-drive based.
- Strong leadership support, low data/process readiness.
- Expected behavior: foundations and structured workflow/data precede AI;
  backup/security remain visible; AI is later/conditional.

### Case C - Northstar Digital Studio

- Nine-person boutique digital agency.
- Strong cloud, marketing, security, and digital skills; weaker CRM and capacity
  planning; moderate/informal AI use.
- Expected behavior: a smaller/selective recommendation set, CRM/workflow and
  scalable operations fit, and governed AI only where prerequisites permit.

For B and C, freeze exact scores, recommendation ordering, selected scenario,
cost/value/payback states, advisor origins, and Blueprint section completeness in
Stage 07 tests after deriving them from the current accepted rules. Do not tune
rules to force a desired fixture result; if the result conflicts with the
approved narrative, report it to the main task.

## 5. Demo launcher and reset

1. Preserve “Start assessment” as the primary home action.
2. Add a secondary “Fictional demonstration cases” surface for A/B/C using the
   frozen local design references.
3. Loading a fixture must require one deliberate action, clear only the known
   assessment/diagnostic/recommendation/scenario/Blueprint/lead-receipt keys,
   save a `ready_for_review` assessment draft with a new valid session ID and
   current timestamp, then navigate to Business Twin review.
4. Never call `localStorage.clear()` or `sessionStorage.clear()`.
5. Never pre-create consent or a lead.
6. Provide a separately confirmed reset that removes only known project keys,
   returns to `/`, restores the normal empty state, and reports completion via an
   accessible status message.
7. Demo labels must remain visible after load so a recording cannot confuse a
   fictional fixture with a real business.
8. All controls require visible focus, descriptive accessible names, 44 px
   minimum target height, and a 360 px-safe layout.

## 6. Model budget and expensive-endpoint rate limit

Make the existing live advisor boundary auditable without changing its fallback
behavior:

- exactly five frozen roles per panel;
- maximum one retry per role;
- maximum 900 output tokens per attempt;
- maximum 12 seconds per role including retry;
- document the maximum ten attempts / 9,000 output-token ceiling for one request;
- reject malformed or over-sized inputs before model work;
- apply a bounded process-local hashed-IP rate limit before starting advisor
  calls; never store raw IP, contact data, business answers, or prompts in the
  limiter;
- return stable `429 rate_limited`, `Retry-After`, and `Cache-Control: no-store`;
- keep deterministic five-role fallback available when credentials are absent or
  individual model roles fail;
- add unit/API tests for allowed, rejected, reset-window, and privacy behavior.

The limiter is explicitly prototype-grade and per-instance. Document that it is
not a distributed production quota.

## 7. Security and privacy hardening

- Add appropriate static response headers for the current app: frame denial,
  MIME sniffing denial, conservative referrer policy, restrictive permissions
  policy, and a CSP compatible with Next.js runtime behavior. Test the actual
  headers in production mode and do not add a CSP that breaks hydration.
- Verify secrets remain server-only and no committed file contains credential
  values. A client module must never import the server model adapter.
- Keep request-body bounds and strict Zod schemas on both APIs.
- Keep contact PII out of logs, responses, URLs, browser persistence, fixtures,
  screenshots, and release evidence.
- Add a dependency audit command and CI gate for high/critical production
  vulnerabilities. Record lower-severity/development-only findings honestly.
- Document prototype retention/deletion truth: browser records can be cleared by
  reset; process-local lead records disappear with instance lifecycle; no formal
  production retention/deletion service exists.
- Do not claim encryption, tenant isolation, durable storage, monitoring, audit
  logs, or compliance certification.

## 8. Accessibility, responsive, and performance evidence

Create a hermetic Stage 07 release/browser harness. It must use unique temporary
Chrome profiles and artifact directories by default, clean them in `finally`,
and leave the Git worktree unchanged. An explicit artifact directory may retain
accepted screenshots/reports.

Required checks:

- automated critical accessibility scan with `axe-core` (or an equivalently
  inspectable local engine) on home, assessment, review, results,
  recommendations, scenarios, Blueprint, consultation form, and success state;
- zero critical or serious violations on the representative accepted states;
- keyboard-only Case A critical journey, including focus visibility and logical
  order; pointer scripting may prepare deterministic prerequisites only when the
  reported gate is not called keyboard-only;
- every public route at 1440 px and 360 px has no horizontal overflow;
- interactive controls are at least 44 px high except semantically inline links;
- headings, labels, landmarks, live/error messages, disclosure controls, and
  consent semantics remain meaningful;
- no browser console error, unhandled exception, Next error overlay, failed same-
  origin request, or indefinite loading state;
- production-mode Case A journey duration is measured and must be under five
  minutes in deterministic fallback mode;
- record navigation/load measurements as local evidence without presenting them
  as universal production benchmarks.

## 9. End-to-end release cases

The Stage 07 harness must exercise real application routes and persistence:

1. Case A: load fixture, review, diagnose, inspect evidence, recommendations,
   choose/edit scenario, generate fallback advisors/Blueprint, print contract,
   enter consultation, verify default-unchecked consent, submit fictional contact
   data, validate safe receipt and idempotent replay, then reset.
2. Case B: load, run through Blueprint in deterministic fallback, assert frozen
   foundation-first outputs and complete sections, then reset.
3. Case C: load, run through Blueprint, assert selective outputs and complete
   sections, then reset.
4. Model outage: force no Gateway credentials and prove all cases still finish.
5. Security: rate-limit advisor and lead APIs without leaking submitted data.
6. Mobile: verify representative full-journey states at 360 px.

No test may depend on real model credits, network availability, or production
lead durability. Live Gateway and deployed tests are separate opt-in evidence.

## 10. Submission and release package

Create `planning/submission/` with at least:

- `README.md` — package map and current truth;
- `DEMO-SCRIPT.md` — timed 6-10 minute narration, target 8.5-9 minutes;
- `SHOT-LIST-AND-CAPTIONS.md` — exact routes, actions, on-screen callouts, and
  captions so the video remains understandable with sound off;
- `JUDGE-QA.md` — concise, evidence-backed answers to the master-plan questions;
- `ARCHITECTURE-AND-METHODOLOGY.md` — Mermaid diagrams plus deterministic-vs-AI
  boundary, MiroFish inspiration/originality, data flow, fallback, and limits;
- `THIRD-PARTY-REGISTER.md` — frameworks, libraries, models/providers, 12ui,
  Vercel, GitHub Actions, source catalogue, licences/roles, and what the team
  built itself;
- `TEST-EVIDENCE.md` — commands, case outputs, accessibility/security/performance
  results, dates, environment, and honest limitations;
- `DEPLOYMENT-RUNBOOK.md` — preview, promotion, rollback, environment, health,
  protected URL, and failure-recovery steps;
- `SUBMISSION-CHECKLIST.md` — distinguish automated/complete from manual/pending
  YouTube, signed-out visibility, form, receipt, and human review tasks;
- `MANUAL-VALIDATION-FORM.md` — repeatable five-user observation form with no
  fabricated results;
- `RELEASE-MANIFEST.md` plus a deterministic script that records Git commit,
  Node/npm versions, catalogue/rule/model versions, command results, artifact
  hashes, deployment URL/status when known, and pending manual gates.

The package must be useful without chat history. Do not embed credentials, real
PII, unpublished source documents, or unsupported competition claims.

## 11. Deployment contract

The implementer prepares and locally validates the deployment configuration but
does not silently create or promote an external project. The main task performs
the external Vercel action after independent review.

Deployment requirements:

- correct monorepo/root configuration for `sme-growth-twin/`;
- Node version compatible with the repository engines and Vercel;
- build succeeds without model credentials;
- optional Gateway variables stay server-only;
- deployment is explicitly labelled a fictional-data hackathon prototype;
- browser→API→data→response verification covers home, one full Case A fallback
  journey, advisor fallback response, consultation validation, and safe receipt;
- inspect deployment/build status and runtime errors;
- record URL, target, status, commit, framework, build duration when available;
- preserve a rollback target/instruction;
- never submit real contact details during deployed validation.

Because the lead store and rate limiters are process-local, the deployed build is
not a durable lead system and must not be presented as one.

## 12. CI and commands

Add stable scripts with clear names, expected to include:

- `npm run test:stage07:golden`
- `npm run test:stage07:browser`
- `npm run test:stage07:security`
- `npm run release:manifest`
- `npm run audit:production`

Keep the existing PR quality job. Add only hermetic Stage 07 checks suitable for
Ubuntu CI; Windows/Chrome-specific screenshot evidence may remain a documented
local acceptance gate if CI cannot run it reliably. Pin action major versions
already accepted by this repository; do not introduce floating executable
downloads during tests.

## 13. Required validation

The implementer must run and report exact exit status for:

1. `npm ci` if dependencies changed;
2. `npm run lint`;
3. `npm run type-check`;
4. `npm test`;
5. `npm run build`;
6. `npm run test:stage05:browser`;
7. `npm run test:stage06:browser`;
8. all new Stage 07 scripts;
9. `npm run audit:production`;
10. `git diff --check`;
11. `git status --short` after every artifact-generating harness.

The main task reruns high-risk gates independently and reviews changed TSX files
against the React best-practices skill.

## 14. Acceptance criteria

Stage 07 may be accepted only when:

1. A/B/C use one validated fixture source and pass end to end.
2. Case A exact accepted values remain unchanged.
3. Demo load/reset is scoped, confirmed, accessible, and never creates consent
   or a lead prematurely.
4. Deterministic fallback completes the full flow with no credentials.
5. Advisor output budget and both expensive/lead rate limits are tested.
6. Critical/serious automated accessibility violations equal zero on the
   representative route/state set.
7. The critical Case A keyboard journey passes and completes under five minutes.
8. All public routes pass desktop/360 overflow and clean-console checks.
9. Security headers work in a production build; high/critical production
   dependency findings equal zero or acceptance is explicitly blocked.
10. The release harness is hermetic and leaves the worktree clean.
11. The submission package is complete, internally consistent, and contains no
    fabricated human/external evidence.
12. A reviewed Vercel artifact is `READY` and its fallback journey is verified,
    or a specific external account/platform blocker is documented without
    falsely marking deployment complete.
13. Local lint, type-check, tests, prior browser gates, build, and GitHub CI pass.
14. The stage is published through its own PR and merged only after main-task
    acceptance.

## 15. Manual gates that remain pending until actually performed

These are prepared by Stage 07 but stay unchecked without real evidence:

- five human usability tests;
- Exabytes/owner catalogue approval beyond existing official-source review;
- judge Q&A rehearsal;
- 48-hour final freeze relative to the actual event;
- final narrated 6-10 minute video render;
- YouTube upload and signed-out visibility test;
- competition form submission;
- exact submitted build/video/report archive and official receipt.

## 16. Implementer handoff format

Return:

- outcome and user-visible behavior;
- files created/changed/removed;
- exact golden outputs for A/B/C;
- accessibility, responsive, security, audit, duration, and browser evidence;
- all commands with exit codes and test counts;
- screenshots/report paths and whether harnesses left a clean worktree;
- deployment configuration status but no unsupported deployment claim;
- unresolved risks/manual gates;
- commit SHA and confirmation that no Stage 08/post-hackathon scope was started.

The implementer must stop after reporting. Only the main task may accept Stage
07, perform external deployment/promotion, publish the PR, merge it, and mark the
overall build ready for manual submission.
