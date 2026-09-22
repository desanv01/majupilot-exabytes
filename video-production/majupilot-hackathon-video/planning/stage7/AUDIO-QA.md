# Stage 7 rendered-master audio QA

Master: `deliverables/MajuPilot_Prototype_Demo_Desan_Vasu_v1.mp4`

## Whole-program measurements

| Measurement | Result |
|---|---:|
| Integrated loudness | -21.07 LUFS |
| Loudness range | 4.20 LU |
| True peak | -2.52 dBTP |
| Overall sample peak | -2.539 dBFS |
| Overall RMS | -24.269 dBFS |
| DC offset | -0.000043 |
| NaN / infinite / denormal samples | 0 / 0 / 0 |

The rendered mix retains headroom, contains no invalid samples, and does not clip. The -2.52 dBTP program peak remains below full scale and close to the declared narration safety ceiling.

## Bounded level spot checks

| Window | Purpose | Mean / max |
|---|---|---:|
| 2.00–18.00 | Opening narration | -24.3 / -3.0 dBFS |
| 195.35–207.30 | Demo narration | -23.5 / -3.5 dBFS |
| 223.50–230.00 | Demo visual-inspection gap | -37.8 / -22.5 dBFS |
| 412.00–415.00 | Intentional narration/caption silence | -44.4 / -32.0 dBFS |
| 415.35–430.00 | Testing narration resumes | -24.0 / -3.1 dBFS |
| 565.35–574.85 | Close narration | -23.8 / -2.8 dBFS |
| 574.85–580.00 | Final visual/audio hold and fade | -50.0 / -35.9 dBFS |

The speech windows are consistently anchored around -24 dBFS mean. The quieter inspection window, the 412–415 chapter boundary, and the final hold are intentional and recover immediately into the following narration where applicable.

## Carve and dropout checks

- The music bed retains the accepted HyperFrames strength-0.8 carve against the `voiceover` group: six speech-band EQ lanes plus dynamic gain automation. No Stage 7 remix was applied.
- A -50 dBFS / 1.0-second silence scan found only 282.107–283.425 seconds (1.318 seconds, an authored demo pause) and 578.929–580.000 seconds (1.071 seconds, the final fade). No unexpected long dropout was found.
- The 412–415 second boundary is intentionally free of narration and captions, but retains low-level music at -44.4 dBFS mean; this is a deliberate chapter reset, not a broken audio stream.
- Full video-plus-audio decode completed with no FFmpeg errors.
