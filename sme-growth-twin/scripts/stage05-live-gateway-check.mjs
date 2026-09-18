import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";

const expectedAdvisors = ["growth", "operations", "finance", "cybersecurity", "change"];
const expectedFigures = {
  costs: { low: 9200, base: 18400, high: 27600 },
  operational: { status: "estimated", range: { low: 2358, base: 7254, high: 15233 }, formula: "weekly hours saved × 52 × loaded hourly cost" },
  net: { status: "estimated", range: { low: -25242, base: -11146, high: 6033 }, formula: "low gross − high cost; base gross − base cost; high gross − low cost" },
  payback: { status: "estimated", best: 7.2, base: 30.4, worst: 140.5 },
  budgetFit: "only_low_within",
  revenue: "not_estimated",
  avoidedRisk: "not_estimated",
  committed: 4,
};
const model = process.env.AI_GATEWAY_MODEL?.trim();
const credentialAvailable = Boolean(process.env.AI_GATEWAY_API_KEY?.trim() || process.env.VERCEL_OIDC_TOKEN?.trim());
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const equal = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class HarnessError extends Error {
  constructor(code) { super(code); this.code = code; }
}

const fail = (code) => { throw new HarnessError(code); };
const freePort = () => new Promise((resolve, reject) => {
  const probe = createServer();
  probe.unref();
  probe.once("error", reject);
  probe.listen(0, "127.0.0.1", () => {
    const address = probe.address();
    if (!address || typeof address === "string") { probe.close(); reject(new Error("port_unavailable")); return; }
    probe.close((error) => error ? reject(error) : resolve(address.port));
  });
});

function safeAdvisorDiagnostics(blueprint) {
  if (!blueprint || !Array.isArray(blueprint.modelCalls) || !Array.isArray(blueprint.advisorReviews)) return [];
  return expectedAdvisors.map((advisor) => {
    const call = blueprint.modelCalls.find((item) => item.advisor === advisor);
    const review = blueprint.advisorReviews.find((item) => item.advisor === advisor);
    return {
      advisor,
      callStatus: call?.status ?? "missing",
      provider: call?.provider ?? "missing",
      model: call?.model ?? "missing",
      retryCount: call?.retryCount ?? null,
      latencyMs: call?.latencyMs ?? null,
      evidenceCount: Array.isArray(call?.evidenceIds) ? call.evidenceIds.length : 0,
      reviewOrigin: review?.origin ?? "missing",
      reviewPosition: review?.position ?? "missing",
    };
  });
}

async function run() {
  const appPort = await freePort(); const debugPort = await freePort(); const baseUrl = `http://127.0.0.1:${appPort}`;
  const profile = path.join(tmpdir(), `sme-growth-twin-stage05-live-${process.pid}-${Date.now()}`);
  let server; let chrome; let ws; let blueprint; let failureCode = "unexpected_harness_failure";
  try {
    let serverSpawnFailed = false;
    server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", String(appPort)], { cwd: process.cwd(), env: { ...process.env }, stdio: "ignore", windowsHide: true });
    server.once("error", () => { serverSpawnFailed = true; });
    let ready = false;
    for (let attempt = 0; attempt < 120; attempt += 1) {
      if (serverSpawnFailed || server.exitCode !== null) fail("next_server_exited");
      try { if ((await fetch(baseUrl, { signal: AbortSignal.timeout(1_000) })).ok) { ready = true; break; } } catch {}
      await wait(500);
    }
    if (!ready) fail("next_server_start_timeout");

    let chromeSpawnFailed = false;
    chrome = spawn(chromePath, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore", windowsHide: true });
    chrome.once("error", () => { chromeSpawnFailed = true; });
    let endpoint;
    for (let attempt = 0; attempt < 50; attempt += 1) {
      if (chromeSpawnFailed || chrome.exitCode !== null) fail("chrome_exited");
      try { const tabs = await fetch(`http://127.0.0.1:${debugPort}/json`, { signal: AbortSignal.timeout(1_000) }).then((response) => response.json()); endpoint = tabs.find((tab) => tab.type === "page")?.webSocketDebuggerUrl; if (endpoint) break; } catch {}
      await wait(200);
    }
    if (!endpoint) fail("chrome_start_timeout");

    ws = new WebSocket(endpoint);
    await Promise.race([
      new Promise((resolve, reject) => { ws.addEventListener("open", resolve, { once: true }); ws.addEventListener("error", reject, { once: true }); }),
      wait(10_000).then(() => fail("chrome_websocket_timeout")),
    ]);
    let nextId = 0; const pending = new Map(); const consoleErrors = []; const advisorResponses = [];
    ws.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id && pending.has(message.id)) { const call = pending.get(message.id); pending.delete(message.id); clearTimeout(call.timer); if (message.error) call.reject(new HarnessError("cdp_command_failed")); else call.resolve(message.result); }
      if (message.method === "Runtime.exceptionThrown") consoleErrors.push("exception");
      if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") consoleErrors.push("console_error");
      if (message.method === "Network.responseReceived" && new URL(message.params.response.url).pathname === "/api/advisors/review") advisorResponses.push(message.params.response.status);
    });
    const cdp = (method, params = {}) => new Promise((resolve, reject) => { const callId = ++nextId; const timer = setTimeout(() => { pending.delete(callId); reject(new HarnessError("cdp_command_timeout")); }, 15_000); pending.set(callId, { resolve, reject, timer }); ws.send(JSON.stringify({ id: callId, method, params })); });
    const evaluate = async (expression) => { const result = await cdp("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }); if (result.exceptionDetails) fail("browser_evaluation_failed"); return result.result.value; };
    const poll = async (expression, expected, timeout = 20_000) => { const started = Date.now(); while (Date.now() - started < timeout) { if (await evaluate(expression) === expected) return; await wait(150); } fail("browser_poll_timeout"); };
    const navigate = async (url) => { await cdp("Page.navigate", { url }); await poll("document.readyState", "complete"); };

    await cdp("Page.enable"); await cdp("Runtime.enable"); await cdp("Network.enable"); await cdp("Log.enable");
    await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false }); await navigate(baseUrl);
    const draft = { schemaVersion: "1.0.0", sessionId: "assessment_live050001", status: "ready_for_review", currentStep: 6, twinRevision: 1, answers: { q1: { businessName: "Kopi Kita Café Group", industry: "food_beverage", businessModel: "b2c", employeeBand: "25_49", description: "Three Malaysian café outlets serving walk-in and catering customers." }, q2: { websiteOrStore: "active", businessEmail: "not_used", cloudProductivity: "informal", crm: "not_used", digitalMarketingAnalytics: "active", backup: "not_used", cybersecurityControls: "informal", aiTools: "not_used" }, q3: { biggestChallenge: "customer_management", manualWorkflow: "WhatsApp orders and catering enquiries", manualHoursPerWeek: null, affectedEmployees: 8, urgency: 4 }, q4: { primaryObjective: "increase_revenue", budgetBand: "5k_15k", implementationPace: "1_3_months", highestConcern: "cost" }, q5: { leadershipSponsorship: 4, usableData: 2, employeeDigitalSkills: 3, processConsistency: 2, changeWillingness: 4 } }, selectedFollowUpIds: ["fu_manual_hours", "fu_customer_records", "fu_backup_frequency"], followUpAnswers: { fu_manual_hours: "11_20", fu_customer_records: "messaging_apps", fu_backup_frequency: "none" }, updatedAt: "2026-09-18T09:00:00+08:00" };
    await evaluate(`localStorage.setItem("sme-growth-twin:assessment-draft:1.0.0", ${JSON.stringify(JSON.stringify(draft))})`);
    await navigate(`${baseUrl}/assessment/analysis`); await poll("location.pathname", "/results", 20_000);
    await evaluate("document.querySelector('a[href=\"/recommendations\"]')?.click()"); await poll("location.pathname", "/recommendations"); await poll("document.body.innerText.includes('Compare transformation scenarios')", true);
    await evaluate("document.querySelector('a[href=\"/scenarios\"]')?.click()"); await poll("location.pathname", "/scenarios"); await poll("document.body.innerText.includes('Balanced Growth')", true);
    await evaluate("Array.from(document.querySelectorAll('.balanced_growth button')).find(button=>button.textContent.includes('Select as preferred'))?.click()"); await wait(200);
    await evaluate("document.querySelector('a[href=\"/blueprint\"]')?.click()"); await poll("location.pathname", "/blueprint"); await poll("document.body.innerText.includes('No Blueprint has been generated')", true);
    await evaluate("Array.from(document.querySelectorAll('button')).find(button=>button.textContent.includes('Generate advisor review and Blueprint'))?.click()");
    await poll("localStorage.getItem('sme-growth-twin:blueprint:1.0.0') !== null", true, 45_000); await poll("document.body.innerText.includes('Five advisor reviews')", true, 10_000);
    blueprint = JSON.parse(await evaluate("localStorage.getItem('sme-growth-twin:blueprint:1.0.0')"));

    const selected = blueprint.snapshot.selectedScenario;
    const figures = { costs: selected.costs.firstYear, operational: selected.value.operational, net: selected.value.net, payback: selected.value.payback, budgetFit: selected.budgetFit, revenue: selected.value.revenue.status, avoidedRisk: selected.value.avoidedRisk.status, committed: selected.interventions.filter((item) => item.commitment === "committed").length };
    const callOrder = blueprint.modelCalls.map((call) => call.advisor); const reviewOrder = blueprint.advisorReviews.map((review) => review.advisor);
    const callsValid = blueprint.modelCalls.length === 5 && blueprint.modelCalls.every((call) => call.provider === "vercel_ai_gateway" && call.model === model && call.status === "success" && call.errorCategory === "none");
    const reviewsValid = blueprint.advisorReviews.length === 5 && blueprint.advisorReviews.every((review) => review.origin === "model");
    const overlay = await evaluate("Boolean(document.querySelector('[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay'))");
    if (advisorResponses.length !== 1 || advisorResponses[0] !== 200) fail("advisor_api_request_failed");
    if (!equal(callOrder, expectedAdvisors) || !equal(reviewOrder, expectedAdvisors)) fail("advisor_order_mismatch");
    if (!callsValid || !reviewsValid) fail("live_gateway_acceptance_failed");
    if (!equal(figures, expectedFigures) || selected.templateId !== "balanced_growth") fail("trusted_figures_changed");
    if (consoleErrors.length || overlay) fail("browser_error_detected");

    const blueprintId = blueprint.id; await cdp("Page.reload", { ignoreCache: true }); await poll("document.body.innerText.includes('Five advisor reviews')", true, 20_000);
    const restoredBlueprintId = JSON.parse(await evaluate("localStorage.getItem('sme-growth-twin:blueprint:1.0.0')")).id;
    if (restoredBlueprintId !== blueprintId) fail("blueprint_persistence_failed");
    const restoredOverlay = await evaluate("Boolean(document.querySelector('[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay'))");
    if (consoleErrors.length || restoredOverlay) fail("browser_error_detected");
    console.log(JSON.stringify({ ok: true, blueprintId, restoredBlueprintId, advisors: safeAdvisorDiagnostics(blueprint), trustedFigures: figures }));
  } catch (error) {
    failureCode = error instanceof HarnessError ? error.code : failureCode;
    console.error(JSON.stringify({ ok: false, error: failureCode, advisors: safeAdvisorDiagnostics(blueprint) }));
    process.exitCode = 1;
  } finally {
    try { ws?.close(); } catch {}
    try { chrome?.kill(); } catch {}
    try { server?.kill(); } catch {}
  }
}

if (!model || !credentialAvailable) {
  console.error(JSON.stringify({ ok: false, error: "missing_gateway_configuration", advisors: [] }));
  process.exitCode = 1;
} else {
  await run();
}
