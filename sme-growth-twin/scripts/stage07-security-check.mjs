import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(process.cwd(), "..");
const tracked = execFileSync("git", ["ls-files"], { cwd: root, encoding: "utf8", windowsHide: true })
  .split(/\r?\n/).filter(Boolean)
  .filter((file) => !file.endsWith("package-lock.json") && !/\.(png|jpg|pdf|zip)$/i.test(file));
const findings = [];
for (const relative of tracked) {
  const text = await readFile(path.join(root, relative), "utf8");
  if (/\b(sk-[A-Za-z0-9_-]{20,}|AIza[0-9A-Za-z_-]{20,}|gh[pousr]_[A-Za-z0-9]{20,})\b/.test(text)) findings.push(`${relative}: credential-shaped value`);
  if (/^\s*[A-Z][A-Z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD)\s*=\s*[^#\s][^\r\n]*$/m.test(text) && !relative.endsWith(".env.example")) findings.push(`${relative}: assigned secret-like value`);
  if ((text.startsWith('"use client"') || text.startsWith("'use client'")) && /(?:@\/|\.\.\/).*infrastructure\/model-provider/.test(text)) findings.push(`${relative}: client imports server model provider`);
}
if (findings.length) throw new Error(`Stage 07 security scan failed:\n${findings.join("\n")}`);
console.log(JSON.stringify({ trackedTextFilesScanned: tracked.length, credentialValuesFound: 0, clientModelProviderImports: 0 }, null, 2));
