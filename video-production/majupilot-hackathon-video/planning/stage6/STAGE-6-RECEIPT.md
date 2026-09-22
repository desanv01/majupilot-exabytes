# Stage 6 — Narration, captions, and audio-mix receipt

## Fixed composition contract

- Canvas: 1920 × 1080 at 30 fps.
- Runtime: 580 seconds.
- Scene plan: the 26 Stage 5 scene starts and durations remain unchanged.
- Demo window: 195–412 seconds remains unchanged.
- Testing chapter card: 412–415 seconds is intentionally free of narration and captions.
- Final visual hold: 5.149958 seconds after narration ends at 574.850042.
- HyperFrames version probe: project and latest were both `0.8.59`; no upgrade was required.

## Source and edit provenance

The 14 supplied WAV masters were ingested through HyperFrames media-use into `.media/audio/voice/`. SHA-256 comparison confirmed that every frozen copy exactly matches its external master. External masters were read only and were not edited.

| Beat | Supplied filename | Frozen-source SHA-256 | Head / tail / internal silence removed (s) | Program placement (s) | LUFS / true peak dBFS |
|---|---|---|---:|---:|---:|
| Opening | `majupilot_vo_desan_v01_00_opening_t01_48k24m.wav` | `16adf417f43047c31c66f24d8a57c040d86886c8313927419832464fb3b8d67c` | 0.430 / 0.989 / 0.000 | 0.350–18.920 | -24.1 / -3.0 |
| Problem and objectives | `majupilot_vo_desan_v01_01_problem_objectives_t01_48k24m.wav` | `6214be3816e95ec2dec1c7464b74fe8075e8c1156d65ee6522585f8e4beb7e1a` | 0.460 / 0.990 / 3.550 | 20.200–64.800 | -24.0 / -3.0 |
| Proposed solution | `majupilot_vo_desan_v01_02_proposed_solution_t01_48k24m.wav` | `4ff4a1316b7dde65277d71d41791c9834de549c5ea8c9adfb89ceeb7ae5065f6` | 0.650 / 1.451 / 6.950 | 65.200–124.800 | -24.0 / -3.0 |
| Technical approach | `majupilot_vo_desan_v01_03_technical_approach_t01_48k24m.wav` | `0a67b7e7d614c49804ce5e375e56daa49deba51adaafbeb0b14080f7eb9440aa` | 1.070 / 0.919 / 4.080 | 125.200–194.800 | -24.0 / -3.0 |
| Demo — home | `majupilot_vo_desan_v01_04a_demo_home_t01_48k24m.wav` | `3705ddad3cca4b11b1e7d2c7499d0d78e327d1293d0c7057ace7997e2663a4b8` | 0.520 / 1.183 / 0.000 | 195.350–207.300 | -23.7 / -3.5 |
| Demo — review | `majupilot_vo_desan_v01_04b_demo_review_t01_48k24m.wav` | `7f8bdd79bfc398f3526dbb652b4e461018458ef7f92095963879188f3bb35612` | 0.430 / 0.809 / 0.000 | 208.350–223.260 | -24.0 / -3.0 |
| Demo — results | `majupilot_vo_desan_v01_04c_demo_results_t01_48k24m.wav` | `ef91f5f0da2bff07c539d68843fdf37c65b8c833d0af972166affbe8d259b4a4` | 0.430 / 1.184 / 0.000 | 230.350–251.200 | -24.1 / -3.0 |
| Demo — recommendations | `majupilot_vo_desan_v01_04d_demo_recommendations_t01_48k24m.wav` | `bac3469431a69cf4ca62680d644b36ee669eb6bc10ecff4f2cc6b9db0e433cd3` | 0.650 / 1.127 / 0.000 | 258.350–279.400 | -24.0 / -3.0 |
| Demo — scenarios | `majupilot_vo_desan_v01_04e_demo_scenarios_t01_48k24m.wav` | `0ada7d705b71e8492fda1bcf4be45d54a06b756dc23fb8baf5b7a83e3c2aa1ae` | 0.520 / 0.883 / 3.050 | 285.200–324.800 | -24.0 / -3.0 |
| Demo — Blueprint | `majupilot_vo_desan_v01_04f_demo_blueprint_t01_48k24m.wav` | `e0c5c84dd9015096c748dfdd67b0347422623af55aeaba0a633ff75302eae214` | 0.560 / 1.519 / 0.530 | 325.150–379.650 | -24.0 / -3.0 |
| Demo — consultation | `majupilot_vo_desan_v01_04g_demo_consultation_t01_48k24m.wav` | `b76a15b42e94f714ed3d4e2849a85248c8caea2cfd1dbc7135f4c61ce3f5b8db` | 0.620 / 1.170 / 0.000 | 380.350–403.840 | -24.0 / -3.0 |
| Testing and validation | `majupilot_vo_desan_v01_05_testing_validation_t01_48k24m.wav` | `343ed77183644326dfb149b2219546d072d83351823ad80077082a73c1ca8ef1` | 0.520 / 0.926 / 0.000 | 415.350–471.120 | -24.0 / -3.0 |
| Industry and future | `majupilot_vo_desan_v01_06_industry_future_t01_48k24m.wav` | `8b443d5cf237a5e188c4a7f34baac5f597cf60199d6426c9501b4f25a4a1f18e` | 0.650 / 1.057 / 8.210 | 495.200–564.600 | -24.0 / -3.0 |
| Close | `majupilot_vo_desan_v01_07_close_t01_48k24m.wav` | `91fd56e4886f8b0a7513ff68818672601aed1d640583dad27af33e276dc8c8f7` | 0.880 / 1.113 / 1.990 | 565.350–574.850 | -24.0 / -3.0 |

The masters total 565.461168 seconds. The placed program totals 513.389959 seconds. Editorial work removed 23.711250 seconds of leading/trailing room and 28.360000 seconds of silence between spoken phrases. No spoken word was deleted and no speech was time-stretched.

Program WAVs are 48 kHz, mono, 24-bit PCM. Two-pass FFmpeg loudness normalization targeted -24 LUFS integrated, 7 LU LRA, and -3 dBFS true peak. No denoiser, gate, EQ, pitch correction, or tonal reshaping was applied. A -2 dBFS safety limiter is declared on the narration group. All files decoded successfully; source inspection found no clipping, zero flat-sample runs, negligible DC offset, and no unusable recording discontinuity. Program measurements are -24.1 to -23.7 LUFS and -3.5 to -3.0 dBFS true peak.

Machine-readable per-cut and per-file measurements are in `narration-ledger.json`.

## Transcript and caption decisions

- Faster-Whisper `small.en` on CPU/int8 produced word-timestamp drafts for all 14 frozen sources.
- The approved caption transcript was editorially corrected against the audible recordings; captions follow what was actually spoken rather than forcing unspoken copy from `SCRIPT.md`.
- Caption alignment contains 1,131 words across 14 beats. Exact-token alignment ratios range from 0.777778 to 0.969697; only 0–2 words per beat required timestamp interpolation.
- Captions are grouped into 266 single-line cards, with no concurrent cards. Each word receives deterministic GSAP highlighting during its spoken interval.
- Caption geometry is fixed at x=192–1728 and y=900–968, inside the title-safe area and the reserved lower-third caption zone.
- The 412–415 second chapter card remains free of captions.
- Document RAG and arbitrary document ingestion are stated as future possibilities and explicitly not implemented now.

The approved text is in `CAPTION-TRANSCRIPT.md`; raw ASR evidence is in `transcripts/raw/`; alignment summaries are in `caption-alignment.json`; absolute word timings are in `captions-words.json`.

## Music hierarchy and licensing

The existing “New Direction” bed by Kevin MacLeod remains in place with its existing CC BY 4.0 attribution and visible end-credit line. Narration is the mix anchor. The mandatory HyperFrames carve pass used the `voiceover` group as its source at strength 0.8, writing six speech-band EQ lanes plus the narration envelope into the bed automation. Existing musical fades, chapter-card dip, and final fade remain intact. Existing SFX timing was not changed.

## Privacy and truthfulness

- No real customer data, credentials, secrets, private reports, raw prompts, hidden reasoning, or personal filesystem paths were added to viewer-facing files.
- Scenario results remain explicitly labelled as fictional inputs.
- Only the approved capped horizon wording is shown; no internal uncapped numeric value appears in viewer-facing files.
- Product boundaries, consent requirements, delivery uncertainty, and future-only capabilities remain explicit.

## Validation

- `node scripts/verify-stage6.mjs`: passed (26 scenes, 14 narration clips, 266 caption groups, 1,131 words, zero viewer-path leaks).
- `hyperframes lint --json`: passed with 0 errors and 0 warnings.
- `hyperframes check --strict` across all 26 scene midpoints: passed with 0 errors and 0 warnings; runtime clean; 55/55 contrast checks passed. One informational, pre-existing scene-7 connector note at 145 seconds does not fail strict mode.
- Representative caption snapshots at 2, 70, 205, 300, 430, 520, 562.6, and 570 seconds were inspected for readability, safe-zone placement, demo legibility, and end-state stability. The evidence set and contact sheet are in `planning/stage6/snapshots/`.
- Viewer-facing privacy/truth scan: capped horizon present, future-only Document RAG label present, no standalone internal uncapped value, and no personal absolute path.
- HyperFrames Studio preview: `http://localhost:3003/#project/majupilot-hackathon-video`; the local server returned HTTP 200 and Studio context discovery succeeded.
