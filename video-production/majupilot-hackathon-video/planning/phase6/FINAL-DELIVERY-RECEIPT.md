# Phase 6 corrected local master — delivery receipt

## Artifact

- File: `deliverables/MajuPilot_Prototype_Demo_Desan_Vasu_Phase6.mp4`
- Byte size: **75,670,529** (72.2 MiB)
- SHA-256: **`272c4f644fe69f37e413629c28787ba60a1e941579017c8e86ef0ee24ee80a00`**
- Render: HyperFrames 0.8.59, job `3e69a515-b389-46b3-827f-ff582f2b70f3`, delivery quality, hardware browser GPU. Completed in 36m 40.4s.
- The MP4 is local and Git-ignored. It has not been uploaded or published.

## Encoded file checks

| Check | Result |
| --- | --- |
| Duration | 580.000000 s (9:40) |
| Video | H.264 High, yuv420p/BT.709, 1920×1080, 30/1 fps, 17,400 frames |
| Audio | AAC-LC, 48,000 Hz, stereo, 580.000000 s |
| Full FFmpeg video and audio decode with `-xerror` | Exit 0; no errors |
| `verify-phase6.mjs --checked --mp4` | Pass |
| HyperFrames strict source audit | Pass at all 26 scene midpoints; zero lint, runtime, layout or contrast findings; 55/55 contrast checks |

The encoded 10-second contact sheet is `planning/phase6/final-contact-sheet.jpg`. Full-size frames extracted from this MP4 at 180, 191, 374, 550 and 558 seconds are `final-at-<time>s.png` alongside this receipt. Those frames were inspected for legibility, current product claims, source citation, synthetic labels, Blueprint handoff, and the future-work distinction. The earlier 191-second clipped hero was corrected before this render; the final cited answer is fully framed.

## Audio and captions

- Measured final program: **-21.20 LUFS integrated, -2.67 dBTP true peak, 10.10 LU loudness range**. The accepted baseline master measured -21.07 LUFS integrated and -2.52 dBTP by the same FFmpeg `loudnorm` analysis.
- The music-led evidence intervals at 173.50–189.65 s and 544.00–556.20 s remain audible: encoded mean levels -33.2 and -34.1 dBFS, respectively. Original speech outside these windows is retained at its original timing.
- The two obsolete recorded claims are muted in the source WAVs, with no generated or imitated voice. The corrected transcript marks those edits; the mounted open-caption track has 1,073 words in 252 cards and no words in either mute window.
- These intervals are an editorial limitation: they carry visual proof and music rather than a new spoken explanation from Desan.

## Scope

This receipt verifies a local Phase 6 video artifact and its source. The accepted Phase 5 synthetic screenshots were used unedited; no customer data or private credentials are shown. Branch CI is reported separately against the final pushed commit SHA. No PR, merge, production deployment, or public upload is part of this delivery.
