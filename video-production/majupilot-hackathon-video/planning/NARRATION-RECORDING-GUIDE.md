# MajuPilot narration recording guide

This guide records the English voiceover in `SCRIPT.md` for the 9:40 working cut. Desan Vasu is the intended speaker.

## Room and microphone

- Record in the quietest soft-furnished room available. Close windows and doors; pause fans, air-conditioning, notifications, and nearby appliances when practical.
- Put the microphone 15–20 centimetres from the mouth, slightly off-axis by about 20 degrees. Keep the position fixed across takes and use a pop filter if available.
- Record seated or standing with an open chest and relaxed shoulders. Do not hold the microphone by hand.
- Capture 30 seconds of room tone before the first take and 10 seconds after the final take.
- Make a ten-second level test using the loudest line in the scenario section. Aim for normal peaks between `-12 dBFS` and `-6 dBFS`; never clip at `0 dBFS`.

## Recording format

- Preferred master: mono PCM WAV, `48 kHz`, `24-bit`.
- Record dry. Disable automatic gain control, noise suppression, echo cancellation, compression, reverb, and voice enhancement.
- Keep the untouched masters. Any denoised, levelled, or edited file must be exported as a new derivative.
- If the recorder cannot capture 24-bit WAV, use mono `48 kHz`, `16-bit` PCM WAV and note the substitution in the take log. Do not record the master as MP3.

## Delivery and pace

- Target average: about `135 words per minute` across the spoken copy.
- Let connective lines rise toward `140 words per minute`; slow number clusters and limitation statements toward `125–130 words per minute`.
- Use the delivery notes in `SCRIPT.md` as intention, not as lines to read. Short pauses should sound like thought, not punctuation being performed.
- Keep the voice human and confident: contractions are intentional, sentence lengths vary, and no line should sound like generic AI advertising.
- The fixed demo chapter contains deliberate UI inspection time. Do not stretch sentences to fill it; leave the planned visual holds clean.

The final script contains `1,214` spoken words. A straight read is approximately `9:20` at 130 words per minute, `9:00` at 135, and `8:40` at 140. The demo contains `423` spoken words; at the target pace it leaves about 29 seconds of cumulative no-new-narration time inside the exact 3:37 capture window. The remaining cut allowance is reserved for short breaths and chapter-card beats.

## Take strategy

1. Record the script by beat, not as one ten-minute take. Keep the exact beat boundaries and filenames below.
2. Record two complete takes of every beat. Take one should be natural and conversational; take two may be slightly more concise and energetic without changing words.
3. Listen once for clipped numbers, dropped endings, mouth noise, and changed wording. Record pickups only for affected sentences.
4. Leave one second of clean pre-roll and two seconds of clean post-roll on every file.
5. Do not splice different room positions or microphone distances into the same beat. If the setup changes, slate a new version number.
6. The edit may remove breaths and dead space, but it must not change the claim wording, numeric values, implemented-versus-roadmap boundary, or consent language.

## Exact filename convention

Use this exact pattern:

`majupilot_vo_desan_v01_<beat-id>_<take-id>_48k24m.wav`

- `<beat-id>` must be one of the IDs in the table below.
- `<take-id>` is `t01`, `t02`, or `pickup01`, incrementing pickups as needed.
- `48k24m` means 48 kHz, 24-bit, mono. If the approved fallback format is used, replace only this suffix with `48k16m`.
- Use lowercase ASCII, underscores, and no spaces.

| Script time | Beat ID | First-take filename |
|---|---|---|
| 0:00–0:20 | `00_opening` | `majupilot_vo_desan_v01_00_opening_t01_48k24m.wav` |
| 0:20–1:05 | `01_problem_objectives` | `majupilot_vo_desan_v01_01_problem_objectives_t01_48k24m.wav` |
| 1:05–2:05 | `02_proposed_solution` | `majupilot_vo_desan_v01_02_proposed_solution_t01_48k24m.wav` |
| 2:05–3:15 | `03_technical_approach` | `majupilot_vo_desan_v01_03_technical_approach_t01_48k24m.wav` |
| 3:15–3:28 | `04a_demo_home` | `majupilot_vo_desan_v01_04a_demo_home_t01_48k24m.wav` |
| 3:28–3:50 | `04b_demo_review` | `majupilot_vo_desan_v01_04b_demo_review_t01_48k24m.wav` |
| 3:50–4:18 | `04c_demo_results` | `majupilot_vo_desan_v01_04c_demo_results_t01_48k24m.wav` |
| 4:18–4:45 | `04d_demo_recommendations` | `majupilot_vo_desan_v01_04d_demo_recommendations_t01_48k24m.wav` |
| 4:45–5:25 | `04e_demo_scenarios` | `majupilot_vo_desan_v01_04e_demo_scenarios_t01_48k24m.wav` |
| 5:25–6:20 | `04f_demo_blueprint` | `majupilot_vo_desan_v01_04f_demo_blueprint_t01_48k24m.wav` |
| 6:20–6:52 | `04g_demo_consultation` | `majupilot_vo_desan_v01_04g_demo_consultation_t01_48k24m.wav` |
| 6:52–8:15 | `05_testing_validation` | `majupilot_vo_desan_v01_05_testing_validation_t01_48k24m.wav` |
| 8:15–9:25 | `06_industry_future` | `majupilot_vo_desan_v01_06_industry_future_t01_48k24m.wav` |
| 9:25–9:40 | `07_close` | `majupilot_vo_desan_v01_07_close_t01_48k24m.wav` |

Record room tone as `majupilot_vo_desan_v01_roomtone_48k24m.wav`. Keep a plain-text take log named `majupilot_vo_desan_v01_take-log.txt` beside the audio masters.

## Pronunciation and number notes

- `Desan Vasu`: use Desan's own preferred pronunciation; record it consistently in the opening and close.
- `MajuPilot`: say “mah-joo pilot,” with a light stress on “mah.”
- `USM`: say the letters “U S M,” then say “Universiti Sains Malaysia” in full.
- `Exabytes`: say “ex-ah-bytes.”
- `Next.js`: the script intentionally says “Next dot J S.”
- `Supabase`: say “soo-puh-base.”
- `Vercel`: say “ver-sell.”
- `Document R A G`: say the letters individually. Do not turn it into a current-feature claim.
- `C R M`: say the letters individually.
- `P one`: say “P one,” not “phase one.”
- `RM`: say “ringgit” in narration. Keep the exact `RM` figures on screen.
- `37.5`, `42.5`, `30.4`, and `3.284`: follow the written-out forms in `SCRIPT.md`; do not round them.
- `DeepSeek V four point one Flash`: use that spoken form. The exact model identifier may remain visible as `deepseek/deepseek-v4.1-flash` in evidence graphics.
- `E S Lint`: say the letters “E S,” followed by “lint.”

## Handoff check

Before editing, confirm that every expected beat has at least two takes, the files open as mono WAV, no peak clips, the scenario figures match the script, and the consultation sentence ends without implying submission or human acceptance.
