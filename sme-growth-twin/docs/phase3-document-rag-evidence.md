# Phase 3 evidence ledger

Date: 2026-09-22. Branch: `codex/phase3-document-rag`.
Base: `36b452ee328f23ab2f9d065b8ee7258d14d5c177`.
The implementation SHA is the containing commit; exact pushed-SHA CI/preview
receipts are included in the coordinator handoff.

## Implemented

- Private PDF/DOCX/TXT uploads, assessment/guest/organization authorization,
  signature/MIME validation, actual streamed request-byte enforcement, deterministic
  bounded extraction/chunking, fixed 1536-dimensional Gateway embeddings and pgvector.
- Metadata lifecycle with checksum duplicate detection, user-deletable duplicate
  rows, truthful `canReprocess` state, conditional lifecycle transitions,
  retryable deletion cleanup, and 60-second signed downloads. Failed extraction
  or Storage upload clears the unconfirmed object path; provider failures retain
  a confirmed private original. Browser roles have no direct evidence Storage policy.
- Read-only `searchUploadedEvidence` / `getDocumentExcerpt` Copilot tools with
  explicit uploaded-source provenance, bounded citations, and no-evidence/no-match
  results. Existing deterministic artifacts are not modified by these operations.
- Responsive Evidence Library and filename/section/excerpt/stable-reference citation UI.
- A separate corrective migration fixes an existing anonymous catalogue-read
  permission failure found by clean-reset regression tests. It keeps one SELECT
  policy per role and does not broaden admin-helper execution permissions.

## Executed proof

| Gate | Result |
| --- | --- |
| Full Vitest suite | 247 passed; 2 intentionally skipped (existing opt-in test plus new local DB test) |
| Focused routing/lifecycle regressions | 19 passed across the Copilot and Document RAG unit files |
| Real parser fixtures | PDF, DOCX, TXT extraction passed |
| Multipart without Content-Length | Oversized stream cancelled and rejected with 413 |
| Real local Storage + pgvector | Opt-in integration test passed separately, including duplicate deletion, corrupt/text-limit non-reprocessability, simulated Storage failure, and provider-failure recovery |
| Clean local migration reset | Passed through both new migrations |
| pgTAP database tests | 146 passed across 9 files |
| Database lint | No schema errors |
| Database advisors | No issues |
| TypeScript / ESLint | Passed |
| Production Next.js build | Passed; PDF.js worker present in upload route file trace |
| Production dependency audit | 0 vulnerabilities |
| Repository secret scan | 874 tracked text files; 0 credential values or client model-provider imports |
| Production UI browser harness | Passed: upload, duplicate deletion, unsupported, oversize, truthful failed/reprocess, delete, hidden native picker, visible focus treatment, visible Copilot citations |
| Desktop/mobile | 1440 and 390 px; no horizontal overflow; minimum measured link/button target 44 px |
| Browser accessibility/runtime | No serious/critical axe violations, console errors, or failed requests |
| agent-browser gate check | Meaningful page, no framework overlay/page errors; 0 axe violations |

The opt-in local integration proof uses real PostgREST, private Storage, signed
download URLs, and pgvector, with deterministic injected vectors. It verifies
wrong-guest denial, cross-assessment excerpt denial, no-match refusal, duplicate
records, unsupported input, provider-failure recovery, and absence of retrieved
chunks/originals after deletion. Its synthetic fixtures are cleaned up.

Browser UI responses are synthetic, explicitly not a claim of live model output.
Artifacts are outside Git at:

`C:/Users/Dv/.codex/visualizations/2026/09/22/01a0c82e-8cfc-7460-9171-987341ed7c27/phase3-document-rag/`

- `browser-proof.json`
- `evidence-file-focus.png`
- `evidence-ready-desktop.png`
- `evidence-ready-mobile.png`
- `evidence-copilot-citation.png`
- `agent-browser-evidence-gate.png` (earlier gate capture, before the cap changed)

## Limits and remaining deployment checks

- File cap is 4 MiB, total multipart cap 4.25 MiB, 40 PDF pages, 120k extracted
  characters, 80 chunks, 8 retrieval results, 900-character excerpts. These fit
  the documented Vercel 4.5 MB request limit with multipart overhead.
- No hosted Supabase migration was applied and no production data was changed.
  A successful preview build alone does not prove its database is migrated.
- Live Gateway answerable, unanswerable, and embedded-document prompt-injection
  behavior could not be exercised because neither `AI_GATEWAY_API_KEY` nor
  `VERCEL_OIDC_TOKEN` is available to this local process or worktree. This is the
  only remaining acceptance-proof blocker; no credential was printed or stored.
  The fixed embedding model was verified against the live catalogue, and local
  provider isolation, retrieval, lifecycle, and tool bounds are covered by tests.
- Processing is synchronous and bounded. OCR, malware scanning, background jobs,
  distributed upload quotas and recovery of a process killed while `processing`
  are outside this MVP. Structural checks are not antivirus certification.
- An already issued signed URL lasts up to 60 seconds; object deletion removes
  future downloads. Previously displayed chat citations are historical records.
- UI/UX and React skill checks informed target sizing, contrast fixes, and citation
  component structure. The external 12ui candidate-generation step was rejected
  by automatic approval review because it exports a local screenshot; no bypass
  was attempted. Local visual and accessibility reviews were completed instead.

No Phase 4 work, PR, merge, production deployment, archive, or production migration
is included in this branch.
