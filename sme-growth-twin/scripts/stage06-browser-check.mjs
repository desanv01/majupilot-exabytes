import { execFileSync, spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const appPort = 3016; const debugPort = 9556; const baseUrl = `http://localhost:${appPort}`;
const artifacts = path.resolve("artifacts"); const profile = path.join(tmpdir(), `sme-growth-twin-stage06-${process.pid}`);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const stopTree = (child) => { if (!child?.pid) return; try { execFileSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true }); } catch { try { child.kill(); } catch {} } };
await mkdir(artifacts, { recursive: true });

const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--port", String(appPort)], { cwd: process.cwd(), env: { ...process.env, AI_GATEWAY_MODEL: "", AI_GATEWAY_API_KEY: "", VERCEL_OIDC_TOKEN: "" }, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
let serverOutput = ""; server.stdout.on("data", (value) => { serverOutput += value.toString(); }); server.stderr.on("data", (value) => { serverOutput += value.toString(); });
let ready = false;
for (let attempt = 0; attempt < 120; attempt += 1) { try { if ((await fetch(baseUrl)).ok) { ready = true; break; } } catch {} await wait(500); }
if (!ready) { server.kill(); throw new Error(`Next.js did not start: ${serverOutput.slice(-2000)}`); }

const chrome = spawn(chromePath, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore", windowsHide: true });
let ws;
try {
  let endpoint;
  for (let attempt = 0; attempt < 50; attempt += 1) { try { const tabs = await fetch(`http://127.0.0.1:${debugPort}/json`).then((response) => response.json()); endpoint = tabs.find((tab) => tab.type === "page")?.webSocketDebuggerUrl; if (endpoint) break; } catch {} await wait(200); }
  if (!endpoint) throw new Error("Chrome DevTools endpoint did not start");
  ws = new WebSocket(endpoint); await new Promise((resolve, reject) => { ws.addEventListener("open", resolve, { once: true }); ws.addEventListener("error", reject, { once: true }); });
  let nextId = 0; const pending = new Map(); const consoleErrors = [];
  ws.addEventListener("message", (event) => { const message = JSON.parse(event.data); if (message.id && pending.has(message.id)) { const call = pending.get(message.id); pending.delete(message.id); if (message.error) call.reject(new Error(message.error.message)); else call.resolve(message.result); } if (message.method === "Runtime.exceptionThrown") consoleErrors.push(message.params.exceptionDetails.text); if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") consoleErrors.push(message.params.args.map((arg) => arg.value ?? arg.description).join(" ")); });
  const cdp = (method, params = {}) => new Promise((resolve, reject) => { const id = ++nextId; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); });
  const evaluate = async (expression) => { const result = await cdp("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }); if (result.exceptionDetails) throw new Error(result.exceptionDetails.text); return result.result.value; };
  const poll = async (expression, expected, timeout = 20_000) => { const started = Date.now(); let actual; while (Date.now() - started < timeout) { actual = await evaluate(expression); if (actual === expected) return; await wait(150); } throw new Error(`Timed out: ${expression}; actual=${JSON.stringify(actual)}`); };
  const navigate = async (url) => { await cdp("Page.navigate", { url }); await poll("document.readyState", "complete"); };
  const screenshot = async (name, full = true) => { let params = { format: "png", fromSurface: true }; if (full) { const metrics = await cdp("Page.getLayoutMetrics"); params = { format: "png", captureBeyondViewport: true, clip: { x: 0, y: 0, width: Math.ceil(metrics.cssContentSize.width), height: Math.ceil(metrics.cssContentSize.height), scale: 1 } }; } const capture = await cdp("Page.captureScreenshot", params); await writeFile(path.join(artifacts, name), Buffer.from(capture.data, "base64")); };
  const fill = async (selector, value) => evaluate(`(() => { const element=document.querySelector(${JSON.stringify(selector)}); const setter=Object.getOwnPropertyDescriptor(element instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype,'value').set; setter.call(element,${JSON.stringify(value)}); element.dispatchEvent(new Event(element instanceof HTMLSelectElement?'change':'input',{bubbles:true})); })()`);

  await cdp("Page.enable"); await cdp("Runtime.enable"); await cdp("Log.enable"); await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await navigate(`${baseUrl}/consultation`); await poll("location.pathname !== '/consultation'", true);

  const draft = { schemaVersion: "1.0.0", sessionId: "assessment_browser0601", status: "ready_for_review", currentStep: 6, twinRevision: 1, answers: { q1: { businessName: "Kopi Kita Café Group", industry: "food_beverage", businessModel: "b2c", employeeBand: "25_49", description: "Three Malaysian café outlets serving walk-in and catering customers." }, q2: { websiteOrStore: "active", businessEmail: "not_used", cloudProductivity: "informal", crm: "not_used", digitalMarketingAnalytics: "active", backup: "not_used", cybersecurityControls: "informal", aiTools: "not_used" }, q3: { biggestChallenge: "customer_management", manualWorkflow: "WhatsApp orders and catering enquiries", manualHoursPerWeek: null, affectedEmployees: 8, urgency: 4 }, q4: { primaryObjective: "increase_revenue", budgetBand: "5k_15k", implementationPace: "1_3_months", highestConcern: "cost" }, q5: { leadershipSponsorship: 4, usableData: 2, employeeDigitalSkills: 3, processConsistency: 2, changeWillingness: 4 } }, selectedFollowUpIds: ["fu_manual_hours", "fu_customer_records", "fu_backup_frequency"], followUpAnswers: { fu_manual_hours: "11_20", fu_customer_records: "messaging_apps", fu_backup_frequency: "none" }, updatedAt: "2026-09-18T09:00:00+08:00" };
  await evaluate(`localStorage.setItem("sme-growth-twin:assessment-draft:1.0.0", ${JSON.stringify(JSON.stringify(draft))})`);
  await navigate(`${baseUrl}/assessment/analysis`); await poll("location.pathname", "/results", 15_000);
  await evaluate("document.querySelector('a[href=\"/recommendations\"]')?.click()"); await poll("location.pathname", "/recommendations"); await poll("document.body.innerText.includes('Compare transformation scenarios')", true);
  await evaluate("document.querySelector('a[href=\"/scenarios\"]')?.click()"); await poll("location.pathname", "/scenarios"); await poll("document.body.innerText.includes('Balanced Growth')", true);
  await evaluate("Array.from(document.querySelectorAll('.balanced_growth button')).find(button=>button.textContent.includes('Select as preferred'))?.click()"); await wait(150);
  await evaluate("document.querySelector('a[href=\"/blueprint\"]')?.click()"); await poll("location.pathname", "/blueprint"); await poll("document.body.innerText.includes('No Blueprint has been generated')", true);
  await evaluate("Array.from(document.querySelectorAll('button')).find(button=>button.textContent.includes('Generate advisor review and Blueprint'))?.click()"); await poll("document.body.innerText.includes('Five advisor reviews')", true, 30_000);
  const caseAFigures = await evaluate(`(() => { const b=JSON.parse(localStorage.getItem('sme-growth-twin:blueprint:1.0.0')); const s=b.snapshot.selectedScenario; return { maturity:b.snapshot.diagnostic.digitalMaturity.value, readiness:b.snapshot.diagnostic.aiReadiness.value, cost:s.costs.firstYear, payback:s.value.payback, scenario:s.title }; })()`);
  const ctaVisible = await evaluate("getComputedStyle(document.querySelector('.report-consultation-action')).display !== 'none'");
  await evaluate("document.querySelector('.report-consultation-action a')?.click()"); await poll("location.pathname", "/consultation"); await poll("document.body.innerText.includes('Request an evidence-ready consultation.')", true);
  const consentDefault = await evaluate("document.querySelector('input[name=consent]').checked === false");
  const desktopOverflow = await evaluate("document.documentElement.scrollWidth <= window.innerWidth");
  const desktopTargets = await evaluate("Math.min(...Array.from(document.querySelectorAll('.consultation-form input:not([name=website]):not([type=checkbox]),.consultation-form select,.consultation-form button,.consent-card label,.consultation-aside a')).map(element=>element.getBoundingClientRect().height))");
  const focusOrder = await evaluate("(() => { const nodes=[...document.querySelectorAll('.consultation-form input:not([name=website]),.consultation-form select,.consultation-form button')]; return nodes.map(n=>n.name||n.type); })()");
  await screenshot("stage-06-consultation-desktop.png");

  await cdp("Emulation.setDeviceMetricsOverride", { width: 360, height: 800, deviceScaleFactor: 1, mobile: true }); await cdp("Page.reload", { ignoreCache: true }); await poll("document.body?.innerText.includes('Request an evidence-ready consultation.') ?? false", true);
  const mobileFormOverflow = await evaluate("document.documentElement.scrollWidth <= window.innerWidth");
  const mobileFormTargets = await evaluate("Math.min(...Array.from(document.querySelectorAll('.consultation-form input:not([name=website]):not([type=checkbox]),.consultation-form select,.consultation-form button,.consent-card label,.consultation-aside a')).map(element=>element.getBoundingClientRect().height))");
  const mobileDisclosureOrder = await evaluate("document.querySelector('.share-disclosure').getBoundingClientRect().top < document.querySelector('.consent-card').getBoundingClientRect().top");
  await screenshot("stage-06-consultation-mobile-360.png", false);
  await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false }); await cdp("Page.reload", { ignoreCache: true }); await poll("document.body?.innerText.includes('Request an evidence-ready consultation.') ?? false", true);
  await evaluate(`(() => { window.__stage06Bodies=[]; const original=window.fetch.bind(window); window.fetch=(input,init)=>{ if(input==='/api/leads' && init?.body) window.__stage06Bodies.push(init.body); return original(input,init); }; document.querySelector('input[name=name]').focus(); })()`);
  const firstFocus = await evaluate("document.activeElement?.getAttribute('name')");
  await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 }); await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
  const secondFocus = await evaluate("document.activeElement?.getAttribute('name')");

  await fill('input[name="name"]', "Aiman Rahman"); await fill('input[name="email"]', "not-an-email"); await fill('select[name="urgency"]', "within_30_days");
  await evaluate("document.querySelector('.consultation-form').requestSubmit()"); await poll("Boolean(document.querySelector('#email-error'))", true);
  const validationPreserved = await evaluate("document.querySelector('input[name=name]').value === 'Aiman Rahman' && document.querySelector('select[name=urgency]').value === 'within_30_days'");
  await fill('input[name="email"]', "aiman@example.test"); await fill('input[name="phone"]', "+60 12 345 6789");
  await evaluate("document.querySelector('.consultation-form').requestSubmit()"); await poll("Boolean(document.querySelector('#consent-error'))", true);
  const consentPreserved = await evaluate("document.querySelector('input[name=email]').value === 'aiman@example.test' && document.querySelector('input[name=consent]').checked === false");
  const apiConsentStatus = await evaluate(`(async()=>{ const blueprint=JSON.parse(localStorage.getItem('sme-growth-twin:blueprint:1.0.0')); const response=await fetch('/api/leads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({submissionId:crypto.randomUUID(),contact:{name:'Aiman Rahman',businessName:'Kopi Kita Café Group',email:'reject@example.test',urgency:'exploring'},consent:{accepted:false,wordingVersion:'consultation-consent-1.0.0'},honeypot:'',blueprint})}); return response.status; })()`);
  await evaluate("document.querySelector('input[name=consent]').click()"); await evaluate("document.querySelector('.consultation-form').requestSubmit()"); await poll("document.body.innerText.includes('Your consultation request has been recorded.')", true, 15_000);
  const receipt = JSON.parse(await evaluate("sessionStorage.getItem('sme-growth-twin:lead-receipt:1.0.0')"));
  const sessionAudit = await evaluate("({keys:Object.keys(sessionStorage),raw:sessionStorage.getItem('sme-growth-twin:lead-receipt:1.0.0')})");
  const successTextSafe = await evaluate("!document.body.innerText.includes('aiman@example.test') && !document.body.innerText.includes('+60 12 345 6789')");
  const replay = await evaluate(`(async()=>{ const body=window.__stage06Bodies.at(-1); const response=await fetch('/api/leads',{method:'POST',headers:{'Content-Type':'application/json'},body}); return {status:response.status,payload:await response.json()}; })()`);
  await screenshot("stage-06-consultation-success.png");

  await cdp("Emulation.setDeviceMetricsOverride", { width: 360, height: 800, deviceScaleFactor: 1, mobile: true }); await cdp("Page.reload", { ignoreCache: true }); await poll("document.body?.innerText.includes('Your consultation request has been recorded.') ?? false", true);
  const mobileOverflow = await evaluate("document.documentElement.scrollWidth <= window.innerWidth");
  const mobileTargets = await evaluate("Math.min(...Array.from(document.querySelectorAll('.success-actions .button')).map(element=>element.getBoundingClientRect().height))");
  await screenshot("stage-06-consultation-success-mobile-360.png", false);

  await navigate(`${baseUrl}/blueprint`); await poll("document.body.innerText.includes('Consultation handoff')", true); await cdp("Emulation.setEmulatedMedia", { media: "print" }); await wait(200);
  const printCtaExcluded = await evaluate("getComputedStyle(document.querySelector('.report-consultation-action')).display === 'none' && getComputedStyle(document.querySelector('.blueprint-hero')).display === 'none'");
  const overlay = await evaluate("Boolean(document.querySelector('[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay'))");
  const evidence = { caseAFigures, ctaVisible, consentDefault, desktopOverflow, desktopTargets, focusOrder, mobileFormOverflow, mobileFormTargets, mobileDisclosureOrder, firstFocus, secondFocus, validationPreserved, consentPreserved, apiConsentStatus, receipt, sessionAudit, successTextSafe, replay, mobileOverflow, mobileTargets, printCtaExcluded, overlay, consoleErrors };
  console.log(JSON.stringify(evidence, null, 2));
  const expectedFigures = JSON.stringify(caseAFigures) === JSON.stringify({ maturity: 37.5, readiness: 42.5, cost: { low: 9200, base: 18400, high: 27600 }, payback: { status: "estimated", best: 7.2, base: 30.4, worst: 140.5 }, scenario: "Balanced Growth" });
  const receiptSafe = sessionAudit.keys.length === 1 && !/aiman|example\.test|\+60|snapshot|advisorReviews|contact|phone|email/i.test(sessionAudit.raw);
  const orderCorrect = JSON.stringify(focusOrder) === JSON.stringify(["name", "businessName", "email", "phone", "urgency", "consent", "submit"]);
  if (!expectedFigures || !ctaVisible || !consentDefault || !desktopOverflow || desktopTargets < 44 || !orderCorrect || !mobileFormOverflow || mobileFormTargets < 44 || !mobileDisclosureOrder || firstFocus !== "name" || secondFocus !== "businessName" || !validationPreserved || !consentPreserved || apiConsentStatus !== 422 || !receipt?.leadReference || receipt.blueprintId !== JSON.parse(await evaluate("localStorage.getItem('sme-growth-twin:blueprint:1.0.0')")).id || !receiptSafe || !successTextSafe || replay.status !== 200 || replay.payload.leadReference !== receipt.leadReference || replay.payload.replayed !== true || !mobileOverflow || mobileTargets < 44 || !printCtaExcluded || overlay || consoleErrors.length) throw new Error("Stage 06 browser assertions failed");
  await cdp("Browser.close");
} finally {
  try { ws?.close(); } catch {} stopTree(chrome); stopTree(server);
}
