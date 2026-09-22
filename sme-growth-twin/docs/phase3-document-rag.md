# Phase 3: secure bounded Document RAG

## Scope

The Evidence Library is an optional, additive source for Transformation Copilot.
It does not mutate assessment answers, Business Twin facts/evidence/assumptions,
diagnostic scores, recommendations, scenarios, ROI, Blueprint outputs, reports,
or lead state. Copilot continues to work when no document is uploaded.

Supported uploads are PDF, DOCX, and UTF-8 TXT. The server validates the declared
MIME type, extension, and file signature before extraction. DOCX archives are
checked for traversal paths, encryption, macros, entry count, expanded size, and
compression ratio. PDF and DOCX content is parsed as data and is never executed.
Document text is treated as untrusted evidence in the Copilot prompt and cannot
override system rules or deterministic product facts.

## Bounded processing contract

| Boundary | Value |
| --- | ---: |
| Original file | 4 MiB |
| Multipart request | 4.25 MiB |
| PDF pages | 40 |
| Extracted characters | 120,000 |
| Chunks per document | 80 |
| Characters per chunk | 1,200 |
| Chunk overlap | 120 characters |
| DOCX archive entries | 2,000 |
| DOCX expanded size | 20 MiB |
| Retrieval results | 1–8 |
| Relevance threshold | 0.40–0.95; default 0.62 |
| Citation excerpt | 900 characters |
| Signed download | 60 seconds |

The server streams and counts the actual multipart body before parsing, including
requests without Content-Length. The upload cap leaves multipart overhead below
[Vercel's 4.5 MB request limit](https://vercel.com/docs/errors/function_payload_too_large).

Chunking is deterministic and records page/section provenance. Embeddings use the
fixed Vercel AI Gateway route `openai/text-embedding-3-small`, dimension 1536,
and version `openai-text-embedding-3-small-1536-v1`. Provider credentials remain
server-only through `AI_GATEWAY_API_KEY` or Vercel-provided `VERCEL_OIDC_TOKEN`.

## Persistence and authorization

`evidence_documents` is the lifecycle ledger. Its states are `processing`,
`ready`, `failed`, `unsupported`, `duplicate`, and `deleted`.
`evidence_document_chunks` holds bounded text and 1536-dimensional vectors. Both
tables force RLS. Active organization members may read only their organization’s
rows; anonymous clients receive no table access; guest access is mediated by the
server after validating the opaque guest session against the assessment.

Originals live in the private `majupilot-evidence` bucket under opaque keys:

- `org/<organization>/<assessment>/<document>.<ext>`
- `guest/<guest-session>/<assessment>/<document>.<ext>`

There are intentionally no browser-role Storage policies for this bucket. The
server service role performs object operations only after assessment ownership
has been re-authorized, and download routes return a 60-second signed URL. Secret
keys and object paths are never sent as client configuration. Search is exposed
only to the service role through a bounded RPC that requires an exact assessment
ID and excludes failed, unsupported, duplicate, and deleted documents.

Duplicate detection is SHA-256 scoped to one assessment. Unsupported files are
recorded without an object. `storage_path` is cleared whenever extraction fails
before upload or Storage does not confirm the upload. The API derives
`canReprocess` only for a failed row with a confirmed stored original, so corrupt,
over-limit, and upload-failure rows cannot falsely offer or reach reprocessing.
Embedding failures retain the private original and can recover through
reprocessing. Delete first tombstones the ledger row, then removes the private
object and chunks; duplicate metadata rows are also user-deletable. Cleanup can
be retried, and concurrent reprocessing uses a conditional state update.
In-progress processing cannot be deleted until it settles.

## Copilot retrieval

Copilot has two read-only tools:

- `searchUploadedEvidence`: embeds a bounded query and returns only relevant
  chunks from the current assessment.
- `getDocumentExcerpt`: re-authorizes and loads one exact document/chunk pair.

Uploaded results have explicit `uploaded_document` provenance. The UI renders
document name, page or section, a bounded excerpt, and
`doc:<document-id>#chunk:<chunk-id>`. If there are no ready documents or no
relevant chunks, the tool returns an explicit reason and Copilot must say that
the uploaded evidence cannot answer the question. It must not invent a citation.

## Local verification

Start the local Supabase stack, set the public local URL/key plus the server-only
secret and guest-token pepper, and provide a Gateway credential if exercising
real embeddings. Then run:

```powershell
npx supabase db reset --local --no-seed
npx supabase test db --local
npx supabase db lint --local
npx supabase db advisors --local
npm run type-check
npm run lint
npm test
npm run build
npm run test:phase3:gateway-live
```

The SQL suite covers owner/member access, cross-tenant denial, separate assessment
retrieval, deleted-document exclusion, service-only vector search, and bounded
search parameters. Unit tests cover type/signature rejection, unsafe archive and
text limits, deterministic chunking, prompt-injection text handling, no-document
retrieval behavior, citation schemas, and UI lifecycle states.

`tests/unit/phase3-document-rag-local.test.ts` is an opt-in loopback-only integration
test (`PHASE3_LOCAL_DB_TEST=1`) using real Supabase Storage/PostgREST/pgvector and
injected deterministic embeddings. It covers corrupt and extraction-limit
failures, a simulated Storage upload failure over the real local ledger, and
provider-failure recovery from a confirmed original. It creates and cleans up
its own synthetic fixtures and refuses a hosted database URL.
`npm run test:phase3:browser` covers the production UI with synthetic API
responses, including upload/rejection, duplicate deletion, truthful reprocessing,
the accessible visually-hidden native picker, visible Copilot citations, and
desktop/mobile accessibility.
