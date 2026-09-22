# Stage 5 — HyperFrames Composition Assembly

## Delivery state

- Branch: `codex/video-phase5-composition`
- HyperFrames CLI: `0.8.59` (latest and pinned; upgraded from `0.8.56` during the corrective pass)
- Canvas: 1920×1080 at 30 fps
- Program duration: exactly 580.000 seconds / 17,400 frames
- Structure: thin `index.html` orchestrator, 26 frame sub-compositions, one transition-seam sub-composition, and one `*.motion.json` sidecar per frame
- Stage boundary: composition only. No final narration, captions, master render, publishing, or submission was produced.

## Locked timing

| Frame | Start | Duration | End | Composition |
|---:|---:|---:|---:|---|
| 01 | 0 | 20 | 20 | `01-identity-visible-path` |
| 02 | 20 | 22 | 42 | `02-decision-gap` |
| 03 | 42 | 23 | 65 | `03-five-answers-business-twin` |
| 04 | 65 | 18 | 83 | `04-five-stage-route` |
| 05 | 83 | 25 | 108 | `05-stage-ownership` |
| 06 | 108 | 17 | 125 | `06-truth-boundary` |
| 07 | 125 | 26 | 151 | `07-production-architecture` |
| 08 | 151 | 28 | 179 | `08-provenance-specialists` |
| 09 | 179 | 16 | 195 | `09-no-current-rag` |
| 10 | 195 | 13 | 208 | `10-demo-case-a-home` |
| 11 | 208 | 22 | 230 | `11-demo-evidence-review` |
| 12 | 230 | 28 | 258 | `12-demo-diagnosis` |
| 13 | 258 | 27 | 285 | `13-demo-recommendations` |
| 14 | 285 | 40 | 325 | `14-demo-scenarios` |
| 15 | 325 | 55 | 380 | `15-demo-blueprint` |
| 16 | 380 | 32 | 412 | `16-demo-consent-boundary` |
| 17 | 412 | 3 | 415 | `17-testing-chapter` |
| 18 | 415 | 24 | 439 | `18-hosted-gates` |
| 19 | 439 | 20 | 459 | `19-production-smoke` |
| 20 | 459 | 19 | 478 | `20-scoped-environment-evidence` |
| 21 | 478 | 12 | 490 | `21-local-baseline` |
| 22 | 490 | 5 | 495 | `22-bounded-model-path` |
| 23 | 495 | 32 | 527 | `23-owner-advisor-value` |
| 24 | 527 | 15 | 542 | `24-no-promises` |
| 25 | 542 | 23 | 565 | `25-future-potential` |
| 26 | 565 | 15 | 580 | `26-visible-path-close` |

Frames 10–16 form the exact 217-second product demonstration from 03:15 to 06:52. Every authentic Stage 4 clip begins at source time 1.000 second and uses the locked authored duration: 13, 22, 28, 27, 40, 55, and 32 seconds.

## Studio tracks

- Track 1: 26 sequential frame sub-composition hosts.
- Track 30: transition seams in `compositions/transition-seams.html`.
- Track 40: non-rendered caption-safe marker; captions remain deferred.
- Track 50: 26 frame-aligned silent narration placeholders, including the intentional silent Frame 17 chapter card.
- Track 60: `New Direction` by Kevin MacLeod, trimmed to the 580-second program with a gentle entrance, chapter-card dip, and closing fade.
- Track 70: conservative bundled whooshes at chapter seams and one closing chime.

The silent WAV is deterministic and exists only to reserve editable timing. Stage 6 should replace the 26 narration regions with Desan's approved recordings without moving scene boundaries.

## Registry and media decisions

Installed registry sources:

- Components: `directional-wipe`, `fade-through`, `simulated-cursor`, `yt-feather-highlight`, `ui-focus-zoom`, `count-up`, and `state-chip-rail`.
- Blocks: `mk-progress-stat` and `mk-specs-list`.

The composition adapts those primitives rather than treating them as a separate visual system. Directional wipes and chapter pushes are centralized in the transition sub-composition; cursor, highlight, focus, counter, chip-rail, progress-stat, and specs-list mechanics are adapted in the relevant scene files. No registry component is allowed to override the Stage 3 palette, typography, evidence-ledger framing, or 896px caption keep-out.

The media resolver found no reusable local BGM and the authenticated catalog was unavailable. A rights-safe external fallback was therefore frozen locally: `New Direction` by Kevin MacLeod, licensed CC BY 4.0, with attribution in the final frame and `assets/audio/MEDIA-CREDITS.md`. Bundled `sfx_001.mp3` (whoosh) and `sfx_002.mp3` (chime) remain mixed conservatively. Authentic UI capture receives no color treatment or replacement.

GSAP `3.14.2` is vendored at `assets/vendor/gsap-3.14.2.min.js`; every composition references that local asset, so browser rendering does not depend on the CDN.

## Truth and privacy boundaries

- Frame 14 visibly renders `More than 60 months`; the uncapped internal value is intentionally excluded from all viewer-facing video material.
- Hosted evidence and historical local evidence remain separate receipts; no totals are merged.
- `deepseek/deepseek-v4.1-flash` is the only exact model identifier shown.
- Document RAG is labeled not implemented and deferred P1 future potential.
- The consultation sequence stops with empty fields and unchecked consent; no submission or lead creation is shown.
- No credentials, secrets, private report URLs, raw prompts, raw reasoning, or real customer/contact data appear.
- The authorized portrait appears only in Frame 01.

## Stage 6 provisional audio carve

Use the locked frame slots as the first recording carve. Prefer natural delivery and short breaths within each slot; do not time-stretch speech to fill the region. Frame 17 remains silent. Re-run the voiceover carve after final narration replaces the silent placeholders, keep chapter SFX short, and preserve the final five-second legal-close hold in Frame 26.
