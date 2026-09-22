# Stage 5 — Validation and Handoff

## Final result

HyperFrames `0.8.59` validates the composition at exactly 580.000 seconds (17,400 frames at 30 fps), 1920×1080. The exact product-demo window is 195–412 seconds (217 seconds).

The definitive strict gate used all 26 scene midpoints, the caption keep-out from normalized y=.83 to 1.0, frame-boundary checks, motion sidecars, runtime checks, layout analysis, contrast analysis, and snapshots.

```text
Lint      0 errors, 0 warnings
Runtime   0 errors, 0 warnings
Layout    0 issues across 29 samples
Motion    0 errors, 0 warnings
Contrast  37/37 text checks pass WCAG AA
Result    Check passed
```

## Animation-map review

Artifact: `.hyperframes/animation-map/animation-map.json`

- Duration: 580 seconds.
- Total tweens: 545.
- Mapped tweens: 398.
- Skipped micro-tweens: 147.
- Reviewed flags: SVG stroke paths report degenerate zero-height bounds by design; transition planes report deliberate off-canvas travel and seam collisions; slow flags correspond to authored camera/progress moves or the legal hold. No runtime script or missing-target failure remains.
- Frame 16 intentionally resolves to a static consent-unchecked proof image for the last eight seconds.
- Frame 26 settles by 9.9 seconds and holds the legal close for the final five seconds.

## Visual inspection

Every scene midpoint was captured and inspected. The complete 26-frame contact sheet is:

`snapshots/stage5-midpoints/contact-sheet-all-26.jpg`

Full-resolution midpoint PNGs live beside it. The inspection confirmed:

- no clipped titles, accidental masks, unintended occlusion, or caption-zone intrusion;
- readable light and dark scenes with the Stage 3 navy, teal, mint, paper, amber, coral, and magenta system;
- square/tight evidence-ledger geometry, editorial Garamond headlines, Inter body copy, and JetBrains Mono evidence labels;
- authentic UI capture remains unchanged and readable;
- Frame 14 shows `More than 60 months`;
- Frame 16 remains consent-unchecked and stops before submission;
- Frame 21 separates hosted and historical-local receipts;
- Frame 24 uses coral strike/no-promise treatment without positive checkmarks;
- Frame 25 keeps Document RAG in a deferred outline state;
- Frame 26 contains no portrait and preserves the final legal hold.

## Fixes applied during validation

- Corrected all root-relative font and capture paths for Studio and render parity.
- Added stable Studio IDs and matching host/sub-composition IDs.
- Vendored GSAP 3.14.2 and removed every render-time CDN reference.
- Repaired deterministic GSAP baselines and one touching cursor tween.
- Converted the Frame 16 freeze layer to the approved Stage 4 proof still.
- Replaced the silent BGM placeholder with Kevin MacLeod's “New Direction” (CC BY 4.0), added conservative volume automation, and added an on-screen music credit.
- Corrected two tight typographic stacks, marked only the exact intentional overlaps/occlusions, and resolved all sampled overflow findings.
- Raised four text colors within the approved palette; the new music credit also passes, for a final 37/37 contrast score.

## Truth and privacy audit

PASS. Authored composition files and viewer-facing production documents consistently use `More than 60 months`; the uncapped internal figure is not exposed. They also contain no credentials, secrets, private report links, raw prompts, raw reasoning, real customer data, real consultation data, or completed-submission implication. Document RAG appears only as not implemented/deferred future potential.

## Preview and Stage 6 handoff

The Stage 5 preview should remain running from the project directory. If it must be restarted:

```powershell
npx hyperframes preview --background
```

Stage 6 still requires:

1. Desan's approved narration WAVs for the 26 frame-aligned regions (Frame 17 intentionally silent).
2. Word-level timestamps for final captions.
3. Final VO/BGM/SFX carve and loudness mix after narration is recorded.
4. Final caption authoring inside the 896–1080 keep-out band.
5. Master render, full watch-through, audio QA, and publish/submission decisions.

No Stage 6 work, master render, publishing, push, or pull request was performed.
