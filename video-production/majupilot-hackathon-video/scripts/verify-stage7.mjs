import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";


const project = resolve(import.meta.dirname, "..");
const master = resolve(
  project,
  process.argv[2] ?? "deliverables/MajuPilot_Prototype_Demo_Desan_Vasu_v1.mp4",
);
const failures = [];

function requireFact(condition, message) {
  if (!condition) failures.push(message);
}

if (!existsSync(master)) {
  throw new Error(`Master does not exist: ${master}`);
}

const probe = JSON.parse(
  execFileSync(
    "ffprobe",
    ["-v", "error", "-show_format", "-show_streams", "-of", "json", master],
    { encoding: "utf8" },
  ),
);
const video = probe.streams.find((stream) => stream.codec_type === "video");
const audio = probe.streams.find((stream) => stream.codec_type === "audio");
const duration = Number(probe.format.duration);

requireFact(probe.streams.filter((stream) => stream.codec_type === "video").length === 1, "expected one video stream");
requireFact(probe.streams.filter((stream) => stream.codec_type === "audio").length === 1, "expected one audio stream");
requireFact(video?.codec_name === "h264", "video codec must be H.264");
requireFact(video?.width === 1920 && video?.height === 1080, "video must be 1920x1080");
requireFact(video?.r_frame_rate === "30/1", "video frame rate must be 30/1");
requireFact(!video?.nb_frames || Number(video.nb_frames) === 17_400, "video must contain 17,400 frames");
requireFact(Math.abs(Number(video?.start_time ?? 0)) <= 0.001, "video stream must start at zero");
requireFact(Math.abs(Number(video?.duration) - 580) <= 0.001, "video stream must end at 580 seconds");
requireFact(audio?.codec_name === "aac", "audio codec must be AAC");
requireFact(Number(audio?.sample_rate) === 48_000, "audio sample rate must be 48 kHz");
requireFact(audio?.channels === 2, "audio must be stereo");
requireFact(Math.abs(Number(audio?.start_time ?? 0)) <= 0.001, "audio stream must start at zero");
requireFact(Math.abs(Number(audio?.duration) - 580) <= 0.001, "audio stream must end at 580 seconds");
requireFact(Math.abs(duration - 580) <= 0.001, "container duration must be exactly 580 seconds");
requireFact(Math.abs(Number(probe.format.start_time ?? 0)) <= 0.001, "container must start at zero");

const index = readFileSync(resolve(project, "index.html"), "utf8");
const ragCurrent = readFileSync(
  resolve(project, "compositions/frames/09-no-current-rag.html"),
  "utf8",
);
const ragFuture = readFileSync(
  resolve(project, "compositions/frames/25-future-potential.html"),
  "utf8",
);
const close = readFileSync(
  resolve(project, "compositions/frames/26-visible-path-close.html"),
  "utf8",
);
const payback = readFileSync(
  resolve(project, "compositions/frames/14-demo-scenarios.html"),
  "utf8",
);
const credits = readFileSync(resolve(project, "assets/audio/MEDIA-CREDITS.md"), "utf8");
const viewerFiles = [index, payback, ragCurrent, ragFuture, close];

requireFact(payback.includes("More than 60 months"), "approved capped payback text is missing");
requireFact(/not implemented now/i.test(ragCurrent), "current Document RAG boundary is missing");
requireFact(/deferred P1/i.test(ragFuture), "future/P1 Document RAG label is missing");
requireFact(/New Direction/i.test(close) && /Kevin MacLeod/i.test(close), "visible end-credit music attribution is missing");
requireFact(/CC BY 4\.0/i.test(credits), "repository CC BY 4.0 attribution is missing");
requireFact(!viewerFiles.some((text) => /(?:[A-Za-z]:\\Users\\|\/Users\/|\/home\/)/i.test(text)), "viewer-facing absolute path detected");

const hash = createHash("sha256");
await new Promise((resolveHash, rejectHash) => {
  const stream = createReadStream(master);
  stream.on("data", (chunk) => hash.update(chunk));
  stream.on("end", resolveHash);
  stream.on("error", rejectHash);
});

const result = {
  ok: failures.length === 0,
  file: master,
  bytes: statSync(master).size,
  sha256: hash.digest("hex"),
  duration_s: duration,
  start_s: Number(probe.format.start_time ?? 0),
  video: {
    codec: video?.codec_name,
    profile: video?.profile,
    width: video?.width,
    height: video?.height,
    pixel_format: video?.pix_fmt,
    frame_rate: video?.r_frame_rate,
    frames: video?.nb_frames ? Number(video.nb_frames) : null,
  },
  audio: {
    codec: audio?.codec_name,
    sample_rate_hz: Number(audio?.sample_rate),
    channels: audio?.channels,
    channel_layout: audio?.channel_layout,
  },
  source_contract: {
    capped_payback: true,
    document_rag_future_p1_only: true,
    music_attribution: true,
    viewer_absolute_paths_absent: true,
  },
  failures,
};

console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exitCode = 1;
