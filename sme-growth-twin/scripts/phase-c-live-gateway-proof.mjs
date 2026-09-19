import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import process from "node:process";

import { createClient } from "@supabase/supabase-js";

const required = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_SECRET_KEY", "MAJUPILOT_GUEST_TOKEN_PEPPER", "PHASE_C_EXPECTED_MODEL"];
for (const name of required) if (!process.env[name]) throw new Error(`Missing ${name}`);

const port = 3113;
const baseUrl = `http://127.0.0.1:${port}`;
const marker = `SENSITIVE_PHASE_C_${crypto.randomUUID()}`;
const expectedModel = process.env.PHASE_C_EXPECTED_MODEL;

async function startServer() {
  const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "-p", String(port)], {
    cwd: process.cwd(),
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let diagnostics = "";
  child.stdout.on("data", (chunk) => { diagnostics += String(chunk).slice(0, 2_000); });
  child.stderr.on("data", (chunk) => { diagnostics += String(chunk).slice(0, 2_000); });
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`Next exited before proof: ${diagnostics.slice(-800)}`);
    try {
      const response = await fetch(`${baseUrl}/api/v2/ai/preflight`);
      if (response.status < 500) return child;
      const body = await response.json().catch(() => null);
      throw new Error(`Preflight failed safely: ${response.status}:${body?.error?.code ?? "unknown"}`);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("Preflight failed safely")) throw error;
      await delay(500);
    }
  }
  child.kill();
  throw new Error(`Next did not become ready: ${diagnostics.slice(-800)}`);
}

async function stopServer(child) {
  child.kill("SIGTERM");
  await Promise.race([new Promise((resolve) => child.once("exit", resolve)), delay(5_000)]);
  if (child.exitCode === null) child.kill("SIGKILL");
}

const post = (path, body, cookie) => fetch(`${baseUrl}${path}`, {
  method: "POST",
  headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
  body: JSON.stringify(body),
});

const server = await startServer();
try {
  const guestResponse = await post("/api/v2/guest/session", {});
  if (guestResponse.status !== 201) throw new Error(`Guest setup failed: ${guestResponse.status}`);
  const cookie = guestResponse.headers.get("set-cookie")?.split(";")[0];
  const receipt = (await guestResponse.json()).data;
  if (!cookie || !receipt?.assessmentSessionId) throw new Error("Guest setup returned an incomplete receipt");

  const followUpResponse = await post("/api/v2/assessment/follow-up", {
    assessmentSessionId: receipt.assessmentSessionId,
    answers: {
      q1: { businessName: `Synthetic ${marker}`, industry: "professional_services", businessModel: "b2b", employeeBand: "10_24", description: `Synthetic proof only ${marker}` },
      q2: { websiteOrStore: "informal", businessEmail: "active", cloudProductivity: "active", crm: "active", digitalMarketingAnalytics: "informal", backup: "active", cybersecurityControls: "informal", aiTools: "not_used" },
      q3: { biggestChallenge: "manual_work", manualWorkflow: `Synthetic workflow ${marker}`, manualHoursPerWeek: null, affectedEmployees: 3, urgency: 4 },
      q4: { primaryObjective: "reduce_cost", budgetBand: "5k_15k", implementationPace: "1_3_months", highestConcern: "cost" },
      q5: { leadershipSponsorship: 4, usableData: 4, employeeDigitalSkills: 4, processConsistency: 4, changeWillingness: 4 },
    },
    answeredIntents: [],
    evidenceRefs: [],
  }, cookie);
  const followUpBody = await followUpResponse.json().catch(() => null);
  if (followUpResponse.status !== 200 || followUpBody?.data?.state !== "live" || followUpBody?.data?.model !== expectedModel) {
    throw new Error(`Live follow-up failed safely: ${followUpResponse.status}:${followUpBody?.error?.code ?? followUpBody?.data?.state ?? "unknown"}`);
  }

  const database = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: row, error } = await database.from("model_calls").select("*").eq("assessment_session_id", receipt.assessmentSessionId).eq("operation", "assessment_follow_up").order("created_at", { ascending: false }).limit(1).single();
  if (error || !row) throw new Error("Persisted model-call telemetry was not found");
  const allowedColumns = new Set(["id", "assessment_session_id", "organization_id", "operation", "provider", "model", "schema_version", "prompt_version", "started_at", "completed_at", "latency_ms", "input_tokens", "output_tokens", "estimated_cost", "retry_count", "outcome", "safe_error_code", "evidence_ids", "created_at"]);
  const unexpectedColumns = Object.keys(row).filter((key) => !allowedColumns.has(key));
  const serialized = JSON.stringify(row);
  if (unexpectedColumns.length || serialized.includes(marker)) throw new Error("Telemetry contains an unexpected or raw payload field");
  if (row.outcome !== "success" || row.provider !== "vercel_ai_gateway" || row.model !== expectedModel) throw new Error("Telemetry identity or outcome mismatch");
  if (!Number.isInteger(row.input_tokens) || row.input_tokens <= 0 || !Number.isInteger(row.output_tokens) || row.output_tokens <= 0) throw new Error("Telemetry token counts are missing");
  if (!Number.isFinite(Number(row.estimated_cost)) || Number(row.estimated_cost) <= 0 || !Number.isInteger(row.latency_ms) || row.latency_ms <= 0) throw new Error("Telemetry cost or latency is missing");

  process.stdout.write(`${JSON.stringify({ ok: true, responseState: followUpBody.data.state, operation: row.operation, outcome: row.outcome, provider: row.provider, model: row.model, inputTokens: row.input_tokens, outputTokens: row.output_tokens, estimatedCostUsd: Number(row.estimated_cost), latencyMs: row.latency_ms, retryCount: row.retry_count, rawPayloadPersisted: false, unexpectedColumns: [] })}\n`);
} finally {
  await stopServer(server);
}
