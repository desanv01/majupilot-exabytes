import fs from "node:fs";
import path from "node:path";

const projectDir = path.resolve(import.meta.dirname, "..");
const framesDir = path.join(projectDir, "compositions", "frames");
const audioDir = path.join(projectDir, "assets", "audio", "placeholders");
const durationByPrefix = new Map([
  ["01",20],["02",22],["03",23],["04",18],["05",25],["06",17],["07",26],["08",28],["09",16],
  ["10",13],["11",22],["12",28],["13",27],["14",40],["15",55],["16",32],["17",3],["18",24],
  ["19",20],["20",19],["21",12],["22",5],["23",32],["24",15],["25",23],["26",15],
]);

fs.mkdirSync(audioDir, { recursive: true });
const sampleRate = 8000;
const seconds = 580;
const dataLength = sampleRate * seconds;
const wav = Buffer.alloc(44 + dataLength, 128);
wav.write("RIFF", 0);
wav.writeUInt32LE(36 + dataLength, 4);
wav.write("WAVEfmt ", 8);
wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(sampleRate, 24);
wav.writeUInt32LE(sampleRate, 28);
wav.writeUInt16LE(1, 32);
wav.writeUInt16LE(8, 34);
wav.write("data", 36);
wav.writeUInt32LE(dataLength, 40);
fs.writeFileSync(path.join(audioDir, "stage5-silence.wav"), wav);

for (const file of fs.readdirSync(framesDir).filter((name) => name.endsWith(".html")).sort()) {
  const prefix = file.slice(0, 2);
  const duration = durationByPrefix.get(prefix);
  if (!duration) continue;
  const sidecar = {
    duration,
    assertions: [
      { kind: "appearsBy", selector: "#root", bySec: 0.5 },
      { kind: "staysInFrame", selector: "#root" },
    ],
  };
  fs.writeFileSync(path.join(framesDir, file.replace(/\.html$/, ".motion.json")), JSON.stringify(sidecar, null, 2) + "\n");
}

const placeholderManifest = {
  stage: 5,
  fps: 30,
  durationSec: 580,
  purpose: "Deterministic silent VO and BGM timeline placeholders only; replace with approved Stage 6 assets.",
  voiceover: "26 frame-aligned silent clips on track 50, including the intentional silent chapter card.",
  music: "One silent full-program BGM placeholder on track 60.",
  sfx: "Rights-safe bundled HyperFrames SFX are authored separately on track 70.",
};
fs.writeFileSync(path.join(audioDir, "README.json"), JSON.stringify(placeholderManifest, null, 2) + "\n");
