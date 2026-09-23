import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const stage6 = JSON.parse(fs.readFileSync(path.join(root, "planning/stage6/captions-words.json"), "utf8"));
const cuts = [[173.5, 189.65], [544.0, 556.2]];
const corrected = stage6.filter((word) => !cuts.some(([start, end]) => word.start >= start && word.end <= end));
const out = path.join(root, "planning/phase6/captions-words.json");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(corrected, null, 2) + "\n");
const originalTranscript = fs.readFileSync(path.join(root, "planning/stage6/CAPTION-TRANSCRIPT.md"), "utf8");
const phase6Transcript = originalTranscript
  .replace(/One limitation is equally important\.[\s\S]*?not something demonstrated here\./, "[Music and current Evidence Library / cited Copilot proof; obsolete recorded claim removed.]")
  .replace(/Document RAG,\s*retrieval-augmented generation,[\s\S]*?They are not implemented now\./, "[Music and current Document RAG proof; obsolete recorded claim removed.]")
  .replace("# Stage 6 caption transcript", "# Phase 6 corrected caption transcript")
  .replace("This is the editorially corrected transcript of the approved recordings.", "This transcript follows the Phase 6 cut. Two obsolete standalone claims are muted in the original Desan recordings and have no captions. All other spoken words and timing are preserved. This is the editorially corrected transcript of the approved recordings.")
  .replace("The recording is\nnever rewritten or time-stretched.", "No replacement voice was generated or speech time-stretched.");
fs.writeFileSync(path.join(root, "planning/phase6/CAPTION-TRANSCRIPT.md"), phase6Transcript);
console.log(`Phase 6 captions: ${stage6.length} -> ${corrected.length} spoken words`);
