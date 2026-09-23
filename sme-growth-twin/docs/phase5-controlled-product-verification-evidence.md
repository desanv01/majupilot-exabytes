# Phase 5 controlled product verification

Scope: `codex/phase5-controlled-product-verification` from Phase 4 base `bddb21aed21492dd103b26fe630a79bd49e8e6ce`. All generated businesses, contacts, uploads, consultations, and reports are fictional. Database writes were restricted to local loopback Supabase; the configured Gateway was used for live AI checks. No hosted customer data, production deployment, PR, or merge was involved.

| Check | Expected | Actual / evidence | Status |
| --- | --- | --- | --- |
| Three fixed cases A/B/C | Distinct maturity, readiness, ranked recommendations, scenario cost/value/payback; A reaches Blueprint, Copilot, consultation | `phase5-stage07/stage-07-browser-evidence.json` in task visualizations; A 37.5/42.5, B 23.2/43.8, C 79/73.8; all scenario values differ; A's Copilot turn and refreshed history passed | Pass |
| Fresh unscripted-product path | Assessment through report, evidence, Copilot, consultation with one newly entered business | `phase5-controlled-journey/phase5-fresh-journey.json` and screenshots in task visualizations; Meridian Orchard Logistics completed five assessment screens, two follow-ups, review edit, four result disclosures, six recommendations, three scenarios, assumption edit, five advisors/16 Blueprint sections, durable sync, ready TXT, cited answer and history, confirmation-gated report generation, consultation receipt | Pass |
| Isolation and safety | No cross-guest reads; no silent write; safe prompt-injection boundary | Fresh journey got 404 for another guest's document and Copilot session; confirmation was required before report action. Live RAG proof established injection rejection, explicit no-relevant-evidence result, no deterministic mutation, deletion nonretrieval | Pass |
| Browser quality | Responsive, keyboard usable, accessible, no errors | Stage 07: 360px screens, keyboard flow, zero critical/serious axe findings, no console or failed network requests. Fresh path: 390/768/1366/1920px Blueprint/Evidence/Copilot, no horizontal overflow/overlay or console/network errors | Pass |
| Report | Canonical, legible, complete PDF | `phase5-controlled-journey/fresh-blueprint.pdf`; visually inspected all four rendered A4 pages, 20,658 bytes, SHA-256 receipt checked by journey | Pass |
| Restart durability | Persisted Copilot history remains after app restart | `node scripts/phase5-restart-proof.mjs`: five grounded read tools, 18 persisted messages after restart, idempotent turn, safe failure, prompt-injection and cross-session rejection | Pass |
| Local quality and database | All gates green; synthetic fixtures removed | 250 unit tests pass/3 skipped; lint, type-check, build, golden/security checks, production audit (0 vulnerabilities); local reset applied all migrations, then 146 DB assertions, DB lint/advisors; read-only counts for business twins/chat sessions/evidence documents/leads all zero | Pass |

## Issue ledger

| Issue | Evidence and correction | Residual |
| --- | --- | --- |
| Stage 07 browser harness used a stale consultation receipt shape, short timeout, and inherited non-loopback backend settings. | Updated harness to force loopback Supabase, use current durable receipt, and assert Case A Copilot continuation/history. All three cases passed. | None in the verified path. |
| Generated PDF exposed raw enum strings, unformatted currency, and technical identity on the first page; headings could orphan and disclaimer occupied a nearly empty fifth page. | Human labels, RM formatting, provenance relocation, heading keep-with-next, and compact footer caveat. Focused regression and visual reinspection passed. | None in the sampled four-page report. |
| A single repeated live Copilot run returned without an uploaded-document citation, while other repeated runs and the dedicated live RAG proof cited correctly. | The journey assertion now requires a rendered citation block (not merely matching filename text). Final run passed with citation and refreshed history. | Live model tool choice is nondeterministic; this is an intermittent observation, not claimed resolved by a product-code change. Monitor before production reliance. |
| First parallel unit run exceeded two pre-existing 5-second test budgets under CPU contention, causing three failures. | Reran `npm test` in isolation: 51 files/250 tests passed, 3 skipped. | Keep gate runs resource-isolated. |
| Supabase CLI reset returned a Storage health timeout after applying migrations. | Verified the Storage container recovered healthy; all 146 local DB assertions and DB lint/advisors passed, and four synthetic-data table counts were zero. | Local CLI health timeout was environmental; no hosted state changed. |

Evidence files under task visualizations are local verification artifacts, not customer records. The PDF and screenshots use only synthetic business details. The final commit and remote exact-SHA gate/deployment outcome are recorded in the task handoff.
