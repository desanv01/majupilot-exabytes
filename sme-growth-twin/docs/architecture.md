# Architecture

## Baseline

SME Growth Twin is a Next.js App Router modular monolith. The browser and server
are delivered as one application, while domain rules, application boundaries,
and infrastructure concerns stay separate in the source tree.

```text
src/app            Next.js routes and composition
src/components     Reusable presentation components
src/core           Pure deterministic domain rules
src/domain         Shared types and Zod boundary schemas
src/infrastructure Server-only providers and persistence adapters
src/lib            Framework-neutral technical helpers
```

## Dependency direction

```text
app -> core -> domain
app -> infrastructure -> domain
components -> domain (types only, when needed)
```

`core` must not import `app`, `infrastructure`, Next.js APIs, environment
variables, or model-provider code. This keeps scoring, ranking, scenario, and
ROI rules deterministic and testable without a browser, database, or LLM. A
unit-level architecture test enforces the most important forbidden imports.

## Boundary validation

Zod schemas validate untrusted input and future persisted records at their
entry boundaries. Once parsed, internal modules use inferred TypeScript types.
Identifiers use typed prefixes and brands to reduce accidental cross-entity
mixing. Facts, evidence, and assumptions are distinct arrays in `BusinessTwin`.

## Local diagnostic persistence

Stage 02 adds a separate versioned browser adapter for validated diagnostic
results. The adapter distinguishes empty, corrupt, incompatible, and stale
records. Session, twin identity/revision, score-model version, and pain-model
version are checked before a result may be reused. Diagnostic data is not
embedded in the assessment draft.

## Deferred infrastructure

The persistence layer currently exposes only a `RecordStore` port. No SQLite or
hosted adapter is needed for the Stage 00 shell. The model boundary is a
server-only `ModelProvider` port with no implementation, request, prompt, or
provider dependency. Later stages must keep credentials and calls on the server.

## Domain packs

`DomainPack<TKnowledge>` owns domain-specific knowledge and versions independently
from the deterministic core. An eventual Exabytes pack will implement this
interface; Stage 00 deliberately contains no questions, catalogue entries,
recommendation rules, scenario templates, or prompts.

## MiroFish reference decision

Read-only inspection of the supplied MiroFish archive confirmed the value of a
staged lifecycle and explicit module responsibilities. Its Vue/Flask split,
filesystem project persistence, route names, prompts, and directory structure
were not adopted. SME Growth Twin uses its own contracts, terminology, Next.js
architecture, tests, and UI, consistent with the approved reference map.
