import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) => fs.readFileSync(path.join(root, name), "utf8");
const index = read("index.html");
const f09 = read("compositions/frames/09-no-current-rag.html");
const f25 = read("compositions/frames/25-future-potential.html");
const captions = read("compositions/captions-phase6.html");
const words = JSON.parse(read("planning/phase6/captions-words.json"));
const edits = JSON.parse(read("planning/phase6/narration-edit-receipt.json"));
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };

assert(index.includes('data-duration="580" data-width="1920" data-height="1080" data-fps="30"'), "root duration/canvas/fps drifted");
assert((index.match(/id="scene-\d+"/g) ?? []).length === 26, "scene count drifted");
assert((index.match(/data-track-kind="voiceover"/g) ?? []).length === 14, "narration clip count drifted");
assert(index.includes('data-composition-src="compositions/captions-phase6.html"'), "Phase 6 caption track not mounted");
assert(index.includes("03_technical_approach_phase6.wav") && index.includes("06_industry_future_phase6.wav"), "corrected voice clips not mounted");
assert(words.length === 1073, `expected 1073 retained caption words; got ${words.length}`);
assert(words.every((word) => word.start >= 0 && word.end <= 580 && word.end >= word.start), "invalid caption timestamps");
for (const [start, end] of [[173.5, 189.65], [544, 556.2]]) {
  assert(!words.some((word) => word.start >= start && word.end <= end), `obsolete caption remains in ${start}-${end}s`);
}
assert(!/not implemented now|deferred p1|future upgrade/i.test(f09 + f25 + captions), "future-only RAG claim remains viewer-facing");
assert(/Document RAG/i.test(f25) && /Evidence Library/i.test(f09), "current Document RAG proof missing");
assert(/fresh-blueprint-1366\.png/.test(read("compositions/frames/15-demo-blueprint.html")), "current Blueprint handoff capture missing");
assert(edits.length === 2, "expected two bounded narration edits");
for (const edit of edits) {
  assert(fs.existsSync(path.join(root, edit.corrected)), `missing corrected audio ${edit.corrected}`);
  assert(edit.sample_rate === 48000 && edit.sample_width_bytes === 3, `audio format drifted for ${edit.beat}`);
}
for (const capture of ["fresh-blueprint-1366.png", "fresh-copilot-1366.png", "fresh-evidence-1366.png"]) {
  assert(fs.existsSync(path.join(root, "assets/capture/phase6-current", capture)), `missing current capture ${capture}`);
}
const groups = captions.match(/const GROUPS = (\[[^\n]+\]);/);
assert(Boolean(groups), "caption timing groups missing");
if (groups) {
  const parsed = JSON.parse(groups[1]);
  assert(parsed.length === 252, `expected 252 caption cards; got ${parsed.length}`);
  assert(parsed.every((group, i) => group.end > group.start && (i === 0 || group.start >= parsed[i - 1].end)), "caption cards overlap");
}
if (process.argv.includes("--checked")) {
  const check = JSON.parse(read("planning/phase6/check-final.json"));
  assert(check.ok === true && check.strict === true, "HyperFrames final strict check is not green");
  assert(check._meta?.version === "0.8.59", "HyperFrames check version drifted");
  for (const gate of ["lint", "runtime", "layout", "motion", "contrast"]) {
    assert(check[gate]?.ok === true && check[gate]?.errorCount === 0 && check[gate]?.warningCount === 0, `HyperFrames ${gate} gate is not green`);
  }
  assert(check.layout?.samples?.length === 26 && check.layout?.totalIssueCount === 0, "HyperFrames did not check all 26 scene midpoints");
  assert(check.contrast?.checked === 55 && check.contrast?.passed === 55, "HyperFrames contrast receipt is incomplete");
}
const mp4Arg = process.argv.indexOf("--mp4");
if (mp4Arg >= 0) {
  const mp4 = path.resolve(root, process.argv[mp4Arg + 1] ?? "");
  assert(fs.existsSync(mp4), "final MP4 missing");
  if (fs.existsSync(mp4)) {
    const probe = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration:stream=codec_name,width,height,r_frame_rate,sample_rate,channels", "-of", "json", mp4], {encoding:"utf8"}));
    const video = probe.streams.find((stream) => stream.codec_name === "h264");
    const audio = probe.streams.find((stream) => stream.codec_name === "aac");
    assert(Math.abs(Number(probe.format.duration) - 580) < .05, "final MP4 duration is not 580 seconds");
    assert(video?.width === 1920 && video?.height === 1080 && video?.r_frame_rate === "30/1", "final MP4 video encoding drifted");
    assert(audio?.sample_rate === "48000" && audio?.channels === 2, "final MP4 audio encoding drifted");
  }
}
if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(JSON.stringify({ok:true,duration_s:580,scenes:26,narration_clips:14,caption_words:words.length,caption_groups:252,corrected_voice_passages:2}, null, 2));
