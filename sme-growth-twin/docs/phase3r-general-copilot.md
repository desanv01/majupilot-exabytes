# Phase 3R: general Copilot with assessment RAG and public web search

## Corrective scope

Phase 3R replaces the narrow document-question router with one normal, multi-turn
Copilot loop. It starts only from the existing completed-Blueprint gate and keeps
all private reads assessment scoped. A user can now ask an ordinary question with
no upload, continue a saved conversation, inspect uploaded evidence, request a
current public-web check, combine private and public sources, or propose a write
that remains pending until explicit confirmation.

This change does not alter assessment scoring, Business Twin generation,
diagnostics, recommendations, scenarios, ROI, Blueprint calculation, catalogue
truth, report generation, lead persistence, or the consultation transaction.

## Conversation and tool contract

- One `ToolLoopAgent` receives up to 24 authorized history messages and the
  current user turn. There is no keyword pre-routing, automatic document
  presearch, empty tool set, or document-only refusal branch in live mode.
- General questions can be answered from general knowledge without an upload.
- Deterministic MajuPilot facts remain available only through the existing typed,
  assessment-authorized read tools.
- `searchUploadedEvidence` and `getDocumentExcerpt` keep stable document, page or
  section, excerpt, and `doc:<document>#chunk:<chunk>` provenance.
- `searchWeb` is a server-owned local tool. It can run at most once per turn and
  delegates to the AI Gateway Perplexity search tool with at most five results,
  512 tokens per page, and 2,500 total search tokens.
- The isolated search agent receives only a derived public query. It receives no
  conversation history, uploaded-document passages, deterministic records, or
  customer context, so document-first and web-first tool order are both safe.
- A document no-evidence result limits only the document claim. Copilot may still
  provide clearly labelled general guidance or separately sourced public facts.
- Write tools create a pending confirmation proposal. They never perform the
  write or claim success during the model turn.

The web-query boundary strips quoted/code passages, URLs, email addresses,
UUIDs, phone-like strings, long identifiers, and obvious customer/account
clauses. Remaining terms must occur in the current sanitized user message or in
a small public-search vocabulary. A private-only query returns
`UNSAFE_WEB_QUERY` without contacting the search provider. Returned source URLs
must be credential-free HTTP(S); hostile protocols and credential-bearing URLs
are rejected on the server and again in the UI. Markdown images are never
rendered, preventing model-supplied URLs from causing automatic browser requests;
ordinary safe links remain explicit user clicks.

## Streaming, durability, and recovery

The turn route preserves its JSON response for existing callers and adds an
`application/x-ndjson` stream for the product UI. Events describe turn start,
thinking, tool activity, text deltas, persistence, completion, and safe errors.
Client or browser cancellation is linked to the model abort signal through the
request signal and `ReadableStream.cancel()`.

The server persists the user message once, then records model telemetry, ordered
tool/source parts, and the final assistant text only after successful completion.
A partial streamed answer is never stored as a completed assistant message.
Stable request hashes, attempt claims, result receipts, and one bounded retry
keep reconnect/retry behavior idempotent. Saved history restores document and
web sources plus completed, rejected, and confirmation-required tool states.

The Phase 3R migration adds a 24-part/24-KB check for new `chat_messages.parts`
rows and updates the default prompt version. The check is intentionally
`NOT VALID`: new rows are enforced while immutable conversations created by
accepted earlier phases remain readable. The migration creates no table, view,
function, policy, public bucket, or client grant.

## Product experience

The Copilot page now includes streamed Markdown, an accessible live activity
region, persisted history, Enter-to-send and Shift+Enter behavior, Stop and
same-key Retry controls, confirmation actions, uploaded-evidence citations, and
dated public-source cards. The layout keeps the accepted MajuPilot visual system,
44-pixel interactive targets, reduced-motion handling, and responsive behavior.

The authenticated 12ui apply workflow was not used because it would upload the
local page, repository context, and accepted visual artifact to a third-party
service, contrary to the no-public-upload constraint. Verification remained
fully local through browser screenshots, DOM assertions, console/network checks,
responsive audits, and axe-core.

## Read-only reference adaptation

The reference project at `AI CHATBOT PROJECT/ai-chatbot-with-rag` was inspected
read-only. Phase 3R adapts its successful product patterns—one conversational
tool loop, streaming text, ordered message parts, saved history, visible tool
states, document sources, public sources, Markdown, and stop/scroll behavior.
It does not copy the reference provider stack, user-scoped document model, or
incremental database schema. MajuPilot retains AI SDK 7 through the Vercel AI
Gateway, completed-Blueprint entry gating, assessment-scoped authorization,
typed deterministic tools, private Evidence Library RAG, idempotent receipts,
confirmation-only writes, and server-owned persistence.

## Verification evidence — 2026-09-23

| Gate | Result |
| --- | --- |
| `npm ci` | Clean lockfile install |
| `npm run type-check` | Pass |
| `npm run lint` | Pass |
| `npm test` | 262 passed; 4 explicit opt-in tests skipped |
| `npm run build` | Pass; `/copilot` and turn API built |
| `npm audit --omit=dev --audit-level=high` | 0 vulnerabilities |
| `npx supabase db reset --local --no-seed` | All migrations applied |
| `npx supabase test db --local` | 10 files, 156 tests, pass |
| `npx supabase db lint --local` | No schema errors |
| `npx supabase db advisors --local` | No issues |
| `npm run test:phase3:gateway-live` | Two live proofs pass on `deepseek/deepseek-v4.1-flash` |
| `npm run test:phase3:browser` | Synthetic end-to-end journey passes |

The live proof verifies ordinary no-upload conversation, history continuity,
five dated current-web sources, mixed document/web grounding, private text absent
from the web query, pending-only writes, real uploaded-document retrieval and
stable rendered citations, explicit unsupported evidence, prompt-injection
containment, unchanged deterministic evidence, cross-guest and cross-assessment
denial, deletion non-retrievability, and fixture cleanup.

The browser proof uses only synthetic mocked API responses; it verifies streamed NDJSON handling, Markdown, separate document
and dated web-source cards, hostile-link and auto-loaded-image exclusion, the completed-Blueprint and
deep-link gates, refresh restoration, safe retry/error copy, no console or failed
network requests, no horizontal overflow at 1366/768/390 pixels, minimum 44-pixel
targets, and zero serious or critical WCAG 2.2 AA axe findings. The local evidence
bundle is written to the task artifact directory as `phase3r-browser/` and includes
`browser-proof.json` plus desktop, tablet, and mobile screenshots. Live AI and
live public-search behavior are established separately by the two Gateway tests;
the browser screenshots must not be interpreted as live-provider evidence.

## Repeat locally

```powershell
npm ci
npm run type-check
npm run lint
npm test
npm run build
npm run audit:production
npx supabase db reset --local --no-seed
npx supabase test db --local
npx supabase db lint --local
npx supabase db advisors --local
npm run test:phase3:gateway-live
npm run test:phase3:browser
```

The live proof requires ignored local Gateway credentials and refuses a non-loopback
Supabase URL. All test data is synthetic.
