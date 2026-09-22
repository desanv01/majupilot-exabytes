# Stage 7 — Delivery master and final QA receipt

## Outcome

The local submission master is complete and verified. It was rendered through HyperFrames at delivery quality; no alternate rendering pipeline, upload, publication, public link, push, pull request, or merge was used.

- File: `deliverables/MajuPilot_Prototype_Demo_Desan_Vasu_v1.mp4`
- Size: 79,886,988 bytes (76.19 MiB)
- SHA-256: `40929eaf83b3b6428d46e49d835132ace4379efdb4a3f50085b180a893c141b1`
- Runtime: exactly 580.000 seconds / 9:40
- Video: H.264 High, 1920×1080, yuv420p, 30/1 fps, 17,400 frames
- Audio: AAC-LC, 48 kHz, stereo, 580.000 seconds
- Start/end: both streams start at 0.000 and end at 580.000 seconds

The MP4 is intentionally excluded from Git. The editable HyperFrames source, repeatable verifier, receipt, checksum, submission copy, upload checklist, and lightweight contact sheet are committed.

## Pre-render gates

- Started from accepted Stage 6 commit `06e02d394c4d1497f060f2ab5b74908077bceb17` on a new `codex/` branch.
- Required latest-version probe ran once: project `0.8.59`, latest `0.8.59`; no upgrade was needed.
- Installed `general-video` skill pack was already current.
- `node scripts/verify-stage6.mjs`: pass — 26 scenes, 580 seconds, 14 narration clips, 266 caption cards, 1,131 timed words, 412–415 silence, 5.149958-second final hold, zero viewer-path leaks.
- Pinned HyperFrames strict check at all 26 scene midpoints: 0 lint errors/warnings, 0 runtime errors/warnings, 0 layout issues, 0 motion errors/warnings, 55/55 contrast checks passed.

## Framework render

Command shape: `npx --yes hyperframes@0.8.59 render --quality delivery --fps 30 --format mp4 --strict-all --output deliverables/MajuPilot_Prototype_Demo_Desan_Vasu_v1.mp4`

HyperFrames reported:

- 17,400/17,400 frames captured with two workers;
- screenshot capture with hardware GPU;
- compile 12.2s, extraction 38.4s, audio 2m27.8s, setup 10.4s, capture 39m22.4s, encode 4m53.9s, assemble 42.2s;
- total render time 48m37.6s;
- final artifact validation passed.

The compiler warned that the seven authentic-capture sources have sparse keyframes. HyperFrames then pre-extracted 6,510 source frames with coverage ratio 1.0, and the rendered demo contact frames for all seven pages are complete and unfrozen. The optional `caption-overrides.json` request was absent and explicitly non-blocking; the accepted designed caption composition rendered normally.

## Audio QA

- Integrated loudness: -21.07 LUFS.
- Loudness range: 4.20 LU.
- True peak: -2.52 dBTP.
- Overall RMS: -24.269 dBFS; zero NaN, infinite, or denormal samples.
- Speech-window means are -24.3 to -23.5 dBFS; the music-only demo gap is -37.8 dBFS, confirming clear narration priority.
- The accepted strength-0.8 voiceover carve, speech-band lanes, music automation, and fades remain in place.
- The 412–415 second narration/caption silence measures -44.4 dBFS mean from the retained low music bed; narration resumes at 415.35 seconds.
- Silence detection found no unexpected long dropout. The only >1-second detections were a 1.318-second authored demo pause and the final 1.071-second fade.
- Full master decode passed without errors.

Detailed measurements are in `AUDIO-QA.md`.

## Visual and caption QA

The 17-frame rendered-master contact sheet at `evidence/contact-sheet.jpg` covers:

- opening identity;
- problem and proposed solution;
- architecture and current Document RAG boundary;
- all seven authentic demo pages;
- testing chapter and validation evidence;
- the future/deferred-P1 boundary;
- close, visible music attribution, and final visual hold.

Rendered critical-frame inspection confirmed:

- captions are single-line, readable, inside the title-safe lower band, and show the current-word teal highlight;
- no caption clipping, overflow, or collision with key demo controls;
- the authentic demo remains inside 195–412 seconds and shows the fictional/fixture, synthetic-contact, and consent boundaries;
- viewer-facing payback reads exactly `More than 60 months`;
- Document RAG is shown as `NOT IMPLEMENTED NOW` and `DEFERRED P1 / FUTURE POTENTIAL`, with no current-feature styling;
- the end card visibly credits “New Direction” by Kevin MacLeod and CC BY 4.0;
- the final frame holds cleanly after narration ends at 574.850042.

## Privacy and truth scan

- Prohibited-name scan: 0 matches.
- Viewer-facing personal absolute paths: 0 matches.
- Private-key, provider-key, JWT, and assigned-secret patterns: 0 matches.
- Approved capped payback phrase: exactly 1 viewer-source match.
- Fictional and synthetic labels remain present.
- No credential, private customer data, or completed-consultation implication was introduced.

## Corrections and caveats

No composition, narration, caption, mix, or timing correction was required after rendering. A verifier-only bug that initially looked for the payback phrase in the root file instead of scene 14 was corrected, and the verifier then passed.

No external-platform transcode has been performed. YouTube upload, visibility, HD-processing review, and final URL submission remain user-controlled and are covered by `deliverables/UPLOAD-CHECKLIST.md`.
