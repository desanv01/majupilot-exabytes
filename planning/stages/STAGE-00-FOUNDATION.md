# Stage 00 - Foundation and Baseline

Status: **Accepted by main task on 17 September 2026**  
Implementer profile: **GPT-5.6 Sol, medium reasoning**  
Gate owner: **Main task**

## 1. Objective

Create a clean, reproducible, testable implementation foundation for SME Growth
Twin without implementing the assessment or any later product feature.

At the end of this stage there is exactly one canonical web application root,
a documented architecture skeleton, stable development commands, a deterministic
domain-core boundary, and passing baseline validation.

## 2. Required reading

Read these files completely before changing code:

1. `planning/MASTER-GAMEPLAN.md`
2. `planning/DECISION-REGISTER.md`
3. `planning/MIROFISH-REFERENCE-MAP.md`
4. `planning/EXECUTION-ORCHESTRATION.md`
5. `planning/EXECUTION-CHECKLIST.md`

Inspect the available MiroFish research and source material read-only where it
helps validate architectural boundaries. Do not copy its implementation or
reproduce its directory structure.

## 3. Starting conditions

- The saved project root is `C:\Users\Dv\Desktop\AI HORIZON HACKATHON (EXABYTES)`.
- The root is not currently a Git repository.
- `sme-growth-twin` is an earlier experimental scaffold, not yet an accepted implementation baseline.
- Existing planning documents and hackathon source materials are protected.
- Nothing should be deployed or publicly published in this stage.

## 4. In scope

### 4.1 Audit before editing

Inventory the root and `sme-growth-twin`. Determine:

- framework and dependency versions;
- existing pages, components, routes, schemas, database code, generated files, and hosting metadata;
- whether the scaffold builds now;
- which contents are generic starter material, useful foundation, premature feature work, or unsafe to retain;
- whether any secrets, generated artifacts, or machine-local files are present.

Record the result in `sme-growth-twin/docs/implementation-baseline.md`.

### 4.2 Establish the canonical app

Use `sme-growth-twin` as the canonical application directory. Preserve useful
scaffold work when it fits the approved stack; replace only what is necessary
to establish the baseline. Do not delete material merely for tidiness. If a
destructive cleanup or incompatible migration appears necessary, stop and
report it to the main task.

The approved baseline is:

- Next.js App Router;
- React and TypeScript with strict type checking;
- a modular monolith;
- Zod at input and persisted-data boundaries;
- pure TypeScript for deterministic domain rules;
- Vitest for unit tests;
- Playwright reserved for later end-to-end stages;
- SQLite/local persistence only if the existing scaffold genuinely needs persistence at baseline; otherwise define the port and defer the adapter;
- server-only interface for future OpenAI-compatible model access, with no provider call in Stage 00.

Use the existing package manager and lockfile if healthy. Do not perform broad
dependency upgrades. Add only a missing dependency that is necessary for this
foundation and document why.

### 4.3 Required structure and contracts

Create or normalize a structure equivalent to the following; adapt names only
when the existing framework convention makes the alternative clearly better:

```text
sme-growth-twin/
  docs/
    architecture.md
    implementation-baseline.md
    local-development.md
  src/
    app/
    components/
    core/
      assessment/
      scoring/
      pain-points/
      recommendations/
      scenarios/
      roi/
      advisors/
      blueprint/
    domain/
    infrastructure/
    lib/
  tests/
    unit/
```

Empty future modules should be represented by concise boundary documentation or
barrel/type placeholders only when needed; do not add invented feature logic.

Define the minimal shared TypeScript contracts needed for later stages:

- branded/string IDs or a consistent ID strategy;
- `AssessmentSession` lifecycle states;
- `BusinessTwin` top-level shape with evidence and assumption separation;
- score-result and explanation shapes;
- a `DomainPack` interface that isolates Exabytes-specific knowledge;
- version metadata for rules and catalogues;
- a model-provider port that cannot be imported by deterministic core modules.

Validate untrusted boundary data with Zod. Internal deterministic types should
remain usable without an LLM or database.

### 4.4 Baseline application behavior

The root page may be a restrained project shell showing:

- product name;
- one-sentence pitch;
- an honest “foundation build” or equivalent status;
- no fake assessment, scores, recommendations, advisors, or scenario output.

This is not a UI-design stage. Do not spend time on decorative polish.

### 4.5 Tooling and documentation

Ensure documented commands exist for:

- install;
- local development;
- lint;
- type-check;
- unit tests;
- production build.

Create `.env.example` only for variables genuinely expected later; use safe
empty/example values and never expose a real secret. Ensure local secrets and
generated build output are ignored appropriately.

Add at least:

- one domain-contract validation test;
- one import-boundary or architectural invariant test if practical;
- one page/server smoke test if supported without brittle setup.

## 5. Out of scope

Do not implement:

- the five-question experience;
- follow-up selection;
- real scoring or pain ranking;
- the Exabytes product catalogue or matching rules;
- scenarios or ROI formulas;
- advisor prompts or LLM calls;
- blueprint/PDF generation;
- lead submission;
- authentication;
- deployment or hosting changes;
- a visual redesign;
- P1/P2 features.

Do not change frozen product decisions or planning sources except to report a
specific contradiction to the main task.

## 6. Required validation

Discover the actual package scripts, then run all applicable equivalents of:

```text
install using the repository lockfile
lint
type-check
unit tests
production build
```

If a command is unavailable, add a conventional script where justified. Report
the exact commands, exit codes, and relevant totals. Do not call a stage complete
with unexplained failures.

## 7. Acceptance criteria

The main task may accept Stage 00 only if:

1. `sme-growth-twin` is unambiguously the canonical application root.
2. The existing scaffold has been audited and the keep/change decisions are documented.
3. The approved stack and module boundaries are visible in code and documentation.
4. Shared contracts are minimal, typed, validated at boundaries, and independent of any model provider.
5. No product feature from Stage 01 or later was prematurely implemented.
6. Install, lint, type-check, tests, and production build succeed, or a genuine external blocker is proven.
7. No secret, public deployment, or accidental destructive cleanup was introduced.
8. A fresh implementer can start Stage 01 from the documented commands and structure.

## 8. Required completion report

Return:

- outcome summary;
- audit findings and keep/change decisions;
- complete list of files created, modified, or removed;
- dependency changes with reasons;
- exact validation commands and results;
- tests added and what each proves;
- known limitations and risks;
- any decision the main task must make;
- explicit confirmation that no Stage 01+ functionality or deployment was started.

Then stop and wait for review.
