import { spawn } from "node:child_process";

const nextBin = new URL("../node_modules/next/dist/bin/next", import.meta.url).pathname.replace(/^\/(?:([A-Za-z]:))/, "$1");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function start(mode, port) {
  const child = spawn(process.execPath, [nextBin, "dev", "-p", String(port)], {
    cwd: process.cwd(),
    env: { ...process.env, AI_EXECUTION_MODE: mode, AI_GATEWAY_MODEL: "", AI_GATEWAY_MODEL_FOLLOW_UP: "", AI_GATEWAY_API_KEY: "", VERCEL_OIDC_TOKEN: "", NEXT_TELEMETRY_DISABLED: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let diagnostics = "";
  child.stdout.on("data", (chunk) => { diagnostics += String(chunk).slice(0, 2_000); });
  child.stderr.on("data", (chunk) => { diagnostics += String(chunk).slice(0, 2_000); });
  const url = `http://127.0.0.1:${port}`;
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`server_${mode}_exited:${diagnostics.slice(-500)}`);
    try { const response = await fetch(`${url}/api/v2/ai/preflight`); return { child, url, first: response }; } catch { await delay(250); }
  }
  child.kill();
  throw new Error(`server_${mode}_timeout:${diagnostics.slice(-500)}`);
}

async function withServer(mode, port, check) {
  const server = await start(mode, port);
  try { await check(server); } finally { server.child.kill(); await delay(300); }
}

const results = [];

await withServer("disabled", 4311, async ({ url, first }) => {
  const preflight = await first.json();
  if (first.status !== 200 || preflight?.data?.state !== "disabled" || preflight?.data?.providerCallAllowed !== false) throw new Error("disabled_contract_failed");
  const invalid = await fetch(`${url}/api/v2/assessment/follow-up`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ automaticFollowUpCount: 4 }) });
  const body = await invalid.json();
  if (invalid.status !== 422 || body?.error?.code !== "VALIDATION_FAILED") throw new Error("structured_input_validation_failed");
  results.push({ mode: "disabled", status: first.status, state: preflight.data.state, invalidStructuredStatus: invalid.status });
});

await withServer("preferred", 4312, async ({ first }) => {
  const body = await first.json();
  if (first.status !== 200 || body?.data?.state !== "unavailable" || body?.data?.fallbackAvailable !== true) throw new Error("preferred_contract_failed");
  results.push({ mode: "preferred", status: first.status, state: body.data.state });
});

await withServer("required", 4313, async ({ first }) => {
  const body = await first.json();
  if (first.status !== 503 || body?.error?.code !== "AI_REQUIRED_UNAVAILABLE") throw new Error("required_contract_failed");
  results.push({ mode: "required", status: first.status, error: body.error.code });
});

process.stdout.write(`${JSON.stringify({ ok: true, results })}\n`);
