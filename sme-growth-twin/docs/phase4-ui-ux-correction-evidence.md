# Phase 4 UI and UX correction evidence

Date: 22 September 2026

Branch: `codex/phase4-ui-ux-correction`

Base: `025ec68545bb7eac754e04a1e6548734337a4460`

## Scope and product direction

This correction pass preserves the accepted Phase 1-3 behavior, deterministic calculations, persistence boundaries, security policy, and release posture. It changes presentation, interaction hierarchy, accessibility, and browser evidence only.

The visual direction remains the repository's trust-first Malaysian SME evidence cockpit: DM Sans and Libre Baskerville, deep ink and warm paper, restrained teal accents, compact executive information density, and explicit evidence boundaries. The selected 12ui references already recorded in `planning/evidence/ui-upgrade/reference-board/` remained the design authority. No paid 12ui run was repeated because the repository records that allowance as exhausted.

Design dials used for this pass:

- design variance: 6/10
- motion intensity: 4/10
- information density: 5/10
- accessibility target: WCAG 2.2 AA, including 44px interactive targets and reduced-motion support

## Corrections delivered

- Added a consistent, responsive post-Blueprint workspace header for Blueprint, Evidence, Copilot, and Consultation destinations, with one active location and no horizontal-scroll navigation.
- Added a universal keyboard skip link and stable `main-content` targets across every product route and loading state.
- Added IntersectionObserver-based Blueprint section tracking, active sticky contents navigation, and an equivalent compact small-screen section control.
- Reduced Blueprint density by collapsing evidence keys, record IDs, model versions, claim provenance, and model-call details behind native disclosures while retaining full traceability and print expansion.
- Replaced prominent internal identifiers with a short `MP-XXXXXXXX` report reference in the Blueprint and consultation handoff.
- Reframed Blueprint generation failure as a focused recovery state with preserved upstream records, retry, and safe return.
- Reframed Copilot open and turn failures with a clear retry path, safe-state language, and closed technical support details. Request IDs remain available without dominating the message.
- Made Copilot automatic scrolling respect `prefers-reduced-motion` and moved raw citation keys behind technical disclosures.
- Replaced Evidence Library `window.confirm` deletion with an accessible modal, added actionable library-open recovery, and moved document IDs and embedding versions into technical disclosures.
- Corrected low-contrast pending handoff text and increased all newly introduced disclosure targets to at least 44px.

## Verification record

| Gate | Result |
| --- | --- |
| `npm run type-check` | Passed |
| `npm run lint` | Passed |
| `npm test` | 250 passed, 3 intentionally skipped |
| `npm run build` | Passed, 40 static/dynamic routes emitted |
| `npm run test:stage07:security` | 8 passed; 615 tracked text files scanned; 0 credential values; 0 client model-provider imports |
| `npm audit --omit=dev --audit-level=high` | 0 vulnerabilities |
| `npm run test:phase4:browser` | Passed |

The browser proof uses the optimized production build, synthetic Case A records, disabled live AI, intercepted local APIs, and no real customer data. It covers 390x844, 768x1024, 1366x900, and 1920x1080.

Verified browser states include:

- Blueprint ready, reviewing, complete, active section tracking, expanded advisor, synthesis, failed-safe persistence, corrupt-record recovery, missing preference, reduced motion, and print/PDF expansion
- Copilot ready, refreshed session, cross-session denial, API-open failure, retry affordance, safe deterministic path, and cited uploaded evidence
- Evidence Library empty, focused file input, ready document, duplicate, failed/reprocess, technical metadata, accessible delete confirmation, and deleted/excluded state
- no horizontal overflow at the required widths
- minimum interactive target of 44px
- zero serious or critical Axe findings
- zero captured browser console errors and zero failed local requests

## Evidence files

The task artifact root is:

`C:\Users\Dv\.codex\visualizations\2026\09\22\01a0c911-928a-7781-93ef-2e3a768c73a9\phase4-ui-ux-correction`

Machine-readable receipts:

- `phase4-browser-summary.json`
- `blueprint/browser-evidence.json`
- `workspace/browser-proof.json`

Representative screenshots:

- `blueprint/completed-overview-1920.png`
- `blueprint/completed-overview-390.png`
- `blueprint/section-tracking-1366.png`
- `workspace/copilot-failure-390.png`
- `workspace/evidence-ready-768.png`
- `workspace/evidence-copilot-citation.png`

The harness is committed as `scripts/phase4-ui-browser-check.mjs`. Its artifact directory is configurable through `PHASE4_UI_ARTIFACT_DIR`; temporary output is removed by default when no explicit evidence directory is supplied.

## Boundaries confirmed

- No production deployment was performed.
- No pull request was created or merged.
- No database migration, schema change, or production data mutation was performed.
- No real customer record was read or written.
- No video or Phase 5 work was started.
