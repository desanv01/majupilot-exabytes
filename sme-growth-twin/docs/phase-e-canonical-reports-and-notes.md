# Phase E: Canonical reports and consultant notes

Phase E adds the server-side `/api/v2` contract for canonical Blueprint PDFs and consultant notes. It does not add Phase F lead workflow or change the accepted UI.

## Canonical report contract

- `POST /api/v2/reports` accepts an authorized assessment, exact database Blueprint ID, locale, and an explicit set of accepted-note IDs.
- The service loads the immutable Blueprint revision and selected immutable human-accepted notes from persistence. It never reads browser state and never asks a model to write report facts or numbers.
- The render key covers assessment, database Blueprint identity, Blueprint revision/provenance, renderer/template versions, locale, and accepted-note identities. Repeating the same authorized request returns the existing completed artifact and identical SHA-256.
- A changed Blueprint, template, locale, or accepted-note set creates a new version. Completed metadata and bytes are immutable.
- `GET /api/v2/reports` lists authorized status/metadata. `GET /api/v2/reports/{id}/download` re-authorizes the current guest or organization and mints a five-minute signed URL (configurable from 30 seconds to the frozen 15-minute maximum).
- PDFs are stored only in the private `majupilot-reports` bucket under opaque report IDs. Signed URLs are never persisted or logged.

Important Storage behavior: a guest revocation or membership removal prevents minting any new URL. A signed URL already issued by Supabase remains valid until its short expiry; immediate revocation requires deleting the object and is reserved for retention/deletion handling.

## Consultant-note lifecycle

- `POST /api/v2/consultant-notes/drafts` is restricted to active `consultant`, `sales_manager`, or `system_admin` organization members. It calls the existing server-only Gateway policy for `consultant_note_draft` and persists only a strict AI draft linked to its redacted model-call record, Blueprint, evidence IDs, assessment, and optional lead.
- Disabled/preferred-unavailable AI returns no draft; deterministic text is never mislabelled as an AI draft.
- `POST /api/v2/consultant-notes/accept` creates a new `human/accepted` row linked to the source draft. It never updates the AI row. One draft can have at most one accepted revision.
- Accepted and draft rows are append-only at the database layer. Only explicitly selected human-accepted notes can be included in a canonical report.
- `GET /api/v2/consultant-notes` is an internal consultant/manager projection; prospects and cross-tenant members receive no note rows.

## Operational configuration

The note-draft operation uses `AI_GATEWAY_MODEL_CONSULTANT_NOTE` when set, otherwise the reviewed `AI_GATEWAY_MODEL`. Optional bounded settings are `AI_TIMEOUT_MS_CONSULTANT_NOTE`, `AI_MAX_OUTPUT_TOKENS_CONSULTANT_NOTE`, `AI_MAX_INPUT_TOKENS_CONSULTANT_NOTE`, `AI_MAX_RETRIES_CONSULTANT_NOTE`, `AI_RATE_LIMIT_PER_MINUTE_CONSULTANT_NOTE`, and `AI_MAX_COST_USD_CONSULTANT_NOTE`.

Production deployment still requires applying the Phase E migration to the dedicated V2 Supabase project and verifying the private bucket and signed-download path with hosted credentials. No credential or private generated report is committed.
