"""Build silence-only narration edits, loudness-normalized program WAVs, and captions.

The approved source copies under .media/audio/voice are immutable inputs.  The
only temporal edits are removal of leading/trailing room and, where a fixed
chapter cannot otherwise fit, proportional shortening of inter-word silence.
No speech samples are time-stretched or deleted.
"""

from __future__ import annotations

import hashlib
import json
import math
import re
import subprocess
from dataclasses import dataclass
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / ".media" / "audio" / "voice"
PROGRAM_DIR = ROOT / ".media" / "audio" / "voice-program"
RAW_TRANSCRIPT_DIR = ROOT / "planning" / "stage6" / "transcripts" / "raw"
CAPTION_TRANSCRIPT = ROOT / "planning" / "stage6" / "CAPTION-TRANSCRIPT.md"
LEDGER_PATH = ROOT / "planning" / "stage6" / "narration-ledger.json"
WORDS_PATH = ROOT / "planning" / "stage6" / "captions-words.json"
ALIGNMENT_PATH = ROOT / "planning" / "stage6" / "caption-alignment.json"
WORK_DIR = ROOT / ".hyperframes" / "stage6-tmp"

TARGET_I = -24.0
TARGET_LRA = 7.0
TARGET_TP = -3.0
MIN_GAP = 0.12
PRE_ROLL = 0.10
POST_ROLL = 0.15


@dataclass(frozen=True)
class Beat:
    beat_id: str
    source: str
    original_filename: str
    placement: float
    target_duration: float | None


BEATS = [
    Beat("00_opening", "voice_001.wav", "majupilot_vo_desan_v01_00_opening_t01_48k24m.wav", 0.35, None),
    Beat("01_problem_objectives", "voice_002.wav", "majupilot_vo_desan_v01_01_problem_objectives_t01_48k24m.wav", 20.20, 44.60),
    Beat("02_proposed_solution", "voice_003.wav", "majupilot_vo_desan_v01_02_proposed_solution_t01_48k24m.wav", 65.20, 59.60),
    Beat("03_technical_approach", "voice_004.wav", "majupilot_vo_desan_v01_03_technical_approach_t01_48k24m.wav", 125.20, 69.60),
    Beat("04a_demo_home", "voice_005.wav", "majupilot_vo_desan_v01_04a_demo_home_t01_48k24m.wav", 195.35, None),
    Beat("04b_demo_review", "voice_006.wav", "majupilot_vo_desan_v01_04b_demo_review_t01_48k24m.wav", 208.35, None),
    Beat("04c_demo_results", "voice_007.wav", "majupilot_vo_desan_v01_04c_demo_results_t01_48k24m.wav", 230.35, None),
    Beat("04d_demo_recommendations", "voice_008.wav", "majupilot_vo_desan_v01_04d_demo_recommendations_t01_48k24m.wav", 258.35, None),
    Beat("04e_demo_scenarios", "voice_009.wav", "majupilot_vo_desan_v01_04e_demo_scenarios_t01_48k24m.wav", 285.20, 39.60),
    Beat("04f_demo_blueprint", "voice_010.wav", "majupilot_vo_desan_v01_04f_demo_blueprint_t01_48k24m.wav", 325.15, 54.50),
    Beat("04g_demo_consultation", "voice_011.wav", "majupilot_vo_desan_v01_04g_demo_consultation_t01_48k24m.wav", 380.35, None),
    Beat("05_testing_validation", "voice_012.wav", "majupilot_vo_desan_v01_05_testing_validation_t01_48k24m.wav", 415.35, None),
    Beat("06_industry_future", "voice_013.wav", "majupilot_vo_desan_v01_06_industry_future_t01_48k24m.wav", 495.20, 69.40),
    Beat("07_close", "voice_014.wav", "majupilot_vo_desan_v01_07_close_t01_48k24m.wav", 565.35, 9.50),
]


def run(args: list[str]) -> subprocess.CompletedProcess[str]:
    result = subprocess.run(args, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if result.returncode != 0:
        raise RuntimeError(
            f"Command failed ({result.returncode}): {' '.join(args)}\n{result.stderr}"
        )
    return result


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def duration(path: Path) -> float:
    result = run([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=nw=1:nk=1", str(path),
    ])
    return float(result.stdout.strip())


def ebur(path: Path) -> dict[str, float]:
    result = subprocess.run(
        ["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-af", "ebur128=peak=true:framelog=quiet", "-f", "null", "-"],
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    log = result.stderr
    def last(pattern: str) -> float:
        matches = re.findall(pattern, log, flags=re.MULTILINE)
        if not matches:
            raise RuntimeError(f"Missing ebur128 field for {path.name}: {pattern}")
        return float(matches[-1])
    return {
        "integrated_lufs": last(r"^\s*I:\s*(-?[0-9.]+)\s+LUFS"),
        "lra_lu": last(r"^\s*LRA:\s*([0-9.]+)\s+LU"),
        "true_peak_dbfs": last(r"^\s*Peak:\s*(-?[0-9.]+)\s+dBFS"),
    }


def loudnorm_measure(path: Path) -> dict[str, str]:
    result = subprocess.run(
        [
            "ffmpeg", "-hide_banner", "-nostats", "-i", str(path),
            "-af", f"loudnorm=I={TARGET_I}:LRA={TARGET_LRA}:TP={TARGET_TP}:print_format=json",
            "-f", "null", "-",
        ],
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    matches = re.findall(r"\{\s*\"input_i\".*?\}", result.stderr, flags=re.DOTALL)
    if not matches:
        raise RuntimeError(f"Missing loudnorm measurement for {path.name}")
    return json.loads(matches[-1])


def parse_caption_transcript() -> dict[str, str]:
    text = CAPTION_TRANSCRIPT.read_text(encoding="utf-8")
    return {
        beat_id: " ".join(body.split())
        for beat_id, body in re.findall(
            r"<!-- CAPTION-START ([^ ]+) -->\s*(.*?)\s*<!-- CAPTION-END -->",
            text,
            flags=re.DOTALL,
        )
    }


def norm(token: str) -> str:
    return re.sub(r"[^a-z0-9]", "", token.lower().replace("’", "'"))


def align_tokens(canonical: list[str], asr_words: list[dict[str, object]]) -> tuple[list[int | None], float]:
    source = [norm(str(word["text"])) for word in asr_words]
    target = [norm(word) for word in canonical]
    n, m = len(target), len(source)
    dp = [[0.0] * (m + 1) for _ in range(n + 1)]
    back: list[list[str | None]] = [[None] * (m + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        dp[i][0] = float(i)
        back[i][0] = "del"
    for j in range(1, m + 1):
        dp[0][j] = float(j)
        back[0][j] = "ins"
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            substitution = 0.0 if target[i - 1] == source[j - 1] else 1.0
            options = [
                (dp[i - 1][j - 1] + substitution, "pair"),
                (dp[i - 1][j] + 1.0, "del"),
                (dp[i][j - 1] + 1.0, "ins"),
            ]
            dp[i][j], back[i][j] = min(options, key=lambda item: item[0])
    mapping: list[int | None] = [None] * n
    exact = 0
    i, j = n, m
    while i or j:
        op = back[i][j]
        if op == "pair":
            mapping[i - 1] = j - 1
            if target[i - 1] == source[j - 1]:
                exact += 1
            i -= 1
            j -= 1
        elif op == "del":
            i -= 1
        else:
            j -= 1
    ratio = exact / max(n, m, 1)
    return mapping, ratio


def map_time(value: float, trim_start: float, cuts: list[tuple[float, float]]) -> float:
    removed = sum(end - start for start, end in cuts if end <= value + 1e-9)
    return value - trim_start - removed


def build_edit_plan(words: list[dict[str, object]], raw_duration: float, target_duration: float | None) -> tuple[float, float, list[tuple[float, float]], float]:
    first = float(words[0]["start"])
    last = float(words[-1]["end"])
    trim_start = max(0.0, first - PRE_ROLL)
    trim_end = min(raw_duration, last + POST_ROLL)
    natural = trim_end - trim_start
    output_target = natural if target_duration is None else target_duration
    removal = max(0.0, natural - output_target)
    gaps: list[tuple[float, float, float]] = []
    for left, right in zip(words, words[1:]):
        start = float(left["end"])
        end = float(right["start"])
        gap = end - start
        if gap > MIN_GAP:
            gaps.append((start, end, gap - MIN_GAP))
    capacity = sum(item[2] for item in gaps)
    if removal > capacity + 0.005:
        raise RuntimeError(f"Need {removal:.3f}s silence reduction but only {capacity:.3f}s is available")
    cuts: list[tuple[float, float]] = []
    if removal > 0 and capacity > 0:
        for start, end, reducible in gaps:
            amount = removal * reducible / capacity
            remaining_gap = (end - start) - amount
            cuts.append((start + remaining_gap / 2, end - remaining_gap / 2))
    return trim_start, trim_end, cuts, output_target


def cut_audio(source: Path, destination: Path, trim_start: float, trim_end: float, cuts: list[tuple[float, float]]) -> None:
    keep: list[tuple[float, float]] = []
    cursor = trim_start
    for cut_start, cut_end in cuts:
        if cut_start > cursor:
            keep.append((cursor, cut_start))
        cursor = cut_end
    if trim_end > cursor:
        keep.append((cursor, trim_end))
    filters = []
    labels = []
    for index, (start, end) in enumerate(keep):
        label = f"s{index}"
        labels.append(f"[{label}]")
        filters.append(f"[0:a]atrim=start={start:.6f}:end={end:.6f},asetpts=PTS-STARTPTS[{label}]")
    filters.append("".join(labels) + f"concat=n={len(keep)}:v=0:a=1[out]")
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(source),
        "-filter_complex", ";".join(filters), "-map", "[out]", "-ar", "48000", "-ac", "1", "-c:a", "pcm_s24le", str(destination),
    ])


def normalize_audio(source: Path, destination: Path) -> dict[str, str]:
    measured = loudnorm_measure(source)
    filt = (
        f"loudnorm=I={TARGET_I}:LRA={TARGET_LRA}:TP={TARGET_TP}:"
        f"measured_I={measured['input_i']}:measured_LRA={measured['input_lra']}:"
        f"measured_TP={measured['input_tp']}:measured_thresh={measured['input_thresh']}:"
        f"offset={measured['target_offset']}:linear=true:print_format=summary"
    )
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(source),
        "-af", filt, "-ar", "48000", "-ac", "1", "-c:a", "pcm_s24le", str(destination),
    ])
    return measured


def interpolate_unmapped(records: list[dict[str, object]]) -> None:
    index = 0
    while index < len(records):
        if records[index]["start"] is not None:
            index += 1
            continue
        run_start = index
        while index < len(records) and records[index]["start"] is None:
            index += 1
        run_end = index
        left = float(records[run_start - 1]["end"]) if run_start > 0 else 0.0
        right = float(records[run_end]["start"]) if run_end < len(records) else left + 0.4 * (run_end - run_start)
        if right <= left:
            right = left + 0.12 * (run_end - run_start)
        weights = [max(1, len(norm(str(records[i]["text"])))) for i in range(run_start, run_end)]
        total = sum(weights)
        cursor = left
        for offset, weight in enumerate(weights):
            span = (right - left) * weight / total
            record = records[run_start + offset]
            record["start"] = round(cursor, 3)
            record["end"] = round(cursor + span, 3)
            cursor += span


def main() -> None:
    PROGRAM_DIR.mkdir(parents=True, exist_ok=True)
    LEDGER_PATH.parent.mkdir(parents=True, exist_ok=True)
    WORK_DIR.mkdir(parents=True, exist_ok=True)
    canonical_by_beat = parse_caption_transcript()
    ledger = []
    alignment = []
    global_words = []

    for beat in BEATS:
            source = SOURCE_DIR / beat.source
            raw = json.loads((RAW_TRANSCRIPT_DIR / f"{beat.beat_id}.json").read_text(encoding="utf-8"))
            asr_words = raw["words"]
            raw_duration = duration(source)
            trim_start, trim_end, cuts, target = build_edit_plan(asr_words, raw_duration, beat.target_duration)
            cut_path = WORK_DIR / f"{beat.beat_id}-cut.wav"
            program_path = PROGRAM_DIR / f"{beat.beat_id}.wav"
            cut_audio(source, cut_path, trim_start, trim_end, cuts)
            loudnorm_input = normalize_audio(cut_path, program_path)
            program_duration = duration(program_path)

            canonical = canonical_by_beat[beat.beat_id].split()
            mapping, exact_ratio = align_tokens(canonical, asr_words)
            records: list[dict[str, object]] = []
            for token_index, token in enumerate(canonical):
                source_index = mapping[token_index]
                if source_index is None:
                    start = end = confidence = None
                else:
                    source_word = asr_words[source_index]
                    start = beat.placement + map_time(float(source_word["start"]), trim_start, cuts)
                    end = beat.placement + map_time(float(source_word["end"]), trim_start, cuts)
                    confidence = float(source_word["probability"])
                records.append({
                    "id": f"w{len(global_words) + token_index}",
                    "beat_id": beat.beat_id,
                    "text": token,
                    "start": round(start, 3) if start is not None else None,
                    "end": round(end, 3) if end is not None else None,
                    "confidence": round(confidence, 6) if confidence is not None else None,
                })
            interpolate_unmapped(records)
            global_words.extend(records)

            source_analysis = ebur(source)
            program_analysis = ebur(program_path)
            ledger.append({
                "beat_id": beat.beat_id,
                "original_filename": beat.original_filename,
                "source_path": f".media/audio/voice/{beat.source}",
                "source_sha256": sha256(source),
                "source_duration_s": round(raw_duration, 6),
                "source_analysis": source_analysis,
                "trim_in_s": round(trim_start, 6),
                "trim_out_s": round(raw_duration - trim_end, 6),
                "silence_cuts": [
                    {"start_s": round(start, 6), "end_s": round(end, 6), "removed_s": round(end - start, 6)}
                    for start, end in cuts
                ],
                "silence_removed_s": round(sum(end - start for start, end in cuts), 6),
                "processing": {
                    "temporal": "silence-only edit; no speech time-stretch or deletion",
                    "loudness": f"two-pass FFmpeg loudnorm I={TARGET_I} LUFS, LRA={TARGET_LRA} LU, TP={TARGET_TP} dBFS",
                    "tonal": "none",
                    "denoise_gate": "none",
                },
                "loudnorm_first_pass": loudnorm_input,
                "program_path": f".media/audio/voice-program/{beat.beat_id}.wav",
                "program_sha256": sha256(program_path),
                "program_duration_s": round(program_duration, 6),
                "program_analysis": program_analysis,
                "placement_start_s": beat.placement,
                "placement_end_s": round(beat.placement + program_duration, 6),
            })
            probabilities = [float(word["probability"]) for word in asr_words]
            alignment.append({
                "beat_id": beat.beat_id,
                "asr_word_count": len(asr_words),
                "caption_word_count": len(canonical),
                "exact_token_ratio": round(exact_ratio, 6),
                "mean_asr_word_probability": round(sum(probabilities) / len(probabilities), 6),
                "interpolated_caption_words": sum(1 for record in records if record["confidence"] is None),
                "first_caption_s": records[0]["start"],
                "last_caption_s": records[-1]["end"],
            })
            print(f"{beat.beat_id}: {program_duration:.3f}s @ {beat.placement:.2f}s")

    LEDGER_PATH.write_text(json.dumps(ledger, indent=2) + "\n", encoding="utf-8")
    WORDS_PATH.write_text(json.dumps(global_words, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    ALIGNMENT_PATH.write_text(json.dumps(alignment, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
