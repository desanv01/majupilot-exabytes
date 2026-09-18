import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const appPort = 3015; const debugPort = 9555; const baseUrl = `http://localhost:${appPort}`;
const artifacts = path.resolve("artifacts"); const profile = path.join(tmpdir(), `sme-growth-twin-stage05-${process.pid}`);
await mkdir(artifacts, { recursive: true });
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--port", String(appPort)], { cwd: process.cwd(), env: { ...process.env, AI_GATEWAY_MODEL: "", AI_GATEWAY_API_KEY: "", VERCEL_OIDC_TOKEN: "" }, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
let serverOutput = ""; server.stdout.on("data", (value) => { serverOutput += value.toString(); }); server.stderr.on("data", (value) => { serverOutput += value.toString(); });
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let ready = false;
for (let attempt = 0; attempt < 120; attempt += 1) { try { if ((await fetch(baseUrl)).ok) { ready = true; break; } } catch {} await wait(500); }
if (!ready) { server.kill(); throw new Error(`Next.js did not start: ${serverOutput.slice(-2000)}`); }

const chrome = spawn(chromePath, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore", windowsHide: true });
let ws; try {
  let endpoint;
  for (let attempt = 0; attempt < 50; attempt += 1) { try { const tabs = await fetch(`http://127.0.0.1:${debugPort}/json`).then((response) => response.json()); endpoint = tabs.find((tab) => tab.type === "page")?.webSocketDebuggerUrl; if (endpoint) break; } catch {} await wait(200); }
  if (!endpoint) throw new Error("Chrome DevTools endpoint did not start");
  ws = new WebSocket(endpoint); await new Promise((resolve, reject) => { ws.addEventListener("open", resolve, { once: true }); ws.addEventListener("error", reject, { once: true }); });
  let nextId = 0; const pending = new Map(); const consoleErrors = [];
  ws.addEventListener("message", (event) => { const message = JSON.parse(event.data); if (message.id && pending.has(message.id)) { const call = pending.get(message.id); pending.delete(message.id); if (message.error) call.reject(new Error(message.error.message)); else call.resolve(message.result); } if (message.method === "Runtime.exceptionThrown") consoleErrors.push(message.params.exceptionDetails.text); if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") consoleErrors.push(message.params.args.map((arg) => arg.value ?? arg.description).join(" ")); });
  const cdp = (method, params = {}) => new Promise((resolve, reject) => { const callId = ++nextId; pending.set(callId, { resolve, reject }); ws.send(JSON.stringify({ id: callId, method, params })); });
  const evaluate = async (expression) => (await cdp("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result.value;
  const poll = async (expression, expected, timeout = 20000) => { const started = Date.now(); let actual; while (Date.now() - started < timeout) { actual = await evaluate(expression); if (actual === expected) return; await wait(150); } throw new Error(`Timed out: ${expression}; actual=${JSON.stringify(actual)}`); };
  const navigate = async (url) => { await cdp("Page.navigate", { url }); await poll("document.readyState", "complete"); };
  const screenshot = async (name, full = true) => { let params = { format: "png", fromSurface: true }; if (full) { const metrics = await cdp("Page.getLayoutMetrics"); params = { format: "png", captureBeyondViewport: true, clip: { x: 0, y: 0, width: Math.ceil(metrics.cssContentSize.width), height: Math.ceil(metrics.cssContentSize.height), scale: 1 } }; } const capture = await cdp("Page.captureScreenshot", params); await writeFile(path.join(artifacts, name), Buffer.from(capture.data, "base64")); };
  await cdp("Page.enable"); await cdp("Runtime.enable"); await cdp("Log.enable"); await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false }); await navigate(baseUrl);
  const draft = { schemaVersion: "1.0.0", sessionId: "assessment_browser0501", status: "ready_for_review", currentStep: 6, twinRevision: 1, answers: { q1: { businessName: "Kopi Kita Café Group", industry: "food_beverage", businessModel: "b2c", employeeBand: "25_49", description: "Three Malaysian café outlets serving walk-in and catering customers." }, q2: { websiteOrStore: "active", businessEmail: "not_used", cloudProductivity: "informal", crm: "not_used", digitalMarketingAnalytics: "active", backup: "not_used", cybersecurityControls: "informal", aiTools: "not_used" }, q3: { biggestChallenge: "customer_management", manualWorkflow: "WhatsApp orders and catering enquiries", manualHoursPerWeek: null, affectedEmployees: 8, urgency: 4 }, q4: { primaryObjective: "increase_revenue", budgetBand: "5k_15k", implementationPace: "1_3_months", highestConcern: "cost" }, q5: { leadershipSponsorship: 4, usableData: 2, employeeDigitalSkills: 3, processConsistency: 2, changeWillingness: 4 } }, selectedFollowUpIds: ["fu_manual_hours", "fu_customer_records", "fu_backup_frequency"], followUpAnswers: { fu_manual_hours: "11_20", fu_customer_records: "messaging_apps", fu_backup_frequency: "none" }, updatedAt: "2026-09-18T09:00:00+08:00" };
  await evaluate(`localStorage.setItem("sme-growth-twin:assessment-draft:1.0.0", ${JSON.stringify(JSON.stringify(draft))})`);
  await navigate(`${baseUrl}/assessment/analysis`); await poll("location.pathname", "/results", 15000);
  await evaluate("document.querySelector('a[href=\"/recommendations\"]')?.click()"); await poll("location.pathname", "/recommendations"); await poll("document.body.innerText.includes('Compare transformation scenarios')", true);
  await evaluate("document.querySelector('a[href=\"/scenarios\"]')?.click()"); await poll("location.pathname", "/scenarios"); await poll("document.body.innerText.includes('Balanced Growth')", true);
  await evaluate("Array.from(document.querySelectorAll('.balanced_growth button')).find(button=>button.textContent.includes('Select as preferred'))?.click()"); await wait(150);
  const handoffAvailable = await evaluate("Boolean(document.querySelector('a[href=\"/blueprint\"]'))"); await evaluate("document.querySelector('a[href=\"/blueprint\"]')?.click()"); await poll("location.pathname", "/blueprint"); await poll("document.body.innerText.includes('No Blueprint has been generated')", true);
  await evaluate("Array.from(document.querySelectorAll('button')).find(button=>button.textContent.includes('Generate advisor review and Blueprint'))?.click()"); await poll("document.body.innerText.includes('Five advisor reviews')", true, 30000);
  const blueprint = JSON.parse(await evaluate("localStorage.getItem('sme-growth-twin:blueprint:1.0.0')"));
  const desktopOverflow = await evaluate("document.documentElement.scrollWidth <= window.innerWidth"); const desktopTargets = await evaluate("Math.min(...Array.from(document.querySelectorAll('a,button,summary')).map(element=>element.getBoundingClientRect().height).filter(Boolean))");
  const headingOrder = await evaluate("Array.from(document.querySelectorAll('.blueprint-report h2')).map(node=>node.textContent)"); const origins = blueprint.advisorReviews.map((review) => ({ advisor: review.advisor, origin: review.origin, position: review.position, confidence: review.confidence }));
  const evidence = Object.fromEntries(blueprint.advisorReviews.map((review) => [review.advisor, { headline: review.headline, concern: review.concerns[0]?.statement, missing: review.missingEvidence[0]?.statement, adjustment: review.adjustments[0]?.action }]));
  const selected = blueprint.snapshot.selectedScenario; const figures = { costs: selected.costs.firstYear, operational: selected.value.operational, net: selected.value.net, payback: selected.value.payback, budgetFit: selected.budgetFit, revenue: selected.value.revenue.status, avoidedRisk: selected.value.avoidedRisk.status, committed: selected.interventions.filter((item) => item.commitment === "committed").length };
  await screenshot("stage-05-blueprint-desktop.png");
  await cdp("Emulation.setDeviceMetricsOverride", { width: 360, height: 800, deviceScaleFactor: 1, mobile: true }); await cdp("Page.reload", { ignoreCache: true }); await poll("document.body.innerText.includes('Five advisor reviews')", true);
  const mobileOverflow = await evaluate("document.documentElement.scrollWidth <= window.innerWidth"); const mobileTargets = await evaluate("Math.min(...Array.from(document.querySelectorAll('a,button,summary')).map(element=>element.getBoundingClientRect().height).filter(Boolean))"); const mobileColumns = await evaluate("getComputedStyle(document.querySelector('.synthesis-grid')).gridTemplateColumns");
  await screenshot("stage-05-blueprint-mobile-360-viewport.png", false); await screenshot("stage-05-blueprint-mobile-360.png");
  await cdp("Emulation.setDeviceMetricsOverride", { width: 794, height: 1123, deviceScaleFactor: 1, mobile: false }); await cdp("Emulation.setEmulatedMedia", { media: "print" }); await wait(200);
  const printControlsHidden = await evaluate("Array.from(document.querySelectorAll('.no-print')).every(element=>getComputedStyle(element).display==='none')"); const printDetailsExpanded = await evaluate("Array.from(document.querySelectorAll('.blueprint-report details')).every(element=>Array.from(element.children).every(child=>getComputedStyle(child).display!=='none'))");
  await screenshot("stage-05-blueprint-print.png");
  const overlay = await evaluate("Boolean(document.querySelector('[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay'))");
  console.log(JSON.stringify({ route: await evaluate("location.pathname"), handoffAvailable, blueprintId: blueprint.id, sections: blueprint.sectionIds.length, origins, decision: blueprint.synthesis.decision, agreementTopics: blueprint.synthesis.agreement.map((item) => item.topic), disagreementCount: blueprint.synthesis.disagreement.length, evidence, figures, desktopOverflow, desktopTargets, headingOrder, mobileOverflow, mobileTargets, mobileColumns, printControlsHidden, printDetailsExpanded, overlay, consoleErrors }, null, 2));
  if (!handoffAvailable || blueprint.sectionIds.length !== 16 || desktopOverflow !== true || mobileOverflow !== true || mobileTargets < 44 || !printControlsHidden || !printDetailsExpanded || overlay || consoleErrors.length) throw new Error("Stage 05 browser assertions failed");
  await cdp("Browser.close");
} finally {
  try { ws?.close(); } catch {} chrome.kill(); server.kill();
}
