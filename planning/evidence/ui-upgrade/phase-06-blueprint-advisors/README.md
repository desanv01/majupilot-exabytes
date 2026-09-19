# Phase 06 Blueprint and advisor panel evidence

## Scope

- Route: `/blueprint`
- Design dials: variance 7, motion 3, density 5
- Upstream deterministic records, calculations, persistence keys, APIs, and consultation behavior remain authoritative.
- Five advisor reviews add bounded interpretation only and expose their origin, confidence, evidence references, model-call disclosure, limitations, and synthesis.

## Acceptance results

- `npm run lint`: passed
- `npm run type-check`: passed
- `npm test`: 29 files and 163 tests passed
- `npm run build`: passed
- `npm run test:phase06:browser`: passed
- `npm run test:stage05:browser`: passed
- `npm run test:stage07:browser`: passed
- Independent `agent-browser` smoke: passed; `/blueprint` without accepted state redirected safely to `/assessment`, with no runtime overlay.

Case A retained the accepted values: maturity 37.5, readiness 42.5, Balanced Growth, costs RM 9,200 / RM 18,400 / RM 27,600, operational value RM 2,358 / RM 7,254 / RM 15,233, net value -RM 25,242 / -RM 11,146 / RM 6,033, and payback 7.2 / 30.4 / 140.5 months.

The browser harness exercised ready, reviewing, complete all-fallback, failed-safe, restored, corrupt-recovery, missing-preference, and regeneration states. It verified all five advisor roles in deterministic order, all 16 report sections, stable restoration identity, immutable source identity after regeneration, 173 evidence references, 12 provenance groups, keyboard operation, reduced motion, zero serious or critical axe violations, zero console errors, zero failed requests, and no horizontal overflow at 1440, 1024, 390, or 360 pixels. The minimum interactive target was 44 pixels.

## Visual and print review

Every regenerated browser screenshot in this directory was visually inspected. The 22-page tagged A4 PDF was rendered to page images and every page was inspected. The final artifact has complete advisor disclosures, synthesis, methodology, limitations, and handoff content with no clipped content, hidden disclosure body, footer collision, or accidental browser control.

Key artifacts:

- `browser-evidence.json`: machine-readable Phase 06 browser assertions
- `blueprint-a4.pdf`: tagged A4 Blueprint export
- `completed-overview-1440.png`, `completed-overview-1024.png`, `completed-overview-390.png`, `completed-overview-360.png`: responsive completed state
- `advisor-detail-1440.png`, `advisor-detail-390.png`: expanded advisor evidence
- `synthesis-1440.png`, `synthesis-390.png`: agreement, explicit no-disagreement state, conditions, and open questions
- `ready-*`, `reviewing-*`, `failed-safe-1440.png`, `corrupt-recovery-1440.png`, `missing-preference-1440.png`: finite-state evidence
- `report-navigation-1024.png`, `print-media-full.png`, `agent-browser-smoke.png`: navigation, print, and independent smoke evidence

## Known limitation

The live AI Gateway provider was not configured for this local acceptance run. The deterministic all-fallback path was exercised end to end, while mixed live/fallback origin rendering is covered by the render integration test. The UI reports unavailable provider/model-call evidence honestly and never alters the accepted deterministic facts.
