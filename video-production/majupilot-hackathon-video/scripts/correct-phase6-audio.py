"""Mute two obsolete standalone claims while preserving Desan's other recorded words and timing."""

from __future__ import annotations

import hashlib
import json
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
EDITS = [
    ("03_technical_approach", 125.2, 173.50, 189.65),
    ("06_industry_future", 495.2, 544.00, 556.20),
]


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


receipts = []
for beat, placement, absolute_start, absolute_end in EDITS:
    source = ROOT / ".media" / "audio" / "voice-program" / f"{beat}.wav"
    output = source.with_name(f"{beat}_phase6.wav")
    local_start = absolute_start - placement
    local_end = absolute_end - placement
    filter_graph = f"volume=0:enable='between(t,{local_start:.6f},{local_end:.6f})'"
    subprocess.run(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(source),
         "-af", filter_graph, "-c:a", "pcm_s24le", str(output)],
        check=True,
    )
    probe = subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "stream=duration,sample_rate,channels,bits_per_sample", "-of", "json", str(output)],
        text=True,
    )
    stream = json.loads(probe)["streams"][0]
    receipts.append(
        {
            "beat": beat,
            "source": str(source.relative_to(ROOT)).replace("\\", "/"),
            "corrected": str(output.relative_to(ROOT)).replace("\\", "/"),
            "source_sha256": sha256(source),
            "corrected_sha256": sha256(output),
            "muted_absolute_s": [absolute_start, absolute_end],
            "duration_s": float(stream["duration"]),
            "channels": int(stream["channels"]),
            "sample_width_bytes": int(stream["bits_per_sample"]) // 8,
            "sample_rate": int(stream["sample_rate"]),
        }
    )

receipt = ROOT / "planning" / "phase6" / "narration-edit-receipt.json"
receipt.parent.mkdir(parents=True, exist_ok=True)
receipt.write_text(json.dumps(receipts, indent=2) + "\n", encoding="utf-8")
print(receipt)
