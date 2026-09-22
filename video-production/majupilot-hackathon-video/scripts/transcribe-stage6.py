"""Transcribe the approved Stage 6 narration with word timestamps.

The script reads only the frozen project-local source copies.  It does not
modify them and it never records the external master paths.
"""

from __future__ import annotations

import json
from pathlib import Path

from faster_whisper import WhisperModel


ROOT = Path(__file__).resolve().parents[1]
VOICE_DIR = ROOT / ".media" / "audio" / "voice"
OUT_DIR = ROOT / "planning" / "stage6" / "transcripts" / "raw"

BEATS = [
    ("00_opening", "voice_001.wav"),
    ("01_problem_objectives", "voice_002.wav"),
    ("02_proposed_solution", "voice_003.wav"),
    ("03_technical_approach", "voice_004.wav"),
    ("04a_demo_home", "voice_005.wav"),
    ("04b_demo_review", "voice_006.wav"),
    ("04c_demo_results", "voice_007.wav"),
    ("04d_demo_recommendations", "voice_008.wav"),
    ("04e_demo_scenarios", "voice_009.wav"),
    ("04f_demo_blueprint", "voice_010.wav"),
    ("04g_demo_consultation", "voice_011.wav"),
    ("05_testing_validation", "voice_012.wav"),
    ("06_industry_future", "voice_013.wav"),
    ("07_close", "voice_014.wav"),
]


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    model = WhisperModel("small.en", device="cpu", compute_type="int8")
    summary: list[dict[str, object]] = []

    for beat_id, filename in BEATS:
        source = VOICE_DIR / filename
        segments_iter, info = model.transcribe(
            str(source),
            language="en",
            beam_size=5,
            best_of=5,
            temperature=0.0,
            vad_filter=True,
            vad_parameters={"min_silence_duration_ms": 250},
            word_timestamps=True,
            condition_on_previous_text=False,
        )
        segments = []
        words = []
        for segment in segments_iter:
            segment_words = []
            for word in segment.words or []:
                record = {
                    "text": word.word.strip(),
                    "start": round(float(word.start), 3),
                    "end": round(float(word.end), 3),
                    "probability": round(float(word.probability), 6),
                }
                segment_words.append(record)
                words.append(record)
            segments.append(
                {
                    "start": round(float(segment.start), 3),
                    "end": round(float(segment.end), 3),
                    "text": segment.text.strip(),
                    "avg_logprob": round(float(segment.avg_logprob), 6),
                    "no_speech_prob": round(float(segment.no_speech_prob), 6),
                    "words": segment_words,
                }
            )

        payload = {
            "beat_id": beat_id,
            "source": f".media/audio/voice/{filename}",
            "engine": "faster-whisper 1.2.1",
            "model": "small.en",
            "language": info.language,
            "language_probability": round(float(info.language_probability), 6),
            "duration": round(float(info.duration), 6),
            "duration_after_vad": round(float(info.duration_after_vad), 6),
            "segments": segments,
            "words": words,
            "recognized_text": " ".join(segment["text"] for segment in segments),
        }
        (OUT_DIR / f"{beat_id}.json").write_text(
            json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        probabilities = [float(word["probability"]) for word in words]
        summary.append(
            {
                "beat_id": beat_id,
                "source": payload["source"],
                "word_count": len(words),
                "first_word_start": words[0]["start"] if words else None,
                "last_word_end": words[-1]["end"] if words else None,
                "mean_word_probability": round(sum(probabilities) / len(probabilities), 6)
                if probabilities
                else None,
                "recognized_text": payload["recognized_text"],
            }
        )
        print(f"{beat_id}: {len(words)} words")

    summary_path = OUT_DIR.parent / "whisper-summary.json"
    summary_path.write_text(
        json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )


if __name__ == "__main__":
    main()
