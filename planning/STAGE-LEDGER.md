# SME Growth Twin - Stage Ledger

This ledger is updated only by the main planning/integration task after review.

| Stage | Status | Implementation task | Started | Accepted | Gate evidence / notes |
|---|---|---|---|---|---|
| 00 Foundation and Baseline | Accepted | `01a0ace3-99c0-7c60-ae71-7d58ec5fdb17` | 2026-09-17 | 2026-09-17 | Main review: lint 0; type-check 0; 3 test files / 4 tests passed; production build 0; dependency tree healthy. Vitest required normal host process permissions because the managed sandbox blocks its child-process startup on Windows. |
| 01 Discovery and Business Twin | Accepted | `01a0ad17-0e79-7473-b369-06a7dbdebb0c` | 2026-09-17 | 2026-09-17 | Main review after two correction cycles: lint 0; type-check 0; 5 test files / 19 tests passed; production build 0; direct-review persistence, follow-up reconciliation, revision policy, readable review cards, accessibility semantics, and non-overlapping 360 px layout verified. Vitest required normal host process permissions because the managed sandbox blocks its child-process startup on Windows. |
| 02 Deterministic Intelligence | Accepted | `01a0ad73-b7f9-7f71-95f5-f66868d5e4e5` | 2026-09-17 | 2026-09-17 | Main review after one correction cycle: lint 0; type-check 0; 7 test files / 37 tests passed; production build 0 with all six product routes; exact Case A scores/dimensions/pain order verified; unsupported evidence cases rejected; persistence invalidation, finite ~4s local analysis, readable expanded evidence, and 360 px layout verified. Hosted 12ui close was privacy-blocked, so the approved local images/LayerDoc and local browser comparison were used without bypassing the safeguard. |
| 03 Recommendations and Catalogue | Accepted | `01a0adb3-451f-76e1-99fe-3fa933cf6774` | 2026-09-17 | 2026-09-17 | Main review plus a later Stage 04 boundary correction: all capability definitions, eligibility rules, prerequisites, evidence mappings, risk fit, and data-readiness policy are isolated in the Exabytes domain pack; the reusable core accepts a typed rule pack and contains no current capability or prerequisite identifiers. Exact Stage 03 and Stage 04 outputs remain unchanged. |
| 04 Scenario and ROI Lab | Under review | `01a0adf5-6eb1-76f2-83d5-43f6ab11b2d5` | 2026-09-17 | - | Main review after two correction cycles: lint and type-check pass; 12 test files / 74 tests pass; production build emits all eight product routes; exact Case A costs, operational value, net ranges, payback, budget fit, and conditional AI cost verified; editable provenance, monthly event reconciliation, stale persistence, 44 px targets, zero console errors, and desktop/360 px overflow verified. GitHub PR/CI remains before acceptance. |
| 05 Advisor Panel and Blueprint | Locked | - | - | - | Requires Stage 04 acceptance |
| 06 Consultation and Full UX | Locked | - | - | - | Requires Stage 05 acceptance |
| 07 Hardening and Submission | Locked | - | - | - | Requires Stage 06 acceptance |

Allowed states: `Locked`, `Ready`, `Dispatched`, `Needs correction`, `Under review`, `Accepted`, `Re-planned`.
