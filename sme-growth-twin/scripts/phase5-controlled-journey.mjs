import { execFileSync, spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const appPort = 3045;
const debugPort = 9585;
const baseUrl = `http://127.0.0.1:${appPort}`;
const chromePath = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const artifactOverride = process.env.PHASE5_ARTIFACT_DIR?.trim();
const artifacts = artifactOverride ? path.resolve(artifactOverride) : await mkdtemp(path.join(tmpdir(), "majupilot-phase5-"));
const profile = await mkdtemp(path.join(tmpdir(), "majupilot-phase5-chrome-"));
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const requirePass = (condition, message) => { if (!condition) throw new Error(message); };
const stopTree = (child) => {
  if (!child?.pid) return;
  try { execFileSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true }); }
  catch { try { child.kill(); } catch {} }
};

const status = spawnSync(process.execPath, ["node_modules/supabase/dist/supabase.js", "status", "-o", "env"], {
  cwd: process.cwd(), encoding: "utf8", windowsHide: true, maxBuffer: 4 * 1024 * 1024,
});
requirePass(status.status === 0, "Loopback Supabase is required");
const local = Object.fromEntries(status.stdout.split(/\r?\n/).map((line) => line.match(/^([A-Z0-9_]+)="?(.*?)"?$/)).filter(Boolean).map((match) => [match[1], match[2].replace(/"$/, "")]));
requirePass(["127.0.0.1", "localhost"].includes(new URL(local.API_URL).hostname), "Supabase must be loopback");
requirePass(Boolean(process.env.AI_GATEWAY_API_KEY && process.env.AI_GATEWAY_MODEL), "Configured live Gateway is required");
const serverEnv = {
  ...process.env,
  NEXT_PUBLIC_SUPABASE_URL: local.API_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: local.PUBLISHABLE_KEY || local.ANON_KEY,
  SUPABASE_SECRET_KEY: local.SECRET_KEY || local.SERVICE_ROLE_KEY,
  MAJUPILOT_GUEST_TOKEN_PEPPER: `phase5-${crypto.randomUUID()}`,
  AI_EXECUTION_MODE: "preferred",
  NEXT_TELEMETRY_DISABLED: "1",
};

let server;
let chrome;
let ws;
const consoleErrors = [];
const failedRequests = [];
const checks = {};
try {
  await mkdir(artifacts, { recursive: true });
  if (process.env.PHASE5_SKIP_BUILD !== "1") execFileSync(process.execPath, ["node_modules/next/dist/bin/next", "build"], {
    cwd: process.cwd(), env: serverEnv, stdio: "inherit", windowsHide: true,
  });
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--port", String(appPort)], {
    cwd: process.cwd(), env: serverEnv, stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
  });
  let serverOutput = "";
  server.stdout.on("data", (value) => { serverOutput += String(value).slice(-2000); });
  server.stderr.on("data", (value) => { serverOutput += String(value).slice(-2000); });
  let ready = false;
  for (let attempt = 0; attempt < 120; attempt += 1) {
    try { if ((await fetch(baseUrl)).ok) { ready = true; break; } } catch {}
    await wait(500);
  }
  requirePass(ready, `Local production server failed: ${serverOutput.slice(-1200)}`);

  chrome = spawn(chromePath, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore", windowsHide: true });
  let endpoint;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try { endpoint = (await fetch(`http://127.0.0.1:${debugPort}/json`).then((r) => r.json())).find((tab) => tab.type === "page")?.webSocketDebuggerUrl; if (endpoint) break; } catch {}
    await wait(250);
  }
  requirePass(Boolean(endpoint), "Chrome DevTools did not start");
  ws = new WebSocket(endpoint);
  await new Promise((resolve, reject) => { ws.addEventListener("open", resolve, { once: true }); ws.addEventListener("error", reject, { once: true }); });
  const pending = new Map();
  let nextId = 0;
  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const call = pending.get(message.id); pending.delete(message.id);
      if (message.error) call.reject(new Error(message.error.message)); else call.resolve(message.result);
    }
    if (message.method === "Runtime.exceptionThrown") consoleErrors.push(message.params.exceptionDetails.text);
    if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") consoleErrors.push("console_error");
    if (message.method === "Network.responseReceived" && ["XHR", "Fetch"].includes(message.params.type) && message.params.response.url.startsWith(baseUrl) && message.params.response.status >= 400) failedRequests.push(`${message.params.response.status} ${new URL(message.params.response.url).pathname}`);
  });
  const cdp = (method, params = {}) => new Promise((resolve, reject) => { const id = ++nextId; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); });
  const evaluate = async (expression) => { const result = await cdp("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }); if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text); return result.result.value; };
  const poll = async (expression, expected, timeout = 50_000) => { const start = Date.now(); let actual; while (Date.now() - start < timeout) { actual = await evaluate(expression); if (actual === expected) return; await wait(150); } throw new Error(`Timed out waiting for ${expression}; actual=${JSON.stringify(actual)}`); };
  const navigate = async (route) => { await cdp("Page.navigate", { url: `${baseUrl}${route}` }); await poll("document.readyState", "complete"); };
  const click = async (selector) => { const found = await evaluate(`(() => { const e=document.querySelector(${JSON.stringify(selector)}); if(!e)return false; e.click(); return true; })()`); requirePass(found, `Missing control ${selector}`); };
  const clickText = async (label) => { const found = await evaluate(`(() => { const e=[...document.querySelectorAll('button,a')].find(x=>(x.textContent||'').includes(${JSON.stringify(label)})); if(!e)return false; e.click(); return true; })()`); requirePass(found, `Missing action ${label}`); };
  const input = async (selector, value) => { const found = await evaluate(`(() => { const e=document.querySelector(${JSON.stringify(selector)}); if(!e)return false; const p=e instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(p,'value').set.call(e,${JSON.stringify(value)}); e.dispatchEvent(new Event('input',{bubbles:true})); return true; })()`); requirePass(found, `Missing input ${selector}`); };
  const select = async (selector, value) => { const found = await evaluate(`(() => { const e=document.querySelector(${JSON.stringify(selector)}); if(!e)return false; e.value=${JSON.stringify(value)}; e.dispatchEvent(new Event('change',{bubbles:true})); return true; })()`); requirePass(found, `Missing selection ${selector}`); };
  const screenshot = async (name) => { const capture = await cdp("Page.captureScreenshot", { format: "png", fromSurface: true }); await writeFile(path.join(artifacts, name), Buffer.from(capture.data, "base64")); };
  const viewport = async (width, height) => cdp("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 600 });
  const storage = (key) => evaluate(`JSON.parse(localStorage.getItem(${JSON.stringify(key)})||'null')`);
  const axeSource = await readFile(path.join(process.cwd(), "node_modules", "axe-core", "axe.min.js"), "utf8");
  const accessibility = async (name) => {
    await evaluate(axeSource);
    const violations = await evaluate("axe.run(document,{resultTypes:['violations']}).then(r=>r.violations.filter(v=>v.impact==='serious'||v.impact==='critical').map(v=>v.id))");
    requirePass(violations.length === 0, `${name} accessibility: ${violations.join(",")}`);
  };
  const layout = async (name) => {
    const result = await evaluate("({width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,overlay:Boolean(document.querySelector('[data-nextjs-dialog],.vite-error-overlay'))})");
    requirePass(!result.overflow && !result.overlay, `${name} layout failed`);
    return result;
  };

  await cdp("Page.enable"); await cdp("Runtime.enable"); await cdp("Network.enable");
  await viewport(1366, 900);
  await navigate("/");
  requirePass(await evaluate("document.body.innerText.includes('Start assessment')"), "Home entry missing");
  await click('a[href="/assessment?new=1"]');
  await poll("location.pathname", "/assessment");
  await poll("document.body.innerText.includes('Your business at a glance')", true);
  await input('[name="businessName"]', "Meridian Orchard Logistics");
  await select('[name="industry"]', "logistics_distribution");
  await select('[name="businessModel"]', "b2b");
  await select('[name="employeeBand"]', "25_49");
  await input('#description', "Fictional Malaysian cold-chain distributor coordinating orchard deliveries across three depots.");
  await clickText("Continue");
  await poll("document.body.innerText.includes('Your current digital foundation')", true);
  checks.assessmentQ1 = true;

  const capabilities = {
    websiteOrStore: "active", businessEmail: "active", cloudProductivity: "informal", crm: "not_used",
    digitalMarketingAnalytics: "informal", backup: "informal", cybersecurityControls: "informal", aiTools: "not_used",
  };
  for (const [name, value] of Object.entries(capabilities)) await click(`input[name="${name}"][value="${value}"]`);
  await clickText("Continue");
  await poll("document.body.innerText.includes('Where work gets stuck')", true);
  checks.assessmentQ2 = true;
  await select('[name="biggestChallenge"]', "manual_work");
  await input('[name="manualWorkflow"]', "Daily paper dispatch reconciliation and temperature exception calls");
  await input('[name="manualHoursPerWeek"]', "18");
  await input('[name="affectedEmployees"]', "11");
  await click('input[name="urgency"]:nth-of-type(1)');
  await clickText("Continue");
  await poll("document.body.innerText.includes('Your growth objective and constraints')", true);
  checks.assessmentQ3 = true;
  await select('[name="primaryObjective"]', "increase_productivity");
  await select('[name="budgetBand"]', "15k_50k");
  await select('[name="implementationPace"]', "3_6_months");
  await select('[name="highestConcern"]', "disruption");
  await clickText("Continue");
  await poll("document.body.innerText.includes('AI and change readiness')", true);
  checks.assessmentQ4 = true;
  for (const [name, index] of [["leadershipSponsorship", 3], ["usableData", 1], ["employeeDigitalSkills", 2], ["processConsistency", 2], ["changeWillingness", 3]]) {
    const clicked = await evaluate(`(() => { const e=document.querySelectorAll('input[name=${JSON.stringify(name)}]')[${index}]; if(!e)return false; e.click(); return true; })()`);
    requirePass(clicked, `Missing readiness ${name}`);
  }
  await clickText("Continue");
  await poll("location.pathname==='/assessment/review'||document.body.innerText.includes('Help us clarify what matters')", true);
  if (await evaluate("location.pathname==='/assessment'")) {
    const followups = await evaluate("[...document.querySelectorAll('.followup-card')].map(x=>x.querySelector('input')?.name)");
    for (const name of followups) await click(`input[name="${name}"]`);
    await clickText("Review Business Twin");
  }
  await poll("location.pathname", "/assessment/review");
  checks.followUps = (await storage("sme-growth-twin:assessment-draft:1.0.0")).selectedFollowUpIds.length;
  await click('a[aria-label="Edit Readiness"]');
  await poll("location.pathname", "/assessment");
  await poll("document.body.innerText.includes('AI and change readiness')", true);
  await evaluate("document.querySelectorAll('input[name=usableData]')[2].click()");
  await clickText("Continue");
  await poll("location.pathname==='/assessment/review'||document.body.innerText.includes('Help us clarify what matters')", true);
  if (await evaluate("location.pathname==='/assessment'")) {
    const followups = await evaluate("[...document.querySelectorAll('.followup-card')].map(x=>x.querySelector('input')?.name)");
    for (const name of followups) if (!(await evaluate(`Boolean(document.querySelector('input[name=${JSON.stringify(name)}]:checked'))`))) await click(`input[name="${name}"]`);
    await clickText("Review Business Twin");
  }
  await poll("location.pathname", "/assessment/review");
  const draft = await storage("sme-growth-twin:assessment-draft:1.0.0");
  requirePass(draft.answers.q5.usableData === 3 && draft.status === "ready_for_review", "Review edit did not persist");
  checks.reviewEdit = true;
  await accessibility("fresh review");
  await screenshot("fresh-review-1366.png");
  await clickText("Confirm Business Twin");
  await poll("location.pathname", "/results");
  await poll("document.body.innerText.includes('Digital maturity')", true);
  const diagnostic = await storage("sme-growth-twin:diagnostic:1.0.0");
  requirePass(Boolean(diagnostic?.digitalMaturity && diagnostic?.aiReadiness), "Fresh diagnosis absent");
  await evaluate("[...document.querySelectorAll('details')].forEach(x=>x.open=true)");
  checks.results = { maturity: diagnostic.digitalMaturity.value, readiness: diagnostic.aiReadiness.value, disclosures: await evaluate("document.querySelectorAll('details').length") };
  await click('a[href="/recommendations"]');
  await poll("location.pathname", "/recommendations");
  await evaluate("[...document.querySelectorAll('.recommendation-record')].forEach(x=>x.open=true)");
  const recommendation = await storage("sme-growth-twin:recommendations:1.0.0");
  requirePass(recommendation.recommendations.length >= 3 && await evaluate("document.body.innerText.includes('Six exact fit components')"), "Recommendation details missing");
  checks.recommendations = recommendation.recommendations.map((item) => `${item.capabilityId}:${item.status}`);
  await screenshot("fresh-recommendations-1366.png");
  await click('a[href="/scenarios"]');
  await poll("location.pathname", "/scenarios");
  for (const id of ["lean_foundation", "balanced_growth", "accelerated_ai"]) {
    await click(`.${id} .inspect-action`);
    await poll("document.querySelector('.scenario-detail-lab')?.getAttribute('data-focused-scenario')", id);
  }
  await click('.balanced_growth .inspect-action');
  const scenarioKey = "sme-growth-twin:scenarios:1.0.0";
  const before = await storage(scenarioKey);
  const original = before.scenarios.find((item) => item.templateId === "balanced_growth");
  const assumption = original.assumptions.operational.loadedHourlyCost.range;
  const edited = assumption.base < assumption.high ? assumption.base + 1 : assumption.base - 1;
  requirePass(edited >= assumption.low && edited <= assumption.high, "No safe assumption edit available");
  await input('[name="balanced_growth.operational.loadedHourlyCost.base"]', String(edited));
  await poll(`JSON.parse(localStorage.getItem(${JSON.stringify(scenarioKey)})).scenarios.find(x=>x.templateId==='balanced_growth').assumptions.operational.loadedHourlyCost.range.base`, edited);
  await click('.balanced_growth .select-action');
  const comparison = await storage(scenarioKey);
  requirePass(Boolean(comparison.selectedScenarioId), "Preferred scenario was not saved");
  checks.scenarios = { count: comparison.scenarios.length, assumptionBefore: assumption.base, assumptionAfter: edited, preferred: "balanced_growth" };
  await screenshot("fresh-scenarios-1366.png");
  await click('a[href="/blueprint"]');
  await poll("location.pathname", "/blueprint");
  await clickText("Generate advisor review and Blueprint");
  await poll("document.body.innerText.includes('Five advisor reviews')", true, 120_000);
  await poll("Boolean(document.querySelector('.phase02-handoff.sync-ready a[href^=\"/copilot\"]'))||Boolean(document.querySelector('.phase02-handoff.sync-failed'))", true, 120_000);
  requirePass(await evaluate("Boolean(document.querySelector('.phase02-handoff.sync-ready'))"), `Blueprint sync failed: ${JSON.stringify(failedRequests)}`);
  const durable = await storage("majupilot:durable-journey:1.0.0");
  requirePass(Boolean(durable?.syncedAt && durable?.artifactIds?.blueprint), "Blueprint did not durably sync");
  const blueprint = await storage("sme-growth-twin:blueprint:1.0.0");
  checks.blueprint = { advisors: blueprint.advisorReviews.length, sections: blueprint.sectionIds.length, synced: true };
  await screenshot("fresh-blueprint-1366.png");

  await navigate("/evidence");
  await poll("Boolean(document.querySelector('#evidence-file:not([disabled])'))", true);
  await evaluate(`(() => { const input=document.querySelector('#evidence-file'); const transfer=new DataTransfer(); transfer.items.add(new File(['Fictional Meridian Orchard Logistics dispatch procedure. At 06:15 each morning, the depot lead checks refrigerated van temperature and initials the blue dispatch register. This is synthetic Phase 5 evidence.'], 'meridian-dispatch-proof.txt', {type:'text/plain'})); input.files=transfer.files; input.dispatchEvent(new Event('change',{bubbles:true})); })()`);
  await clickText("Upload and process");
  await poll("document.querySelector('.document-row.status-ready')?.innerText.includes('meridian-dispatch-proof.txt')??false", true, 120_000);
  const documentId = await evaluate("document.querySelector('.document-row.status-ready .evidence-technical dd')?.textContent?.trim()");
  requirePass(Boolean(documentId), "Uploaded document identity missing");
  checks.evidence = { ready: true, filename: "meridian-dispatch-proof.txt" };
  await screenshot("fresh-evidence-1366.png");

  await navigate("/copilot");
  await poll("Boolean(document.querySelector('#copilot-message:not([disabled])'))", true, 90_000);
  const assistantBeforeTurn = await evaluate("document.querySelectorAll('.copilot-message.assistant').length");
  await input('#copilot-message', "What time does the fictional Meridian depot lead check refrigerated van temperature? Cite the uploaded dispatch document.");
  await clickText("Send");
  await poll(`document.querySelectorAll('.copilot-message.assistant').length>${assistantBeforeTurn}`, true, 120_000);
  const cited = await evaluate("Boolean(document.querySelector('.copilot-message.assistant .copilot-citations blockquote'))");
  const answer = await evaluate("[...document.querySelectorAll('.copilot-message.assistant')].at(-1)?.innerText.slice(0, 600)");
  requirePass(cited, `Copilot did not show uploaded-document citation: ${answer}`);
  await cdp("Page.reload");
  await poll("document.readyState", "complete");
  await poll("Boolean(document.querySelector('#copilot-message:not([disabled])'))", true, 60_000);
  await poll("document.querySelector('.copilot-message.assistant')?.innerText.includes('06:15')??false", true, 60_000);
  const historyRestored = await evaluate("document.body.innerText.includes('meridian-dispatch-proof.txt')");
  requirePass(historyRestored, "Uploaded citation did not restore after refresh");
  checks.copilot = { citation: cited, historyRestored };
  await screenshot("fresh-copilot-1366.png");

  const cookieList = (await cdp("Network.getAllCookies")).cookies.filter((item) => item.domain === "127.0.0.1").map((item) => `${item.name}=${item.value}`).join("; ");
  const sessionResponse = await fetch(`${baseUrl}/api/v2/copilot/sessions`, { method: "POST", headers: { "content-type": "application/json", cookie: cookieList }, body: JSON.stringify({ assessmentSessionId: durable.assessmentSessionId, businessTwinId: durable.artifactIds.businessTwin, blueprintId: durable.artifactIds.blueprint, idempotencyKey: `phase5-confirm-${durable.assessmentSessionId}` }) });
  requirePass(sessionResponse.status === 201, `Copilot session API ${sessionResponse.status}`);
  const copilotSession = (await sessionResponse.json()).data;
  const propose = await fetch(`${baseUrl}/api/v2/copilot/sessions/${copilotSession.id}/turns`, { method: "POST", headers: { "content-type": "application/json", cookie: cookieList }, body: JSON.stringify({ message: "Prepare a canonical copy of this Blueprint report for explicit confirmation.", requestedTool: "generateBlueprintReport", requestedToolInput: { blueprintId: durable.artifactIds.blueprint, locale: "en-MY", acceptedNoteIds: [] }, idempotencyKey: `phase5-proposal-${durable.assessmentSessionId}` }) });
  requirePass(propose.status === 200, `Confirmation proposal API ${propose.status}`);
  const proposal = (await propose.json()).data.toolCalls.find((item) => item.status === "confirmation_required");
  requirePass(Boolean(proposal?.confirmationId), "Write was not held for confirmation");
  const confirmed = await fetch(`${baseUrl}/api/v2/copilot/confirmations/${proposal.confirmationId}`, { method: "POST", headers: { "content-type": "application/json", cookie: cookieList }, body: JSON.stringify({ confirmationText: "CONFIRM", idempotencyKey: `phase5-confirm-report-${durable.assessmentSessionId}` }) });
  requirePass(confirmed.status === 200, `Confirmation execution API ${confirmed.status}`);
  checks.confirmation = { required: true, executed: true };

  const other = await fetch(`${baseUrl}/api/v2/guest/session`, { method: "POST" });
  requirePass(other.status === 201, "Second guest creation failed");
  const otherCookie = other.headers.get("set-cookie")?.split(";")[0];
  const deniedDoc = await fetch(`${baseUrl}/api/v2/evidence-documents/${documentId}/download?assessmentSessionId=${durable.assessmentSessionId}`, { headers: { cookie: otherCookie } });
  const deniedChat = await fetch(`${baseUrl}/api/v2/copilot/sessions/${copilotSession.id}/messages`, { headers: { cookie: otherCookie } });
  requirePass([403, 404].includes(deniedDoc.status) && [403, 404].includes(deniedChat.status), `Tenant isolation failed: document ${deniedDoc.status}, Copilot ${deniedChat.status}`);
  checks.isolation = { document: deniedDoc.status, copilot: deniedChat.status };

  await navigate("/consultation");
  await poll("Boolean(document.querySelector('input[name=name]'))", true);
  await input('input[name="name"]', "Nadia Fictional");
  await input('input[name="email"]', "nadia.fictional@example.test");
  await input('input[name="phone"]', "+60 10 555 0188");
  await select('select[name="urgency"]', "exploring");
  await click('input[name="consent"]');
  await clickText("Record consultation request");
  await poll("document.body.innerText.includes('Request recorded.')", true, 120_000);
  const receipt = await storage("majupilot:durable-journey:1.0.0");
  requirePass(Boolean(receipt?.report?.id && receipt?.lead?.leadId), "Durable PDF/lead receipt absent");
  const signed = await fetch(`${baseUrl}/api/v2/reports/${receipt.report.id}/download?expiresIn=60`, { headers: { cookie: cookieList } });
  requirePass(signed.status === 200, `PDF signed download ${signed.status}`);
  const pdfUrl = (await signed.json()).data.url;
  const pdfResponse = await fetch(pdfUrl);
  const pdf = Buffer.from(await pdfResponse.arrayBuffer());
  requirePass(pdfResponse.ok && pdf.subarray(0, 4).toString() === "%PDF" && pdf.length > 1000, "Canonical PDF download invalid");
  await writeFile(path.join(artifacts, "fresh-blueprint.pdf"), pdf);
  checks.consultation = { recorded: true, reportSha256: Boolean(receipt.report.contentSha256), pdfBytes: pdf.length };
  await screenshot("fresh-consultation-1366.png");

  const responsive = [];
  for (const [width, height] of [[390, 844], [768, 1024], [1366, 900], [1920, 1080]]) {
    await viewport(width, height);
    await navigate("/blueprint");
    await poll("document.body.innerText.includes('Five advisor reviews')", true);
    responsive.push({ route: "/blueprint", ...await layout("Blueprint") });
    await navigate("/evidence");
    await poll("Boolean(document.querySelector('.document-row.status-ready'))", true);
    responsive.push({ route: "/evidence", ...await layout("Evidence") });
    await navigate("/copilot");
    await poll("Boolean(document.querySelector('#copilot-message:not([disabled])'))", true);
    responsive.push({ route: "/copilot", ...await layout("Copilot") });
  }
  await accessibility("fresh Copilot");
  requirePass(!await evaluate("/Kopi Kita|Precision Parts|Northstar Digital Studio/.test(document.body.innerText)"), "Sample-case data leaked into fresh workspace");
  checks.responsive = responsive;
  checks.consoleErrors = consoleErrors.length;
  checks.failedRequests = failedRequests;
  requirePass(consoleErrors.length === 0 && failedRequests.length === 0, "Unexpected browser console/network failure");
  await writeFile(path.join(artifacts, "phase5-fresh-journey.json"), `${JSON.stringify({ ok: true, company: "Meridian Orchard Logistics", checks, syntheticOnly: true, loopbackSupabase: true, gatewayModel: process.env.AI_GATEWAY_MODEL }, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({ ok: true, company: "Meridian Orchard Logistics", checks, artifacts }, null, 2)}\n`);
} finally {
  try { ws?.close(); } catch {}
  stopTree(chrome); stopTree(server);
  await wait(500);
  await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }).catch(() => undefined);
  if (!artifactOverride) await rm(artifacts, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }).catch(() => undefined);
}
