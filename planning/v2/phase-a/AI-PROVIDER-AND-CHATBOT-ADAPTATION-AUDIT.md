# AI Provider and Chatbot Adaptation Audit

**Frozen:** 19 September 2026 (MYT)
**Target:** MajuPilot V2
**Authorized reference:** `C:\Users\Dv\Desktop\AI CHATBOT PROJECT\ai-chatbot-with-rag` at inspected commit `9eba171`
**License:** MIT, copyright 2025 ElectricCodeGuy

## 1. Current target inventory

- `sme-growth-twin/package.json` declares `ai: ^7.0.105`; `package-lock.json` resolves `ai@7.0.105` and `@ai-sdk/gateway@4.0.85` transitively.
- The adjacent installed baseline's bundled `node_modules/ai` docs/source were inspected at `ai@7.0.107`, including AI SDK 7 migration, `generateText`, `streamText`, `Output.object`, tools, `ToolLoopAgent`, telemetry, and error contracts. Phase implementation still compiles against the target lock (`7.0.105`).
- `src/infrastructure/model-provider/advisor-model-review.ts` is server-only and already uses the AI SDK 7 `generateText` plus `Output.object` pattern, a configured Gateway model string, Zod validation, explicit timeout/output budgets, bounded retry classification, evidence validation, and redacted call metadata.
- Current target execution is optional advisor-only fallback. `.env.example` exposes only `AI_GATEWAY_MODEL`, `AI_GATEWAY_API_KEY`, and Vercel-provided `VERCEL_OIDC_TOKEN`; `AI_EXECUTION_MODE` and operation routing are not implemented.
- Trusted scores and numerics already remain outside the model path. That separation is retained.

## 2. Current authorized chatbot inventory

- `package.json`/lock resolve AI SDK `ai@6.0.39` plus direct OpenAI, Anthropic, and Google provider packages; it is not source-compatible by assumption with target AI SDK 7.
- Supabase SSR uses cookie-backed `createServerClient`, request-time `getClaims`, server-only clients, user-scoped queries, RLS migrations, private Storage paths, and signed uploads.
- `app/api/chat/route.ts` authenticates, normalizes a client model selection, chooses direct provider instances, calls `streamText`, registers website/document tools, caps steps, and persists parts incrementally.
- `lib/model-config.ts` contains hand-maintained aliases and model IDs. These are reference ideas only and cannot be copied because current IDs and Gateway capabilities are runtime data.
- Chat persistence uses `chat_sessions` and a wide `message_parts` schema. `SaveToDbIncremental.ts` and fetch reconstruction use broad `any` casts and provider-shaped columns.
- RLS concepts are user-owned rather than organization/guest-owned. The reconciled migration improves `USING`/`WITH CHECK` and a security-invoker retrieval function, but the wholesale schema, broad grants in the remote dump, public definer trigger, and unrelated subscriptions are rejected.
- Document RAG uses private user PDF paths, a signed upload, LlamaParse, Voyage embeddings, pgvector retrieval, page citations, a privileged processing job, and document-specific tools. This whole pipeline is P1 and must sit behind target parser/retrieval contracts.
- `WebsiteSearchTool.ts` and Google/provider-specific route behavior are outside MajuPilot P0.
- The working tree had unrelated dirty/untracked files during inspection; the audit used committed `HEAD` content and did not read `.env.local`.

## 3. File-by-file decision matrix

| Reference file | Observed pattern | Decision | Phase/required rewrite |
|---|---|---|---|
| `LICENSE.md` | MIT notice and conditions | **Adapt obligation** | A/all: preserve notice for direct copies or substantial portions |
| `package.json`, lock | AI SDK 6; direct provider packages; Supabase SSR | **Reject direct dependency copy** | C/G: use target AI SDK 7 and Gateway boundary; add only reviewed dependencies |
| `lib/server/server.ts` | Cookie-aware Supabase SSR client | **Adapt concept** | B: use current Supabase SSR docs, target types/env names, membership model |
| `proxy.ts` | Refreshes claims through middleware/proxy cookie bridge | **Adapt concept** | B: preserve cookie propagation but verify current Next/Supabase APIs |
| `lib/server/supabase.ts` | Cached claims and user profile lookup | **Adapt with rewrite** | B: claims authenticate; organization membership authorizes; stable safe errors |
| `lib/server/admin.ts` | Explicit server-only service-role client warning | **Adapt boundary, restrict use** | B: background/admin only after application authorization; never general route bypass |
| `lib/client/client.ts` | Browser-client factory marked server-only | **Reject implementation** | B: choose a clearly named server client and, if needed, publishable-key browser client with RLS; no confusing boundary |
| `database/setup.sql` | Basic user/chat/document RLS and Storage policies | **Rewrite** | B: target aggregate schema, explicit grants, per-operation policies, org/guest isolation tests |
| `supabase/migrations/20260819050131_remote_schema.sql` | Remote dump with broad default/table/function grants | **Reject** | B: ordered purpose-built migrations only; revoke then least-privilege grant |
| `supabase/migrations/20260819050430_reconcile_live_application_schema.sql` | Improved `WITH CHECK`, security-invoker retrieval, scoped Storage | **Adapt concepts** | B/P1: target policy/function design and tests; no schema copy |
| `lib/model-config.ts` | Provider registry, aliases, plan tiers, hard-coded IDs | **Rewrite** | C: exact Gateway IDs from current catalogue; operation capability allowlist; no client authority |
| `app/api/models/route.ts` | Model enumeration/selection surface | **Rewrite or omit** | C/H: server allowlist projection only; no arbitrary model identifier |
| `app/api/chat/route.ts` | Authenticated streaming, typed tool registry, step cap | **Adapt concepts** | G: AI SDK 7 `ToolLoopAgent`/stream contract, organization scope, budgets, confirmations, stable errors |
| `app/api/chat/tools/documentChat.ts` | User-scoped retrieval tool and page citations | **Hold P1/rewrite** | P1: target retrieval contract, org authorization, strict output types |
| `app/api/chat/tools/WebsiteSearchTool.ts` | External web search tool | **Reject P0** | Not registered in MajuPilot Copilot without later scoped approval/source policy |
| `app/api/chat/SaveToDbIncremental.ts` | Per-step persistence with broad `any` sanitization | **Reject implementation; adapt durability goal** | G: typed UI/tool parts, transaction/idempotency, finalization and recovery state |
| `app/(dashboard)/chat/[id]/fetch.ts` | Restores persisted UI messages | **Adapt concept, rewrite types** | G: `InferAgentUIMessage` or explicit target message union; tenant scope |
| `lib/document-path.ts` | Opaque UUID Storage path under user prefix | **Adapt concept** | B/P1: opaque org/report/document paths; never display filename identity |
| `app/api/upload/presigned-url/route.ts` | Auth, size limit, opaque signed upload | **Hold P1/adapt** | P1: current Storage policy, MIME/content checks, org quotas, short expiry |
| `app/api/processdoc/route.ts` | Privileged parse/embed pipeline with job token | **Hold P1/rewrite** | P1: idempotent job/outbox, parser adapter, strict ownership, retry/dead-letter, no P0 dependency |
| `app/api/processdoc/agentchains.ts` | Direct Google model IDs and document-generated metadata | **Reject provider coupling** | P1/C: Gateway operation route, strict structured output, injection separation |
| `app/api/pdf/route.ts`, document viewer components | Page/PDF delivery ideas | **Reference only** | E/P1: canonical report is Blueprint-derived; uploaded-document viewer is unrelated |
| Entire chatbot UI/profile/subscription schema | Generic chatbot product assumptions | **Reject** | No merge or UI adaptation in Phase A–H beyond approved MajuPilot integration |

## 4. Confirmed compatibility issues

1. Target `ai@7.0.105` differs from chatbot `ai@6.0.39`. No route, tool, UI-message, provider-metadata, stop-condition, or error API is assumed compatible without checking target bundled docs/source.
2. The target already uses AI SDK 7 `Output.object` with `generateText`; it must not regress to obsolete `generateObject` patterns.
3. AI SDK 7 bundled docs recommend `ToolLoopAgent` for reusable multi-step agents and expose type inference for agent UI messages. The chatbot's manually assembled/provider-shaped `UIMessage` parts and `any` casts require a typed rewrite.
4. The chatbot imports direct provider packages and maps friendly aliases to provider IDs. MajuPilot uses Gateway string IDs/server adapter only; provider-specific options are allowed only behind operation-specific adapter capabilities.
5. Chatbot tool authorization is user-scoped and document-specific. MajuPilot requires guest/organization/assignment scope, explicit confirmation for writes, and deterministic-kernel tool results.
6. The chatbot's database schema and incremental parts model do not encode MajuPilot artifact versions, evidence provenance, consent, Blueprint/report/lead ownership, or tenant roles.

## 5. Server-only Gateway boundary

`AiProviderAdapter` is a server-only interface. Domain/core modules receive normalized results, never SDK provider objects.

Required operations: `proposeFollowUp`, `explainRecommendation`, `runAdvisorReview`, `streamCopilot`, `draftConsultantNote`, and later `summarizeRetrievedEvidence`. Each operation declares:

- input/output schema and schema/prompt version;
- allowed evidence/artifact references;
- configured model route and required capabilities;
- input/output token limits, maximum steps, total timeout, retry policy, per-subject/IP rate, and monetary ceiling;
- whether deterministic fallback exists and how it is disclosed;
- stable safe error mapping and redacted telemetry.

Only server modules read `AI_GATEWAY_API_KEY`, Vercel OIDC credentials, `AI_EXECUTION_MODE`, or model route variables. Raw credentials, provider payloads, raw prompts, contact fields, and complete business context are not returned or logged.

## 6. `AI_EXECUTION_MODE`

| Mode | Contract |
|---|---|
| `required` | Preflight and requested live operation must use an approved current Gateway model. Missing config, unsupported/stale model, timeout, invalid structured output, budget exhaustion, or provider failure returns a visible stable failure (`AI_REQUIRED_UNAVAILABLE`, `AI_INVALID_OUTPUT`, `AI_BUDGET_EXCEEDED`, or `AI_TIMEOUT`). Deterministic core results remain valid but are never labelled live AI. |
| `preferred` | Attempt live AI first. On an allowed failure, use the existing deterministic fallback only where one is defined and label response/call record `deterministic_fallback` with safe reason. Writes remain unperformed unless explicitly confirmed. |
| `disabled` | Do not initialize/call a provider. Deterministic/local fixtures only, with response state `ai_disabled`. Useful for tests/offline operation, not competition proof. |

Competition/demo uses `required`. Unknown values fail startup/preflight rather than defaulting silently.

## 7. Current model selection rule

The authoritative catalogue is `GET https://ai-gateway.vercel.sh/v1/models`. On 19 September 2026 it was fetched directly and included, among others, exact tool-capable IDs `openai/gpt-5.6-sol`, `anthropic/claude-sonnet-5`, and `google/gemini-3.8-flash`. This is evidence of availability on that date, not a permanent default promise.

For every deployment and demo preflight:

1. Fetch/cache the current official model catalogue server-side.
2. Resolve `AI_GATEWAY_MODEL_<OPERATION>` or the reviewed `AI_GATEWAY_MODEL` fallback as an exact catalogue ID; never construct an ID from a friendly alias or memory.
3. Require `type=language`, the operation's modalities, tool use for Copilot, structured-output/tool parameters as needed, context/output limits above the configured budget, and allowed privacy/data-handling properties.
4. Pin the exact resolved ID into the call record and Blueprint/report provenance where output is used.
5. In `required`, fail preflight if the ID disappears or capabilities do not match. In `preferred`, select only from a separately reviewed ordered allowlist; do not silently choose “latest.”
6. A model change is configuration review plus golden/live proof, not a domain or catalogue migration.

## 8. Structured output, tools, telemetry, budget, and errors

- Zod/domain schemas are strict; unknown keys, unsupported evidence IDs, arbitrary tool names, HTML, and numeric mutations are rejected.
- Tools expose deterministic reads and narrow confirmed writes. Tool inputs include scoped artifact IDs, not raw organization selection. The server derives subject/organization from authorization context.
- Copilot uses a fixed typed registry and a hard step cap. Scenario recalculation/ROI input/note acceptance/report generation/consultation require authorization, an explicit user confirmation token bound to intent and current revision, and idempotency.
- Record operation, provider, exact model, execution mode, prompt/schema version, timestamps/latency, token usage, estimated cost where available, attempts, finish/outcome, safe error/fallback category, tool names/count, and evidence/artifact IDs. Do not record raw prompts, secrets, contact data, provider reasoning, or entire tool payloads.
- Per-operation defaults are configuration: follow-up 20 s/one step; explanation/advisor 30 s/one step; Copilot 60 s/max five steps; note draft 30 s/one step. Retry at most once only for classified transient provider/timeout failures and only within total deadline. Never retry validation, authorization, content-policy, or budget failures.
- Enforce per-call input/output limits, daily guest/user/org budget, concurrent-call cap, and IP abuse limit before provider invocation. Exceeding a budget is stable and visible.
- Provider errors are sanitized and correlation-ID based. No error string from a provider is sent directly to a browser.

## 9. Prompt-injection and data separation

- System/developer instructions and tool definitions are static trusted control data.
- Assessment answers, business text, uploaded documents, catalogue excerpts, and retrieved chunks are delimited and labelled untrusted data. They cannot add tools, change authorization, choose products, override classifications, or request secrets.
- Retrieval returns source IDs/page references and bounded excerpts. The model may explain cited facts but cannot promote retrieved text to instruction.
- Tool results are schema validated again before rendering/persistence. Unsupported claims become missing evidence, not inferred fact.
- Minimize contact/personal data sent to providers; default is none. A future necessary use requires purpose-specific consent and a documented operation policy.

## 10. Attribution and RAG boundary

Phase A contains no copied chatbot source. Future direct copies/substantial portions require:

- the chatbot MIT copyright and permission notice in the copied file or a repository third-party notices file;
- a source path/commit and adaptation note in the dependency/license record;
- preservation of third-party dependency licenses;
- no copying of secrets, environment values, private documents, user data, or unrelated UI/assets.

Document RAG remains P1. P0 may define only an interface: private opaque document identity, authorized parser job, chunk/page provenance, embedding provider adapter, tenant-scoped retrieval, citation output, retention/deletion cascade, and prompt-injection separation. No P0 Copilot claim depends on uploaded documents.
