# HyperFrames registry decisions — Stage 3

Catalog tier: `words` (live catalog, 401 items), queried on 21 September 2026. Stage 3 records
decisions only; it does not install components or create composition HTML.

| Intent searched | Decision | Stage 5 use / reason |
|---|---|---|
| `editorial push slide between scenes` | Select `directional-wipe` component; `transitions-push` is a showcase reference only. | Primary related-beat seam, leftward, 0.40 s. |
| `blur crossfade between scenes` | Select `fade-through` component; retain the local CSS blur-crossfade recipe as fallback. | Quiet limits, evidence, and wind-down seams. |
| `chapter title card reveal` | No fit. Results were ornate or off-brand (`canopy-part-title`, `glass-shard-title`, `wireframe-portal-title`). | Hand-author the restrained `titlecard-reveal` blueprint with `waterfall-entry` / `svg-path-draw`; preserve MajuPilot's flat editorial system. |
| `cursor spotlight over product UI demo` | Select `simulated-cursor`, `yt-feather-highlight`, and `ui-focus-zoom`. | Authentic screen-capture emphasis without reconstructing UI. |
| `evidence provenance flow diagram` | No fit. Returned generic onboarding/settings flows, not a source-to-claim evidence chain. | Hand-author with `svg-path-draw`, `center-outward-expansion`, and provenance chips. |
| `data statistic count up` | Select `count-up`; use `mk-progress-stat` when a full stat-card treatment is needed. | Exact score and hosted-gate reveals only; no invented values. |
| `architecture systems flow diagram` | No fit. Returned consumer flows and carousels, not a trustworthy system architecture. | Hand-author a six-node architecture strip with `svg-path-draw`; never expose credentials or private URLs. |
| `timeline progress rail` | Select `state-chip-rail`; `beat-timeline` is a secondary orchestration reference. | Five-stage journey and validation state rails. |
| `validation checklist results` | Select `mk-specs-list`; `success-check` is an optional small completion mark. | Hosted validation proof and scoped environment checks. |

The three no-fit decisions were kept local. The external registry feedback command was not executed
because the approval system rejected disclosure of project-specific architecture/provenance context.
This does not block Stage 3 or the documented hand-authored alternatives.
