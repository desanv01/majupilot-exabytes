# SME Growth Twin - Execution Orchestration

Status: **Frozen**  
Approved: **17 September 2026**  
Authority: the user-approved operating contract for implementing the hackathon build

## 1. Operating model

This project uses a hub-and-stage workflow.

- **Main task:** planner, product owner, architect, integrator, reviewer, and final acceptance authority.
- **Stage task:** bounded implementer for exactly one approved stage.
- **Shared workspace:** all project tasks work in the saved local project and can see the same files.
- **Execution order:** one active implementation stage at a time unless the main task records a specific exception.
- **Model policy:** each stage task uses `gpt-5.6-sol` with `medium` reasoning. The main task is operated as the high-reasoning planning and review task.

The stage task does not decide what the product becomes. It implements the
contract prepared by the main task and reports verifiable evidence.

## 2. Binding authority order

When instructions appear to conflict, use this order:

1. the user's latest explicit instruction;
2. `MASTER-GAMEPLAN.md`;
3. `DECISION-REGISTER.md`;
4. the current stage packet;
5. `MIROFISH-REFERENCE-MAP.md`;
6. `EXECUTION-CHECKLIST.md`;
7. implementation convenience or an agent's preference.

Only the main task may approve a change to levels 2-6. A stage task must stop
and report a conflict rather than silently reinterpret it.

## 3. Lifecycle of every stage

```text
PLAN -> DISPATCH -> IMPLEMENT -> SELF-TEST -> REPORT
                                     |
                                     v
                    MAIN INSPECTION AND INDEPENDENT TEST
                              |                |
                           REJECT             ACCEPT
                              |                |
                       CORRECTION LOOP    UNLOCK NEXT STAGE
```

### PLAN

The main task writes or updates the stage packet. It specifies:

- objective and user-visible outcome;
- prerequisites;
- exact in-scope work;
- protected and out-of-scope areas;
- expected files and contracts;
- required validation commands;
- evidence the implementer must return;
- acceptance criteria and rollback considerations.

### DISPATCH

The main task creates one new project task with:

- a stage-specific title;
- GPT-5.6 Sol;
- medium reasoning;
- the saved local project as its environment;
- the complete implementation packet in the prompt.

### IMPLEMENT AND SELF-TEST

The stage implementer:

1. reads the named planning sources in full;
2. inspects existing code before editing;
3. implements only the stage scope;
4. preserves unrelated user changes;
5. adds or updates tests with the implementation;
6. runs every required validation command;
7. reports failures honestly and does not start the next stage.

### REPORT

Every stage report must include:

- concise outcome;
- files created, changed, or removed;
- design decisions actually made;
- commands run and their exit status;
- test/build results;
- known limitations, risks, or unresolved questions;
- a proposed handoff for the next stage.

### MAIN INSPECTION

The main task independently checks:

- actual files and diffs, not only the report;
- conformity with the master plan and frozen decisions;
- module boundaries, schemas, and deterministic-core rules;
- test quality and meaningful coverage;
- build, lint, type-check, and relevant end-to-end behavior;
- security, privacy, error, and fallback behavior proportional to the stage;
- the applicable retain/adapt/replace/omit decisions from the MiroFish map.

### CORRECTION LOOP

If a gate fails, the main task sends a concrete correction packet back to the
same stage task. The correction names the defect, evidence, required outcome,
allowed scope, and tests to rerun. The stage remains open until accepted or
explicitly re-planned.

### ACCEPT

The main task records acceptance in `STAGE-LEDGER.md`, including evidence and
known deferred items. Only then may it dispatch the next stage.

## 4. Global implementation rules

- Build the hackathon P0 path before P1 or P2 features.
- Use MiroFish as an important reference and inspect it when useful, but rebuild through this project's own domain model, architecture, terminology, UX, prompts, tests, and code.
- Put calculations, rankings, scenario mechanics, and other reproducible rules in deterministic TypeScript modules.
- Use an LLM only for bounded interpretation, explanation, advisor perspectives, and narrative synthesis.
- Keep the numeric and navigation core usable when model access is unavailable.
- No deployment, public publishing, destructive cleanup, dependency migration, or architecture replacement unless the current packet permits it.
- No stage task may mark itself accepted.
- Do not hide errors, weaken tests to make them pass, or replace real validation with mocked success.
- Do not begin later-stage work merely because it is nearby or convenient.

## 5. Phase map

| Stage | Name | Core result | Gate owner |
|---|---|---|---|
| 00 | Foundation and Baseline | canonical app root, clean toolchain, architecture skeleton, testable baseline | Main task |
| 01 | Discovery and Business Twin | five-question adaptive assessment and validated twin state | Main task |
| 02 | Deterministic Intelligence | maturity/readiness scores, pain ranking, explanations, golden fixtures | Main task |
| 03 | Recommendations and Catalogue | capability-first matching and curated Exabytes catalogue mapping | Main task |
| 04 | Scenario and ROI Lab | three editable scenarios, deterministic projections, range-based ROI | Main task |
| 05 | Advisor Panel and Blueprint | bounded advisors, synthesis, roadmap, report/print output | Main task |
| 06 | Consultation and Full UX | consented lead handoff and complete responsive end-to-end journey | Main task |
| 07 | Hardening and Submission | fallbacks, security, accessibility, E2E, demo fixtures, recording evidence | Main task |

Stages may be re-sized by the main task to protect the submission deadline, but
their acceptance criteria may not be silently discarded.

## 6. Naming and communication

- Task title: `SME Growth Twin - Stage NN <Name>`.
- Correction prompt: `Stage NN correction <number>: <short outcome>`.
- A stage task communicates implementation facts and risks; the main task communicates acceptance and planning decisions.
- Important cross-stage decisions are added to the decision register or an architecture decision record, never left only in chat history.

## 7. Definition of a valid stage handoff

A stage is ready for review only when:

1. all in-scope acceptance criteria are mapped to evidence;
2. all required commands were run or a specific blocker is documented;
3. no unapproved later-stage functionality was added;
4. changed behavior has tests;
5. the application remains buildable from documented steps;
6. unresolved risks are explicit;
7. the implementer has stopped and is waiting for main-task review.

