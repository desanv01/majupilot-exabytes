import { spawnSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";

const baseUrl = (process.env.MAJUPILOT_RELEASE_BASE_URL || "").replace(/\/$/, "");
const vercelVersion = process.env.MAJUPILOT_VERCEL_CLI_VERSION || "59.25.0";
if (!baseUrl) throw new Error("MAJUPILOT_RELEASE_BASE_URL is required");
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) throw new Error("hosted Supabase admin configuration is required");

const npx = process.platform === "win32" ? process.execPath : "npx";
const npxPrefix = process.platform === "win32" ? [path.join(path.dirname(process.execPath), "node_modules", "npm", "bin", "npx-cli.js")] : [];
const temp = await mkdtemp(path.join(tmpdir(), "majupilot-phase1-hosted-"));
const firstJar = path.join(temp, "first.cookies.txt");
const secondJar = path.join(temp, "second.cookies.txt");
function request(pathname, { method = "GET", body, cookieJar = firstJar } = {}) {
  const url = new URL(pathname, `${baseUrl}/`).toString();
  const curlArgs = [
    "--silent", "--show-error", "--location", "--include",
    "--cookie", cookieJar, "--cookie-jar", cookieJar,
    "--request", method,
  ];
  if (body !== undefined) curlArgs.push("--header", "Content-Type: application/json", "--data-binary", JSON.stringify(body));
  const result = spawnSync(npx, [...npxPrefix, "--yes", `vercel@${vercelVersion}`, "curl", url, "--", ...curlArgs], {
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1" },
    maxBuffer: 4 * 1024 * 1024,
    windowsHide: true,
  });
  if (result.status !== 0) throw new Error(`vercel curl failed for ${pathname}: ${String(result.error?.message || result.stderr || result.stdout || "unknown process failure").slice(-1_000)}`);
  const blocks = result.stdout.split(/\r?\n\r?\n/);
  const headerIndex = blocks.findLastIndex((block) => /^HTTP\/\S+ \d{3}/.test(block));
  if (headerIndex < 0) throw new Error(`missing HTTP headers for ${pathname}: ${result.stdout.slice(0, 240)}`);
  const status = Number(blocks[headerIndex].match(/^HTTP\/\S+ (\d{3})/)?.[1]);
  const rawBody = blocks.slice(headerIndex + 1).join("\n\n").trim();
  let parsed;
  try { parsed = rawBody ? JSON.parse(rawBody) : null; }
  catch { throw new Error(`non-JSON response for ${pathname}: ${rawBody.slice(0, 240)}`); }
  return { status, body: parsed };
}

const expectStatus = (result, status, label) => {
  if (result.status !== status) throw new Error(`${label} returned HTTP ${result.status}: ${JSON.stringify(result.body).slice(0, 600)}`);
  return result.body?.data;
};

const artifact = (kind, id, assessmentSessionId, payload, sourceArtifactIds, links, revision) => ({
  artifact: {
    kind, id, assessmentSessionId, payload,
    ...(revision === undefined ? {} : { revision }),
    schemaVersion: "1.0.0",
    rulePackVersion: "1.0.0",
    sourceArtifactIds,
    links,
  },
});

try {
  const status = expectStatus(request("/api/v2/copilot/status?detail=safe"), 200, "Copilot status");
  if (status.state !== "live" || !status.liveAvailable || status.model !== "deepseek/deepseek-v4.1-flash") throw new Error("preview Copilot is not live on the approved model");

  const first = expectStatus(request("/api/v2/guest/session", { method: "POST", body: {} }), 201, "first guest session");
  const runId = crypto.randomUUID();
  const twinId = crypto.randomUUID();
  const evidenceId = crypto.randomUUID();
  const diagnosticId = crypto.randomUUID();
  const recommendationId = crypto.randomUUID();
  const comparisonId = crypto.randomUUID();
  const scenarioRevisionId = crypto.randomUUID();
  const blueprintId = crypto.randomUUID();

  expectStatus(request("/api/v2/artifacts", { method: "POST", body: artifact("business_twins", twinId, first.assessmentSessionId, { identity: { businessName: `Synthetic Phase 1 Hosted ${runId}` }, constraints: { budgetBand: "5k_15k" } }, [], {}, 1) }), 201, "Business Twin");
  expectStatus(request("/api/v2/artifacts", { method: "POST", body: artifact("evidence_items", evidenceId, first.assessmentSessionId, { sourceKind: "user_fact", sourceRef: `phase1-hosted.${runId}`, value: "Synthetic hosted Copilot evidence" }, [], { businessTwinId: twinId }, 1) }), 201, "evidence");
  expectStatus(request("/api/v2/artifacts", { method: "POST", body: artifact("diagnostic_runs", diagnosticId, first.assessmentSessionId, { digitalMaturity: { score: 42 }, aiReadiness: { score: 31 }, painPoints: [{ id: "manual-orders", evidenceRefs: [evidenceId] }] }, [twinId, evidenceId], { businessTwinId: twinId }) }), 201, "diagnostic");
  expectStatus(request("/api/v2/artifacts", { method: "POST", body: artifact("recommendation_runs", recommendationId, first.assessmentSessionId, { recommendations: [{ capabilityId: "crm", priority: 1, evidenceRefs: [evidenceId] }] }, [diagnosticId, evidenceId], { businessTwinId: twinId, diagnosticRunId: diagnosticId }) }), 201, "recommendations");
  expectStatus(request("/api/v2/artifacts", { method: "POST", body: artifact("scenario_comparisons", comparisonId, first.assessmentSessionId, {}, [recommendationId], { businessTwinId: twinId, recommendationRunId: recommendationId }) }), 201, "scenario comparison");
  expectStatus(request("/api/v2/artifacts", { method: "POST", body: artifact("scenario_revisions", scenarioRevisionId, first.assessmentSessionId, { assumptions: { budget: 10000 }, results: { paybackMonths: 12 } }, [comparisonId], { scenarioComparisonId: comparisonId }, 1) }), 201, "scenario revision");
  expectStatus(request("/api/v2/artifacts", { method: "POST", body: artifact("blueprints", blueprintId, first.assessmentSessionId, { title: "Synthetic Phase 1 Hosted Blueprint", priorities: [{ capabilityId: "crm", evidenceRefs: [evidenceId] }] }, [twinId, diagnosticId, recommendationId, scenarioRevisionId, evidenceId], { businessTwinId: twinId, diagnosticRunId: diagnosticId, recommendationRunId: recommendationId, scenarioRevisionId }, 1) }), 201, "Blueprint");

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const before = await supabase.from("evidence_items").select("id,assessment_session_id,source_kind,source_ref,payload,schema_version,created_at").eq("id", evidenceId).single();
  if (before.error || !before.data) throw new Error(`synthetic evidence lookup failed: ${before.error?.message ?? "not found"}`);

  const session = expectStatus(request("/api/v2/copilot/sessions", { method: "POST", body: { assessmentSessionId: first.assessmentSessionId, businessTwinId: twinId, blueprintId, idempotencyKey: `phase1-hosted-session:${runId}` } }), 201, "Copilot session");
  const turnRequest = {
    message: `Use getEvidenceForClaim with evidenceId ${evidenceId}, then getBusinessTwinSummary with businessTwinId ${twinId}. Summarize only grounded facts and cite both artifact IDs.`,
    idempotencyKey: `phase1-hosted-turn:${runId}`,
  };
  const turn = expectStatus(request(`/api/v2/copilot/sessions/${session.id}/turns`, { method: "POST", body: turnRequest }), 200, "live Copilot turn");
  const toolNames = turn.toolCalls?.map((call) => call.toolName) ?? [];
  if (turn.state !== "live" || turn.model !== "deepseek/deepseek-v4.1-flash" || !toolNames.includes("getEvidenceForClaim") || !toolNames.includes("getBusinessTwinSummary")) throw new Error(`live grounded tool contract failed: ${JSON.stringify({ state: turn.state, model: turn.model, toolNames })}`);

  const historyBeforeReplay = expectStatus(request(`/api/v2/copilot/sessions/${session.id}/messages`), 200, "history before replay");
  const replay = expectStatus(request(`/api/v2/copilot/sessions/${session.id}/turns`, { method: "POST", body: turnRequest }), 200, "live turn replay");
  const historyAfterReplay = expectStatus(request(`/api/v2/copilot/sessions/${session.id}/messages`), 200, "history after replay");
  if (replay.turnId !== turn.turnId || replay.text !== turn.text || historyAfterReplay.messages.length !== historyBeforeReplay.messages.length) throw new Error("same-key hosted replay duplicated or changed the durable turn");

  const failure = request("/api/v2/copilot/sessions/00000000-0000-4000-8000-000000000099/turns", { method: "POST", body: { message: "Synthetic hosted session failure probe", idempotencyKey: `phase1-hosted-failure:${runId}` } });
  if (failure.status !== 404 || failure.body?.error?.category !== "session_failure" || !failure.body?.error?.requestId || failure.body.error.retryable !== false) throw new Error(`safe hosted failure envelope contract failed: ${JSON.stringify(failure)}`);

  expectStatus(request("/api/v2/guest/session", { method: "POST", body: {}, cookieJar: secondJar }), 201, "second guest session");
  const crossSession = request(`/api/v2/copilot/sessions/${session.id}/messages`, { cookieJar: secondJar });
  if (![403, 404].includes(crossSession.status)) throw new Error(`cross-session history read returned HTTP ${crossSession.status}`);

  const after = await supabase.from("evidence_items").select("id,assessment_session_id,source_kind,source_ref,payload,schema_version,created_at").eq("id", evidenceId).single();
  if (after.error || JSON.stringify(after.data) !== JSON.stringify(before.data)) throw new Error("hosted failure/replay probes mutated deterministic evidence");

  process.stdout.write(`${JSON.stringify({
    ok: true,
    baseUrl,
    runId,
    synthetic: { assessmentSessionId: first.assessmentSessionId, businessTwinId: twinId, evidenceId, blueprintId, copilotSessionId: session.id },
    live: { state: turn.state, model: turn.model, turnId: turn.turnId, toolNames },
    replay: { stable: true, messageCount: historyAfterReplay.messages.length },
    safeSessionFailure: { category: failure.body.error.category, requestId: failure.body.error.requestId, retryable: failure.body.error.retryable },
    crossSessionDenied: true,
    deterministicEvidenceMutated: false,
  }, null, 2)}\n`);
} finally {
  await rm(temp, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }).catch(() => undefined);
}
