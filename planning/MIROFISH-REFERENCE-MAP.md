# MiroFish Reference and Inspiration Map

## Purpose

MiroFish is a primary functional, architectural, workflow, and code-level reference for SME Growth Twin and the future adaptable scenario-intelligence platform.

The team is permitted to inspect the MiroFish repository and code directly. This document turns that inspection into deliberate product decisions. The objective is to understand how features work, learn from successful and weak choices, and rebuild the desired capabilities through our own architecture and implementation.

This is not a prohibition on code inspection. It is a method for making code inspection useful, controlled, and traceable.

---

## Decision vocabulary

Every reviewed MiroFish capability receives one decision:

- **Retain:** preserve the general capability because it directly supports our product.
- **Adapt:** preserve the intent but redesign it for the SME/domain-pack product.
- **Replace:** solve the same responsibility with a different architecture, dependency, or mechanism.
- **Omit:** exclude it because it does not support the current product or milestone.
- **Defer:** preserve it in the long-term roadmap but exclude it from the hackathon build.

---

## Reference workflow

```text
1. Inspect public behavior and relevant code
2. Identify the responsibility being solved
3. Record inputs, outputs, state, dependencies, and failure paths
4. Identify strengths and limitations
5. Choose retain, adapt, replace, omit, or defer
6. Write a neutral requirement
7. Design our contract and architecture
8. Implement independently
9. Test our desired behavior
10. Record the final result and evidence
```

---

## Primary capability map

| MiroFish area | What to inspect | Decision | Our direction |
|---|---|---|---|
| Five-stage workflow | README, main views, route transitions | Retain + adapt | Evidence → twin → advisors/scenarios → blueprint → interaction |
| Project lifecycle | project models, history UI, IDs, deletion | Adapt | Durable assessment/scenario workspace with ownership |
| File ingestion | parser, text processor, upload routes | Defer + replace | Secure parser workers with explicit provenance |
| Ontology generation | ontology generator, schemas, prompts | Adapt | Versioned SME taxonomy first; domain-generated ontology later |
| Graph building | graph builder, Zep lifecycle, paging | Adapt + replace | Relational evidence graph first; pluggable graph storage later |
| Entity reading/filtering | entity reader and graph queries | Adapt | Select relevant processes, actors, capabilities, and evidence |
| Persona generation | profile generator, normalization tests | Adapt | Structured stakeholder and advisor models |
| Simulation configuration | config generator and parameter types | Retain + adapt | Domain-pack scenario templates, assumptions, constraints, and budgets |
| OASIS integration | runners, platform profiles, action logs | Replace | Independent typed-action, reducer, event, and environment kernel |
| Twitter/Reddit environments | simulation scripts and platform rules | Omit for Exabytes | Twelve-month transformation environment |
| Parallel simulation | parallel runner and IPC | Defer + replace | Durable jobs and multi-run orchestration after vertical slice |
| Simulation memory updates | graph updater, barriers, tests | Retain + adapt | Immutable scenario events plus evidence-linked derived state |
| Report agent | tool definitions, report stages, sanitization | Retain + adapt | Evidence-first blueprint planner with bounded analytics tools |
| Report chat | interaction APIs and UI | Retain + adapt | Ask why, retrieve evidence, edit assumptions, rerun |
| Agent interview | agent interaction behavior | Retain + adapt | Interview simulated SME stakeholders and specialist advisors |
| Localization | locale utilities and catalogues | Defer | English first, Bahasa Malaysia after stable P0 |
| LLM compatibility | OpenAI-compatible client and retry logic | Retain + improve | Provider gateway with schemas, budgets, redaction, and recorded calls |
| Background work | daemon threads, task state, polling | Replace | Persistent jobs, checkpoints, cancellation, and recovery |
| Local JSON/filesystem state | models and storage layout | Replace | Transactional database and object storage abstraction |
| Error handling | route errors, tracebacks, frontend states | Replace + improve | Stable error codes, private diagnostics, recoverable UI |
| Security assumptions | CORS, paths, auth, rendering | Replace | Authentication, ownership, upload validation, sanitization, quotas |
| Tests | backend unit tests and fixtures | Learn + replace | Original contract, property, integration, security, and e2e tests |
| Vue frontend | component boundaries and user flow | Learn; do not require | Original typed React UI optimized for assessment and decision work |
| Flask API | route responsibilities and service calls | Learn; do not require | Typed modular boundary suitable for prototype and production evolution |
| Zep | graph/memory responsibilities | Replace as mandatory | PostgreSQL evidence model; optional future adapter |

---

## Code areas to study

The exact archive version should be recorded before analysis.

### Frontend

Inspect:

- application entry and router;
- home, process, simulation, report, and interaction views;
- graph, history, language, and stage components;
- API client boundaries;
- pending-upload and cross-route state;
- polling, progress, error, and empty states.

Questions:

- What state must survive navigation?
- Which stage transitions are user-controlled?
- How are long-running tasks explained?
- Which components are too tightly coupled?
- Which information is essential versus decorative?

### Backend APIs

Inspect:

- graph routes;
- simulation routes;
- report routes;
- request validation;
- task initiation and status;
- file/identifier handling;
- error response shape.

Questions:

- Where do routes own too much business logic?
- Which operations should become durable jobs?
- Which identifiers require ownership checks?
- Which API contracts are useful at the behavioral level?

### Services

Inspect:

- text processing;
- ontology generation;
- graph construction;
- entity reading;
- profile/persona generation;
- simulation configuration;
- simulation manager and runner;
- IPC;
- graph-memory updates;
- report tools and report agent.

Questions:

- What are the true module responsibilities?
- Which state changes are implicit?
- Which outputs should become typed and versioned?
- Which external dependencies own critical behavior?
- Which operations can be deterministic?

### Tests

Inspect:

- structured LLM response tests;
- ontology normalization;
- profile normalization;
- platform profiles;
- simulation preparation failure;
- report sanitization;
- Zep lifecycle, retry, paging, and barriers.

Questions:

- Which failures occurred often enough to deserve regression tests?
- Which contracts are implicit in tests but missing from documentation?
- What new invariants should our architecture enforce?

---

## Feature-parity levels

### Level 1 - Hackathon conceptual parity

- staged evidence-to-report workflow;
- structured business world model;
- generated specialist perspectives;
- configurable scenarios;
- scenario-derived blueprint;
- interactive explanation.

### Level 2 - Strong vertical-slice parity

- optional source document ingestion;
- evidence graph;
- structured stakeholder profiles;
- scenario event timeline;
- saved projects;
- report and stakeholder conversations.

### Level 3 - General platform capability

- pluggable domain environments;
- typed actions and reducers;
- durable jobs;
- replay and branching;
- multiple runs;
- uncertainty comparison;
- model/provider comparison;
- local and cloud operation;
- tenant isolation and audit.

The Exabytes deadline targets Level 1 with selected Level 2 features. The post-hackathon platform targets Level 3.

---

## Transformation principles

### Preserve the responsibility, not automatically the implementation

Example:

```text
MiroFish responsibility:
Maintain simulation memory that the report agent can query.

Our requirement:
Every report claim can retrieve relevant source evidence and scenario events.

Our possible implementation:
PostgreSQL claim/evidence/event tables with bounded report tools.
```

### Improve weaknesses discovered through inspection

Code inspection should specifically identify opportunities for:

- stronger typing;
- smaller modules;
- deterministic mechanics;
- clearer provenance;
- secure identifiers and storage;
- durable task lifecycle;
- bounded cost;
- model portability;
- multi-run comparison;
- accessible and domain-appropriate UX.

### Preserve traceability

For every major inspired feature, record:

| Field | Description |
|---|---|
| Reference area | MiroFish file/module/behavior reviewed |
| Observed responsibility | Problem the code solves |
| Observed limitation | Risk or constraint |
| Decision | Retain, adapt, replace, omit, or defer |
| Neutral requirement | Desired behavior without copied expression |
| Our contract | Schema/API/event/UI responsibility |
| Test evidence | How the outcome is verified |

---

## Initial product transformations

### Graph builder → Business Twin Builder

Inputs:

- assessment answers;
- optional business documents;
- approved product catalogue;
- explicit assumptions.

Outputs:

- business facts;
- process nodes;
- capability nodes;
- pain points;
- objectives;
- evidence edges;
- confidence and missing-evidence markers.

### Persona generator → Stakeholder Model Builder

Inputs:

- business twin;
- employee roles;
- customer segments;
- scenario goals.

Outputs:

- structured role;
- goals;
- constraints;
- concerns;
- influence;
- adoption tendency;
- evidence access;
- memory budget.

### Simulation configuration → Transformation Scenario Definition

Inputs:

- selected interventions;
- budget;
- timeline;
- readiness;
- dependencies;
- adoption assumptions.

Outputs:

- Lean, Balanced, and Accelerated configurations;
- typed action permissions;
- monthly schedule;
- cost and benefit rules;
- cancellation and completion conditions.

### Social action runner → Transformation Event Kernel

The language model may propose a meaningful action. The kernel validates and applies it.

```text
Observe
→ retrieve bounded evidence
→ choose deterministic or model-assisted path
→ propose typed action
→ validate permissions, prerequisites, and budget
→ apply reducer
→ emit immutable event
→ update metrics
```

### Report agent → Blueprint Research Agent

Allowed tools:

- retrieve business facts;
- retrieve score evidence;
- compare scenarios;
- calculate outcome metrics;
- retrieve advisor findings;
- retrieve contradictions;
- list assumptions;
- verify product-catalogue entries.

The final narrative cannot override calculation results.

---

## Reference-analysis deliverables

Before general-platform implementation, produce:

- exact archive/version record;
- complete file inventory;
- route and service inventory;
- frontend journey map;
- MiroFish data-flow diagram;
- graph lifecycle analysis;
- simulation lifecycle analysis;
- prompt and structured-output inventory;
- test and failure-mode inventory;
- dependency responsibility map;
- retain/adapt/replace/omit matrix;
- neutral feature requirements;
- architecture decision records;
- our feature acceptance tests.

---

## Permanent reminder

MiroFish is important to this project because it demonstrates an end-to-end pattern that joins evidence, graph structure, generated actors, simulated interaction, reporting, and continued exploration.

The project should neither ignore that reference nor become trapped by its exact implementation. The intended outcome is:

> Study MiroFish thoroughly, understand it at code level, preserve the valuable responsibilities, redesign them for our product, and independently build a more explainable, adaptable, testable, and domain-appropriate system.

