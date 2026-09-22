import { execFileSync, spawn } from "node:child_process";
import { readFile, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const appPort = 3032;
const debugPort = 9572;
const baseUrl = `http://localhost:${appPort}`;
const configuredArtifacts = process.env.PHASE2_ARTIFACT_DIR;
const artifacts = configuredArtifacts ? path.resolve(configuredArtifacts) : await mkdtemp(path.join(tmpdir(), "majupilot-phase2-artifacts-"));
const profile = await mkdtemp(path.join(tmpdir(), "majupilot-phase2-profile-"));
const uuid = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const draft = {
  schemaVersion: "1.0.0", sessionId: "assessment_phase020001", status: "ready_for_review", currentStep: 6, twinRevision: 1,
  answers: {
    q1: { businessName: "Synthetic Phase 2 Café", industry: "food_beverage", businessModel: "b2c", employeeBand: "25_49", description: "A fictional Malaysian café group used only for bounded browser verification." },
    q2: { websiteOrStore: "active", businessEmail: "not_used", cloudProductivity: "informal", crm: "not_used", digitalMarketingAnalytics: "active", backup: "not_used", cybersecurityControls: "informal", aiTools: "not_used" },
    q3: { biggestChallenge: "customer_management", manualWorkflow: "Synthetic messaging orders", manualHoursPerWeek: null, affectedEmployees: 8, urgency: 4 },
    q4: { primaryObjective: "increase_revenue", budgetBand: "5k_15k", implementationPace: "1_3_months", highestConcern: "cost" },
    q5: { leadershipSponsorship: 4, usableData: 2, employeeDigitalSkills: 3, processConsistency: 2, changeWillingness: 4 },
  },
  selectedFollowUpIds: ["fu_manual_hours", "fu_customer_records", "fu_backup_frequency"],
  followUpAnswers: { fu_manual_hours: "11_20", fu_customer_records: "messaging_apps", fu_backup_frequency: "none" },
  updatedAt: "2026-09-22T12:00:00+08:00",
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const stopTree = (child) => {
  if (!child?.pid) return;
  try { execFileSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true }); }
  catch { try { child.kill(); } catch {} }
};

let server;
let chrome;
let ws;
let syncMode = "success";
const syncBodies = [];
const consoleErrors = [];
const failedRequests = [];
try {
  await mkdir(artifacts, { recursive: true });
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--port", String(appPort)], {
    cwd: process.cwd(), env: { ...process.env, AI_EXECUTION_MODE: "disabled", AI_GATEWAY_MODEL: "", AI_GATEWAY_API_KEY: "", VERCEL_OIDC_TOKEN: "" },
    stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
  });
  let serverOutput = "";
  server.stdout.on("data", (value) => { serverOutput += value.toString(); });
  server.stderr.on("data", (value) => { serverOutput += value.toString(); });
  let serverReady = false;
  for (let attempt = 0; attempt < 120; attempt += 1) {
    try { if ((await fetch(baseUrl)).ok) { serverReady = true; break; } } catch {}
    await wait(500);
  }
  if (!serverReady) throw new Error(`Next.js did not start: ${serverOutput.slice(-2_500)}`);

  chrome = spawn(chromePath, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore", windowsHide: true });
  let endpoint;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const tabs = await fetch(`http://127.0.0.1:${debugPort}/json`).then((response) => response.json());
      endpoint = tabs.find((tab) => tab.type === "page")?.webSocketDebuggerUrl;
      if (endpoint) break;
    } catch {}
    await wait(200);
  }
  if (!endpoint) throw new Error("Chrome DevTools endpoint did not start");
  ws = new WebSocket(endpoint);
  await new Promise((resolve, reject) => { ws.addEventListener("open", resolve, { once: true }); ws.addEventListener("error", reject, { once: true }); });

  let nextId = 0;
  const pending = new Map();
  const cdp = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
  const fulfill = async (requestId, status, body) => cdp("Fetch.fulfillRequest", {
    requestId, responseCode: status,
    responseHeaders: [{ name: "Content-Type", value: "application/json" }, { name: "Cache-Control", value: "no-store" }],
    body: Buffer.from(JSON.stringify(body)).toString("base64"),
  });
  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const call = pending.get(message.id); pending.delete(message.id);
      if (message.error) call.reject(new Error(message.error.message)); else call.resolve(message.result);
    }
    if (message.method === "Runtime.exceptionThrown") consoleErrors.push(message.params.exceptionDetails.text);
    if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") consoleErrors.push(message.params.args.map((arg) => arg.value ?? arg.description).join(" "));
    if (message.method === "Network.loadingFailed" && message.params.errorText !== "net::ERR_ABORTED") failedRequests.push(message.params.errorText);
    if (message.method === "Fetch.requestPaused") {
      void (async () => {
        const { requestId, request } = message.params;
        const url = new URL(request.url);
        if (url.pathname === "/api/v2/guest/session") return fulfill(requestId, 201, { data: { guestSessionId: uuid(1), assessmentSessionId: uuid(2) } });
        if (url.pathname === "/api/v2/journey/sync") {
          syncBodies.push(JSON.parse(request.postData ?? "{}"));
          await wait(650);
          return syncMode === "success"
            ? fulfill(requestId, 201, { data: { assessmentSessionId: uuid(2), ids: syncBodies.at(-1).ids } })
            : fulfill(requestId, 503, { error: { code: "INTERNAL_RETRYABLE", requestId: "phase2-browser-sync-failure" } });
        }
        if (url.pathname === "/api/v2/copilot/status") return fulfill(requestId, 200, { data: { state: "deterministic_fallback", liveAvailable: false } });
        if (url.pathname === "/api/v2/copilot/sessions" && request.method === "POST") return fulfill(requestId, 201, { data: { id: uuid(50) } });
        if (/^\/api\/v2\/copilot\/sessions\/[^/]+\/messages$/.test(url.pathname)) return fulfill(requestId, 200, { data: { session: { id: uuid(50) }, messages: [] } });
        return cdp("Fetch.continueRequest", { requestId });
      })().catch((error) => consoleErrors.push(String(error)));
    }
  });

  const evaluate = async (expression) => {
    const result = await cdp("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
    return result.result.value;
  };
  const poll = async (expression, expected = true, timeout = 30_000) => {
    const started = Date.now(); let actual;
    while (Date.now() - started < timeout) {
      actual = await evaluate(expression);
      if (JSON.stringify(actual) === JSON.stringify(expected)) return actual;
      await wait(120);
    }
    throw new Error(`Timed out: ${expression}; actual=${JSON.stringify(actual)}`);
  };
  const navigate = async (url) => { await cdp("Page.navigate", { url }); await poll("document.readyState", "complete"); };
  const viewport = (width, height) => cdp("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 700 });
  const screenshot = async (name) => {
    const capture = await cdp("Page.captureScreenshot", { format: "png", fromSurface: true });
    await writeFile(path.join(artifacts, name), Buffer.from(capture.data, "base64"));
  };
  const audit = async (label, width) => ({
    label, width,
    overflow: await evaluate("Math.max(document.documentElement.scrollWidth,document.body.scrollWidth) > document.documentElement.clientWidth + 1"),
    minTarget: await evaluate("Math.min(...Array.from(document.querySelectorAll('a,button')).filter((el)=>{const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&!el.disabled}).map((el)=>Math.min(el.getBoundingClientRect().width,el.getBoundingClientRect().height)))"),
  });

  await cdp("Page.enable"); await cdp("Runtime.enable"); await cdp("Network.enable");
  await cdp("Fetch.enable", { patterns: [{ urlPattern: `${baseUrl}/api/v2/*`, requestStage: "Request" }] });
  await viewport(1440, 1000);
  await navigate(baseUrl);
  await evaluate(`localStorage.setItem("sme-growth-twin:assessment-draft:1.0.0", ${JSON.stringify(JSON.stringify(draft))})`);
  await navigate(`${baseUrl}/assessment/analysis`);
  await poll("location.pathname", "/results", 20_000);
  await evaluate("document.querySelector('a[href=\"/recommendations\"]')?.click()"); await poll("location.pathname", "/recommendations");
  await evaluate("document.querySelector('a[href=\"/scenarios\"]')?.click()"); await poll("location.pathname", "/scenarios");
  await poll("document.body.innerText.includes('Balanced Growth')");
  await evaluate("Array.from(document.querySelectorAll('.balanced_growth button')).find((button)=>button.textContent.includes('Select as preferred'))?.click()");
  await evaluate("document.querySelector('a[href=\"/blueprint\"]')?.click()"); await poll("location.pathname", "/blueprint");
  await poll("document.body.innerText.includes('No Blueprint has been generated')");
  await evaluate("Array.from(document.querySelectorAll('button')).find((button)=>button.textContent.includes('Generate advisor review and Blueprint'))?.click()");
  await poll("document.body.innerText.includes('Saving evidence')");
  const savingDidNotClaimReady = await evaluate("!document.body.innerText.includes('Your evidence is ready for Copilot.')");
  await poll("document.body.innerText.includes('Your evidence is ready for Copilot.')");
  const firstHref = await evaluate("document.querySelector('a[href^=\"/copilot?\"]')?.getAttribute('href')");
  if (!firstHref) throw new Error("ready state did not expose the Copilot deep link");
  await screenshot("ready-desktop.png");
  const responsive = [await audit("ready", 1440)];
  await viewport(390, 844); responsive.push(await audit("ready", 390)); await evaluate("document.querySelector('.phase02-handoff')?.scrollIntoView({block:'start'})"); await screenshot("ready-mobile.png");

  await viewport(1440, 1000);
  await evaluate("document.querySelector('a[href^=\"/copilot?\"]')?.click()");
  await poll("location.pathname", "/copilot");
  await poll("document.body.innerText.includes('Ask about your transformation plan')");
  const deepLink = await evaluate("({assessment:new URL(location.href).searchParams.get('assessmentSessionId'),blueprint:new URL(location.href).searchParams.get('blueprintId')})");
  await cdp("Page.reload", { ignoreCache: true });
  await poll("document.body.innerText.includes('Ask about your transformation plan')");
  const refreshResumed = true;
  await navigate(`${baseUrl}/copilot?assessmentSessionId=${uuid(99)}&blueprintId=${deepLink.blueprint}`);
  await poll("document.body.innerText.includes('does not match the current secure workspace')");
  const crossSessionDenied = await evaluate("!document.body.innerText.includes('Ask about your transformation plan')");

  await navigate(`${baseUrl}/blueprint`);
  await poll("document.body.innerText.includes('Your evidence is ready for Copilot.')");
  syncMode = "failure";
  await evaluate("Array.from(document.querySelectorAll('button')).find((button)=>button.textContent.includes('Regenerate review'))?.click()");
  await poll("document.body.innerText.includes('Retry sync')", true, 35_000);
  const failure = {
    noReadyClaim: await evaluate("!document.body.innerText.includes('Your evidence is ready for Copilot.')"),
    noCopilotAction: await evaluate("!document.querySelector('a[href^=\"/copilot?\"]')"),
  };
  await screenshot("sync-failure.png");
  syncMode = "success";
  await evaluate("Array.from(document.querySelectorAll('button')).find((button)=>button.textContent.includes('Retry sync'))?.click()");
  await poll("document.body.innerText.includes('Your evidence is ready for Copilot.')");
  const firstIds = syncBodies[0].ids;
  const failedIds = syncBodies[1].ids;
  const retriedIds = syncBodies[2].ids;
  const regeneration = { newArtifactSet: firstIds.blueprint !== failedIds.blueprint, retryReusedWriteSet: JSON.stringify(failedIds) === JSON.stringify(retriedIds) };

  const axeSource = await readFile(path.resolve("node_modules", "axe-core", "axe.min.js"), "utf8");
  await evaluate(axeSource);
  const axe = await evaluate("axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}}).then((r)=>r.violations.filter((v)=>v.impact==='critical'||v.impact==='serious').map((v)=>({id:v.id,impact:v.impact,nodes:v.nodes.length})))");
  const result = { ok: savingDidNotClaimReady && refreshResumed && crossSessionDenied && failure.noReadyClaim && failure.noCopilotAction && regeneration.newArtifactSet && regeneration.retryReusedWriteSet && axe.length === 0 && responsive.every((item) => !item.overflow && item.minTarget >= 44), synthetic: true, savingDidNotClaimReady, deepLink, refreshResumed, crossSessionDenied, failure, regeneration, syncAttempts: syncBodies.length, responsive, axe, consoleErrors, failedRequests };
  if (!result.ok || consoleErrors.length || failedRequests.length) throw new Error(`Phase 2 browser proof failed: ${JSON.stringify(result, null, 2)}`);
  await writeFile(path.join(artifacts, "browser-proof.json"), `${JSON.stringify(result, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({ ...result, artifacts }, null, 2)}\n`);
} finally {
  try { ws?.close(); } catch {}
  stopTree(chrome); stopTree(server);
  await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }).catch(() => undefined);
  if (!configuredArtifacts) await rm(artifacts, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }).catch(() => undefined);
}
