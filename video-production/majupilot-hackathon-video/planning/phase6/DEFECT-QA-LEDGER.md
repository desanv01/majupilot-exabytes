# Phase 6 video correction and QA ledger

## Source and review method

- Baseline master: `MajuPilot_Prototype_Demo_Desan_Vasu_v1.mp4`, 580.000 s, 1920×1080, 30 fps, SHA-256 `40929eaf83b3b6428d46e49d835132ace4379efdb4a3f50085b180a893c141b1` from the read-only main checkout.
- Reviewed the baseline at 10-second intervals in `baseline/baseline-10s-contact.jpg`, compared all 26 scene midpoints against the editable source, and decoded the full master with FFmpeg. The contact sheet is a sampling review; the full-frame pass verifies decode/stream integrity, not manual visual approval of every pixel.
- Current product proof is from the accepted Phase 5 controlled local journey, using only the synthetic Meridian Orchard Logistics scenario. The three copied screenshots are preserved unedited under `assets/capture/phase6-current/`.
  - Blueprint screenshot SHA-256: `e8e5527852fddd6d97b90032675e85293782c942bb097dcba3a8388b532e6eee0`.
  - Cited Copilot screenshot SHA-256: `4d9d302bf8afa9642170ea2e8e1b5eed577d0de0a7b86890c28df1e2b775c854`.
  - Evidence Library screenshot SHA-256: `9c656f643d2ce3b70d67f4c0e13ac5e2b642e75af80c160d9aa7611ff4c4712a`.

## Timestamped findings

| Time in master | Finding | Correction | Evidence / status |
| --- | --- | --- | --- |
| 0:00–0:20 | Opening identity and authorized portrait remained legible. | Preserve portrait, title, university, timing and narration. | Baseline 0/10 s; unchanged. |
| 2:53.5–3:09.7 | Recorded narration falsely said Document RAG and document ingestion were future or not implemented. | Muted the full standalone sentence at 173.50–189.65 s, preserving the adjacent recorded sentences, total timing and Desan's voice; removed only those words from captions. | `narration-edit-receipt.json`; corrected transcript and word data. |
| 2:59–3:15 | The pink `NOT IMPLEMENTED NOW` card contradicted the accepted Phase 3/5 product. There was no current Evidence Library or cited Copilot proof. | Replaced scene 09 with bounded PDF/DOCX/TXT explanation and two authentic accepted synthetic captures, sequenced Evidence Library → cited Copilot. | `snapshots-final/` at 180 s and `snapshots-copilot-final/` at 191 s. |
| 3:15–6:52 | Seven Case A demo clips still follow the approved fictional flow; existing Blueprint footage predates the direct Copilot handoff. | Preserved unaffected Case A footage. Added the accepted current Blueprint handoff capture for 373–380 s, explicitly labelled as a separate fresh synthetic verification. | `snapshots/` at 350/374 s; `fresh-blueprint-1366.png`. |
| 6:52–8:15 | Testing values are a recorded historical hosted receipt, separate from later Phase 5 evidence. | Preserved recorded figures and chapter timing; retained scope labels. | Baseline and 26-scene midpoint review. |
| 9:04–9:16.2 | Recorded narration falsely called Document RAG and uploaded documents a future upgrade and said they were not implemented. | Muted that standalone passage at 544.00–556.20 s; left the surrounding future-work and provenance sentences intact; removed muted words from captions. | `narration-edit-receipt.json`; corrected transcript and word data. |
| 9:02–9:25 | Future scene stamped Document RAG as deferred P1. Its body and anchors overlapped after the first copy correction. | Moved bounded cited documents into the current side, changed the fourth future branch to additional document types, shortened/reflowed the copy and anchor row. | `snapshots-final/` at 544/550/558 s; no text collision in the refreshed sheet. |
| 3:11 and 9:10 | First Copilot crop exposed a cut-off hero heading; music bed stayed carved for speech that had been muted. | Reframed the accepted screenshot around the full cited answer, cleanly excluding the truncated source-page hero. Added a source strip beneath the answer and restored the existing music bed to a restrained level during the two narration pauses. | `snapshots-copilot-final/` at 191 s inspected full size; `rebalance-phase6-music.mjs`; final audio QA pending encoded output. |

## Preserved invariants

- 26 scene starts and durations, 580 s total, seven authentic Case A clips, 195–412 s demo window, 412–415 s silent chapter beat, English narration, portrait only in opening, and 5.15 s final visual hold.
- Desan Vasu / Student / USM — Universiti Sains Malaysia identity; MajuPilot name; fictional labels; planning-assumption caveats; consent unchecked; no customer, credential or private file path is shown.
- No replacement voice was generated. The two edits are bounded silence on the existing recorded program WAVs. Remaining speech samples retain their original positions and content.
- Corrected caption track: 1,073 timed words in 252 cards. Silence windows carry no false captions.

## Final gates

| Gate | Result |
| --- | --- |
| `verify-phase6.mjs` source, timing, claim and asset assertions | Pass |
| HyperFrames pinned 0.8.59 strict lint/check at all 26 midpoints | Pass: zero lint/runtime/layout/contrast findings; 55/55 contrast samples |
| Final MP4 render/decode, exact duration/fps/codec, audio sync and loudness | Pass; see `FINAL-DELIVERY-RECEIPT.md` for stream, decode and audio measurements |
| Final encoded contact sheet and critical-frame inspection | Pass; `final-contact-sheet.jpg` and full-size encoded frames at 180/191/374/550/558 s |
| GitHub exact-SHA CI | Checked after branch push; final handoff reports commit SHA and run |

## Residual editorial caveat

The obsolete sentences are removed from Desan's recording rather than replaced with an invented voice line. This creates a deliberate music-led proof interval at approximately 2:54–3:10 and 9:04–9:16. The final encoded file preserves the music bed at both points; a new short authentic Desan line would be needed for spoken explanation while retaining the fixed 9:40 architecture.
