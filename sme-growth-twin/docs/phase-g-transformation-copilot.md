# Phase G: Transformation Copilot core

Phase G adds the server-side Copilot contract without adding a broad chat UI, document ingestion/RAG, outbox delivery, or hosted deployment work.

## Durable chat

`chat_sessions` is bound to one authorized assessment and freezes its optional Business Twin and Blueprint references. It records exclusive guest/organization ownership, schema/prompt/model versions, status, timestamps, and the next append sequence. Session creation is idempotent on the assessment and caller key.

`chat_messages` is append-only. User, assistant, and tool-result rows carry an atomic sequence, turn identity, typed message kind, safe tool provenance, execution disclosure, schema version, timestamps, content hash, and optional redacted `model_calls` linkage. Direct client grants on chat sessions and messages are revoked so writes must cross the server-owned authorization and sequencing boundary. `copilot_turn_receipts` makes a retried turn return its first durable response. History can therefore resume after process or browser restart without reconstructing provider-specific payloads.

## Model execution and disclosure

The operation is `transformation_copilot` through the existing server-only Vercel AI Gateway policy. `AI_GATEWAY_MODEL_COPILOT` may override the reviewed general model. Current-model preflight requires a language model with text I/O, output capacity, and tool support.

- `required`: a missing credential/model, invalid output, timeout, provider failure, or budget failure is visible; no fallback is labelled live.
- `preferred`: live execution is attempted, then an authorized deterministic read is returned as `deterministic_fallback` with the safe reason recorded.
- `disabled`: no provider or catalogue call occurs; one authorized deterministic read is returned as `ai_disabled`.

The hard defaults are 60 seconds total, one transient retry, 10,000 estimated input tokens, 1,500 output tokens, five tool calls, 12 calls/minute per scoped caller/client key, USD 0.10 estimated per call, and the shared USD 2 daily owner ceiling. Tool results are capped before entering the model loop. Model-call telemetry stores only operation/provider/exact model, prompt/schema versions, timing, tokens/cost, retry/outcome, safe error, tool names/count, finish reason, and referenced IDs. Raw prompts, answers, provider payloads/reasoning, contact data, and credentials are not duplicated into telemetry; the bounded user and assistant text required for durable chat remains in the authorized message ledger.

## Typed tools and authorization

The fixed read registry is:

- `getBusinessTwinSummary`, `getEvidenceForClaim`, `explainDigitalMaturity`, `explainAiReadiness`, `listPainPoints`;
- `listRecommendations`, `compareScenarios`, `searchExabytesCatalogue`;
- `getBlueprint`, `getReportMetadata`, `getLeadStatus`, `getAcceptedConsultantNotes`.

Every invocation re-authorizes the session and constrains artifact IDs to its assessment. Accepted notes additionally require consultant, sales-manager, or system-admin role. Report retrieval returns metadata/handoff only, not a persisted signed URL. Unknown tools, malformed arguments, cross-assessment IDs, expired/revoked guests, inactive membership, and cross-tenant access fail closed.

The fixed write registry is `recalculateScenario`, `collectMissingRoiInput`, `draftConsultantNote`, `acceptConsultantNote`, `generateBlueprintReport`, and `requestConsultation`. A model call can only create an expiring `pending` proposal with a canonical argument hash. A separate authenticated endpoint requires literal `CONFIRM`, revalidates ownership/role, claims one execution idempotency key, invokes the existing Phase B–F domain capability, and appends immutable confirmation audit events. Model text alone never executes a write. Scenario/ROI confirmation creates a new deterministic scenario revision; it never overwrites an old revision.

System instructions and tool definitions are static trusted control data. Chat text and all artifact/tool fields are delimited or handled as untrusted data. Explicit prompt-injection patterns are rejected, and retrieved text cannot add tools or change authorization.

## API surface

- `POST /api/v2/copilot/sessions` — create/resume an authorized scoped session.
- `GET /api/v2/copilot/sessions/{id}/messages` — bounded ordered history/resume.
- `POST /api/v2/copilot/sessions/{id}/turns` — execute one bounded idempotent turn.
- `POST /api/v2/copilot/confirmations/{id}` — explicitly confirm and idempotently execute one proposed write.
- `GET /api/v2/copilot/status` — truthful live/fallback/disabled readiness and limits.

All responses use `no-store`, bounded schemas/bodies, stable safe errors, and correlation IDs.

## Deliberate boundary

Document ingestion, embeddings, retrieval, and uploaded-document citations remain P1 and are not registered as Copilot tools. Phase H still owns outbox/delivery and the smallest stable application integration. Phase I owns hosted and final live proof.

## Validation

Focused unit tests cover disabled disclosure, append ordering intent, turn replay, typed read routing, prompt-injection rejection, unknown-tool rejection, and strict write schemas. The local API smoke proves persisted restart/resume history, one authorized Twin tool path, idempotent turn replay, and cross-session/injection/unknown-tool denial. The pgTAP suite proves RLS, service-only confirmation tables, safe linkages, fixed write allowlist, pending-proposal semantics, explicit confirmation, immutable audit, and idempotency. A live Gateway credential is intentionally not copied into the worktree; the coordinator must run one required-mode Copilot tool-call proof in the target environment.
