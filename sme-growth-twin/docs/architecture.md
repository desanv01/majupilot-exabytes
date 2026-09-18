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
variables, or model-provider code. This keeps scoring, ranking, scenario, ROI,
and lead construction deterministic and testable without a browser, database,
or LLM. A
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

## Consultation lead boundary

Stage 06 adds versioned `Lead` and `ConsentRecord` schemas and a pure
`createLead` core. The route boundary accepts bounded JSON, rejects unknown
fields, enforces consent independently, generates all authoritative IDs and
timestamps, and returns only a safe receipt. Idempotency is keyed by a
client-generated submission UUID: identical material replays the original lead,
while changed-payload reuse fails closed.

Consent wording/version, campaign, and initial status enter the generic core
through a versioned `LeadPolicy`. The frozen Exabytes consultation policy lives
in the Exabytes domain pack and is supplied only by API/UI composition roots;
the reusable lead domain and core contain no provider or campaign identifiers.

`LeadStore` is a server-only port. Its current process-local adapter atomically
creates or replays records and retains the exact immutable Blueprint plus a
derived consultant summary. A separate bounded process-local rate limiter stores
only salted hashes of coarse request identifiers, never contact data. These
adapters are honest prototype boundaries and can later be replaced without
changing the domain or UI contracts.

The consultation page revalidates Assessment → Business Twin → Diagnostic →
Recommendation → Scenario → Blueprint before rendering. It never synthesizes a
replacement Blueprint. Only the schema-validated lead receipt is stored in
browser `sessionStorage`; the contact form is not written to browser storage.

## Deferred infrastructure

Durable database storage, authentication, consultant access, notification,
retention automation, and deletion workflows remain deferred. The model boundary
and lead boundary remain server-only; credentials and contact data must never be
introduced into client bundles or logs.

## Stage 07 release boundaries

The Exabytes domain pack owns the schema-validated A/B/C fixture source. Loading
a fixture creates only a fresh `ready_for_review` assessment draft and a
fictional-demo marker; every downstream record is recomputed by the accepted
application flow. A central known-key list scopes reset across local and session
storage and preserves unrelated origin data.

The advisor API rejects invalid/oversized inputs before model work and applies a
salted-hash, process-local IP limiter. Five roles run in parallel; each role has
at most two attempts, 900 output tokens per attempt, and a 12-second total role
budget. A role failure resolves to its deterministic fallback. Static headers
are defined in `next.config.ts`; model-provider modules remain server-only.

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
