# Stage 4 validation receipt

Validated: 2026-09-21 (Asia/Kuala_Lumpur)

## Result

Seven authentic production-app footage deliverables were captured for storyboard Frames 10–16.
All files open, are silent H.264 MP4, and probe as 1920×1080, yuv420p, constant 30 fps. Their exact
manifest edit windows total 217 seconds / 3:37 / 6,510 frames.

Stage 4 is **usable with one locked-plan discrepancy**: the current production app no longer
renders the worst-case Balanced Growth payback as `140.5 months`. Both the scenario card and its
opened calculation disclosure render `More than 60 months`; `140.5` is absent from the live DOM.
The authentic capture preserves production truth and does not fabricate the locked value. Stage 5
must either revise the narration/overlay after approval or wait for a production change that
restores the exact numeric value.

## Codec and duration probes

`ffprobe` 9.0.1 results:

| File | Codec/profile | Dimensions | Pixel format | Rate | Frames | Raw duration | Audio | SHA-256 |
|---|---|---:|---|---:|---:|---:|---|---|
| `frame-10-case-a-home.mp4` | H.264 High | 1920×1080 | yuv420p | 30/1 | 450 | 15.000000s | none | `ac18cd4b20075b878e1c269e339a194a6fa3d0a51a49286a1ce84ff0f8ceea8a` |
| `frame-11-evidence-review.mp4` | H.264 High | 1920×1080 | yuv420p | 30/1 | 720 | 24.000000s | none | `f7f53b880f9b66eb4212933b9b72f78738d6e944e492ce882d8205f43a378668` |
| `frame-12-deterministic-diagnosis.mp4` | H.264 High | 1920×1080 | yuv420p | 30/1 | 900 | 30.000000s | none | `1c97c46fe4b7bb62355ef25c28612579ccb3a580576faeeaa85da1cd9097895f` |
| `frame-13-recommendations.mp4` | H.264 High | 1920×1080 | yuv420p | 30/1 | 870 | 29.000000s | none | `6a9bb9aaa36eb694f43d7256dc0db0fb5ecf6200cc959536383a35b6918c2156` |
| `frame-14-scenario-comparison.mp4` | H.264 High | 1920×1080 | yuv420p | 30/1 | 1,260 | 42.000000s | none | `563983a9d77b84b29b993a2af1510a251a6388dc16f13fcacbe0a4d86770f145` |
| `frame-15-blueprint-specialists.mp4` | H.264 High | 1920×1080 | yuv420p | 30/1 | 1,710 | 57.000000s | none | `775970e73f1bb84769a450bdd0fc1190adbc12beaf61fdb09c8971c51cec26aa` |
| `frame-16-consultation-boundary.mp4` | H.264 High | 1920×1080 | yuv420p | 30/1 | 1,020 | 34.000000s | none | `037a0c3373e4e73b84f181e5c28db37eee5fa79c00d748e301f4c2feac7c899a` |

All files use `avc1`, fast-start MP4 metadata, and contain exactly one video stream and zero audio
streams. The seven raw files total 231 seconds; the one-second head and tail handles remove 14
seconds, leaving the required 217-second edit.

## Visual inspection receipts

Every final file was inspected at multiple timestamps after final encoding:

| Frame | Inspected timestamps | Visible result |
|---|---|---|
| 10 | 1.5s, 7.5s, 13.5s | Public MajuPilot home, Case A action, fictional banner and fixture on review. |
| 11 | 1.5s, 12.0s, 22.0s | Five completed groups, editable review cards, one explicit unknown, and `Confirm Business Twin`. |
| 12 | 1.5s, 15.0s, 28.5s | Exact 37.5/42.5 scores, evidence/calculation disclosure, and six triggered findings. |
| 13 | 1.5s, 14.5s, 27.5s | 3/1/1 status register, governed AI `Why later`, and Catalogue `2.0.0` provenance. |
| 14 | 1.5s, 10.0s, 21.0s, 40.5s | Three scenario names; all cost/value/net ranges including negatives; explicit Balanced Growth selection; financial outlook and schedule. The live worst-payback label is `More than 60 months`. |
| 15 | 1.5s, 12.0s, 28.5s, 35.0s, 47.0s, 55.5s | Five live specialist statuses; 16-section index; selected plan; roadmap; five reviews/synthesis; empty consultant notes; methodology/provenance. |
| 16 | 1.5s, 17.0s, 28.0s, 32.5s | Verified Blueprint summary; every contact input visibly empty; sharing categories; unchecked consent; untouched submit button. |

The compact representative contact sheet is
`assets/capture/proof/stage-4-contact-sheet.png` (1920×540, SHA-256
`0ce09d1c2cc1aeeed0d21cfce4946bf0bcc1b159e43cb4241d8b21e134f88c87`).
One full-resolution proof still per clip is stored beside it.

No inspected customer-facing frame contains stale `SME Growth Twin` branding. The visible brand is
`MajuPilot`. No browser chrome, OS notifications, native cursor, credentials, personal tabs, real
contact data, raw prompts, raw model reasoning, private report URL, or portrait appears.

## Browser and network checks

- Agent-browser capture session console: no entries.
- Agent-browser page-error log: no entries.
- Recorded requests returned successful 200/201 responses.
- Expected journey writes were limited to the fictional guest workflow: advisor review `200`, guest
  session `201`, and journey sync `201`.
- Consultation traffic was GET-only. No consultation/lead submission request was made.
- The capture session ended with all contact inputs empty, urgency unselected, consent unchecked,
  and no recorded-consultation success state.

## Privacy and truth audit

- Fictional Case A / Kopi Kita Café Group only; fixture `1.0.0` is visible.
- No real contact information was entered.
- No consultation form was submitted.
- No current Document RAG flow was visited or captured.
- Catalogue mappings remain provenance, not quotes or availability claims.
- Negative net values remain visible.
- The live `More than 60 months` payback text is documented rather than replaced with the locked
  `140.5 months` value.
- No product code, narration script, storyboard/design file, production configuration, or final
  composition file was changed.

