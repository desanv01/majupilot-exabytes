import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const indexHtml = read("index.html");
const captionHtml = read("compositions/captions-stage6.html");
const words = JSON.parse(read("planning/stage6/captions-words.json"));
const ledger = JSON.parse(read("planning/stage6/narration-ledger.json"));
const alignment = JSON.parse(read("planning/stage6/caption-alignment.json"));

const failures = [];
const assert = (condition, message) => {
  if (!condition) failures.push(message);
};
const near = (a, b, tolerance = 0.0005) => Math.abs(Number(a) - Number(b)) <= tolerance;
const attrs = (tag) => Object.fromEntries(
  [...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map((match) => [match[1], match[2]]),
);

const expectedScenes = [
  [0, 20], [20, 22], [42, 23], [65, 18], [83, 25], [108, 17], [125, 26],
  [151, 28], [179, 16], [195, 13], [208, 22], [230, 28], [258, 27], [285, 40],
  [325, 55], [380, 32], [412, 3], [415, 24], [439, 20], [459, 19], [478, 12],
  [490, 5], [495, 32], [527, 15], [542, 23], [565, 15],
];
const sceneTags = [...indexHtml.matchAll(/<div[^>]+id="scene-\d+"[^>]*><\/div>/g)].map((match) => attrs(match[0]));
assert(sceneTags.length === 26, `expected 26 scenes, found ${sceneTags.length}`);
sceneTags.forEach((scene, index) => {
  const expected = expectedScenes[index];
  assert(expected && near(scene["data-start"], expected[0]) && near(scene["data-duration"], expected[1]),
    `scene ${index + 1} timing drifted`);
});

const voiceTags = [...indexHtml.matchAll(/<audio[^>]+data-track-kind="voiceover"[^>]*><\/audio>/g)]
  .map((match) => attrs(match[0]));
assert(voiceTags.length === 14, `expected 14 narration clips, found ${voiceTags.length}`);
assert(indexHtml.includes('id="voiceover"') && indexHtml.includes('data-audio-group="voiceover"'),
  "narration audio-group invariant is missing");
ledger.forEach((entry, index) => {
  const clip = voiceTags[index];
  assert(Boolean(clip), `missing narration clip ${entry.beat_id}`);
  if (!clip) return;
  assert(clip.src === entry.program_path, `${entry.beat_id} program path mismatch`);
  assert(near(clip["data-start"], entry.placement_start_s), `${entry.beat_id} start mismatch`);
  assert(near(clip["data-duration"], entry.program_duration_s), `${entry.beat_id} duration mismatch`);
  assert(entry.placement_end_s <= 580, `${entry.beat_id} exceeds composition`);
  assert(entry.placement_end_s <= 412 || entry.placement_start_s >= 415,
    `${entry.beat_id} intrudes on intentional 412–415 second silence`);
  assert(fs.existsSync(path.join(root, entry.source_path)), `${entry.beat_id} frozen source missing`);
  assert(fs.existsSync(path.join(root, entry.program_path)), `${entry.beat_id} program WAV missing`);
});
assert(580 - ledger.at(-1).placement_end_s >= 5, "final hold is shorter than five seconds");

assert(words.length === 1131, `expected 1131 caption words, found ${words.length}`);
assert(alignment.length === 14, `expected 14 alignment receipts, found ${alignment.length}`);
words.forEach((word, index) => {
  assert(word.start >= 0 && word.end <= 580 && word.end >= word.start,
    `caption word ${index} has invalid timing`);
  assert(word.end <= 412 || word.start >= 415, `caption word ${index} intrudes on 412–415 second silence`);
});
const groupsMatch = captionHtml.match(/const GROUPS = (\[[^\n]+\]);/);
assert(Boolean(groupsMatch), "generated caption timeline data is missing");
const groups = groupsMatch ? JSON.parse(groupsMatch[1]) : [];
assert(groups.length === 266, `expected 266 caption groups, found ${groups.length}`);
groups.forEach((group, index) => {
  assert(group.end > group.start, `caption group ${index} has non-positive duration`);
  if (index > 0) assert(group.start >= groups[index - 1].end,
    `caption groups ${index - 1} and ${index} overlap`);
});
assert(captionHtml.includes("left: 192px; right: 192px; top: 900px; height: 68px"),
  "caption geometry left the reserved lower-third/title-safe layout");
assert(captionHtml.includes("data-layout-allow-caption-zone"), "caption-zone declaration is missing");
assert(indexHtml.includes('id="caption-track"') && indexHtml.includes('data-track-kind="captions"'),
  "single caption host track is missing");

const spokenText = words.map((word) => word.text).join(" ");
assert(/Document RAG/i.test(spokenText) && /not implemented now/i.test(spokenText),
  "Document RAG is not explicitly framed as unavailable today");
assert(!/\b1[4]0[.]5\b/.test(indexHtml + captionHtml), "internal uncapped value leaked into viewer-facing files");
assert(!/[A-Z]:\\Users\\/i.test(indexHtml + captionHtml), "personal absolute path leaked into viewer-facing files");
assert(indexHtml.includes('data-fx-carve="{&quot;enabled&quot;:true,&quot;sources&quot;:[&quot;voiceover&quot;],&quot;strength&quot;:0.8}"'),
  "narration-led BGM carve metadata is missing");

if (failures.length) {
  console.error(`Stage 6 verification failed (${failures.length}):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  scenes: sceneTags.length,
  duration_s: 580,
  narration_clips: voiceTags.length,
  narration_program_s: Number(ledger.reduce((sum, entry) => sum + entry.program_duration_s, 0).toFixed(6)),
  intentional_silence_s: [412, 415],
  final_hold_s: Number((580 - ledger.at(-1).placement_end_s).toFixed(6)),
  caption_groups: groups.length,
  caption_words: words.length,
  alignment_beats: alignment.length,
  viewer_path_leaks: 0,
}, null, 2));
