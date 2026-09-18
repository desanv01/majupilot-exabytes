import { execFileSync, spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const chromePath = process.env.CHROME_PATH?.trim() || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const appPort = Number(process.env.PHASE03_PORT || 3023);
const debugPort = Number(process.env.PHASE03_DEBUG_PORT || 9563);
const configuredBaseUrl = process.env.PHASE03_BASE_URL?.trim();
const baseUrl = configuredBaseUrl?.replace(/\/$/, "") || `http://127.0.0.1:${appPort}`;
const artifacts = path.resolve(process.env.PHASE03_ARTIFACT_DIR?.trim() || path.join(process.cwd(), "..", "planning", "evidence", "ui-upgrade", "phase-03-analysis-results"));
const draftKey = "sme-growth-twin:assessment-draft:1.0.0";
const diagnosticKey = "sme-growth-twin:diagnostic:1.0.0";
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const stopTree = (child) => {
  if (!child?.pid) return;
  try { execFileSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true }); }
  catch { try { child.kill(); } catch {} }
};

const caseDraft = {
  schemaVersion: "1.0.0",
  sessionId: "assessment_phase03browser",
  status: "ready_for_review",
  currentStep: 6,
  twinRevision: 1,
  answers: {
    q1: { businessName: "Kopi Kita Café Group", industry: "food_beverage", businessModel: "b2c", employeeBand: "25_49", description: "Three Malaysian café outlets serving walk-in and catering customers." },
    q2: { websiteOrStore: "active", businessEmail: "not_used", cloudProductivity: "informal", crm: "not_used", digitalMarketingAnalytics: "active", backup: "not_used", cybersecurityControls: "informal", aiTools: "not_used" },
    q3: { biggestChallenge: "customer_management", manualWorkflow: "WhatsApp orders and catering enquiries", manualHoursPerWeek: null, affectedEmployees: 8, urgency: 4 },
    q4: { primaryObjective: "increase_revenue", budgetBand: "5k_15k", implementationPace: "1_3_months", highestConcern: "cost" },
    q5: { leadershipSponsorship: 4, usableData: 2, employeeDigitalSkills: 3, processConsistency: 2, changeWillingness: 4 },
  },
  selectedFollowUpIds: ["fu_manual_hours", "fu_customer_records", "fu_backup_frequency"],
  followUpAnswers: { fu_manual_hours: "11_20", fu_customer_records: "messaging_apps", fu_backup_frequency: "none" },
  updatedAt: "2026-09-18T09:00:00+08:00",
};

const lowConfidenceDraft = {
  ...caseDraft,
  sessionId: "assessment_phase03lowconfidence",
  answers: {
    ...caseDraft.answers,
    q2: { ...caseDraft.answers.q2, crm: "unknown", backup: "unknown", cybersecurityControls: "unknown", aiTools: "unknown" },
    q5: { leadershipSponsorship: 4, usableData: null, employeeDigitalSkills: null, processConsistency: null, changeWillingness: null },
  },
  selectedFollowUpIds: [],
  followUpAnswers: {},
};

const unknownDraft = {
  ...caseDraft,
  sessionId: "assessment_phase03unknowns",
  answers: {
    q1: caseDraft.answers.q1,
    q2: Object.fromEntries(Object.keys(caseDraft.answers.q2).map((key) => [key, "unknown"])),
    q3: { biggestChallenge: "other", challengeOther: "General planning", manualWorkflow: "General planning workflow", manualHoursPerWeek: null, affectedEmployees: null, urgency: 1 },
    q4: { ...caseDraft.answers.q4, primaryObjective: "improve_retention" },
    q5: { leadershipSponsorship: null, usableData: null, employeeDigitalSkills: null, processConsistency: null, changeWillingness: null },
  },
  selectedFollowUpIds: [],
  followUpAnswers: {},
};

let profile; let server; let chrome; let ws;
try {
  await mkdir(artifacts, { recursive: true });
  profile = await mkdtemp(path.join(tmpdir(), "sme-growth-twin-phase03-profile-"));
  const axeSource = await readFile(path.join(process.cwd(), "node_modules", "axe-core", "axe.min.js"), "utf8");
  let serverOutput = "";
  if (!configuredBaseUrl) {
    const localEnv = { ...process.env, AI_GATEWAY_MODEL: "", AI_GATEWAY_API_KEY: "", VERCEL_OIDC_TOKEN: "" };
    execFileSync(process.execPath, ["node_modules/next/dist/bin/next", "build"], { cwd: process.cwd(), env: localEnv, stdio: "inherit", windowsHide: true });
    server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--port", String(appPort)], { cwd: process.cwd(), env: localEnv, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
    server.stdout.on("data", (value) => { serverOutput += value.toString(); });
    server.stderr.on("data", (value) => { serverOutput += value.toString(); });
  }
  let ready = false;
  for (let attempt = 0; attempt < 120; attempt += 1) {
    try { if ((await fetch(baseUrl)).ok) { ready = true; break; } } catch {}
    await wait(500);
  }
  if (!ready) throw new Error(`Production server did not start: ${serverOutput.slice(-3000)}`);

  chrome = spawn(chromePath, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore", windowsHide: true });
  let endpoint;
  for (let attempt = 0; attempt < 80; attempt += 1) {
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
  const consoleErrors = [];
  const failedRequests = [];
  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const call = pending.get(message.id); pending.delete(message.id);
      if (message.error) call.reject(new Error(message.error.message)); else call.resolve(message.result);
    }
    if (message.method === "Runtime.exceptionThrown") consoleErrors.push(message.params.exceptionDetails.text);
    if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") consoleErrors.push(message.params.args.map((arg) => arg.value ?? arg.description).join(" "));
    if (message.method === "Network.responseReceived" && ["XHR", "Fetch"].includes(message.params.type) && message.params.response.url.startsWith(baseUrl) && message.params.response.status >= 400) failedRequests.push(`${message.params.response.status} ${message.params.response.url}`);
  });
  const cdp = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async (expression) => {
    const response = await cdp("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text);
    return response.result.value;
  };
  const poll = async (expression, expected, timeout = 20_000) => {
    const started = Date.now(); let actual;
    while (Date.now() - started < timeout) {
      try { actual = await evaluate(expression); } catch { actual = undefined; }
      if (actual === expected) return actual;
      await wait(120);
    }
    throw new Error(`Timed out: ${expression}; actual=${JSON.stringify(actual)}`);
  };
  const navigate = async (pathname) => {
    await cdp("Page.navigate", { url: `${baseUrl}${pathname}` });
    await poll("document.readyState", "complete");
  };
  const viewport = (width, height = 900) => cdp("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width <= 600 });
  const screenshot = async (name) => {
    const capture = await cdp("Page.captureScreenshot", { format: "png", fromSurface: true, captureBeyondViewport: true });
    await writeFile(path.join(artifacts, name), Buffer.from(capture.data, "base64"));
  };
  const setDraft = (draft) => evaluate(`localStorage.setItem(${JSON.stringify(draftKey)},${JSON.stringify(JSON.stringify(draft))})`);
  const clearDiagnostic = () => evaluate(`localStorage.removeItem(${JSON.stringify(diagnosticKey)})`);
  const readDiagnostic = () => evaluate(`JSON.parse(localStorage.getItem(${JSON.stringify(diagnosticKey)}))`);
  const click = (selector) => evaluate(`document.querySelector(${JSON.stringify(selector)})?.click()`);
  const key = async (name, code = name) => {
    const windowsVirtualKeyCode = name === "Tab" ? 9 : name === "Enter" ? 13 : 0;
    await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: name, code, windowsVirtualKeyCode, ...(name === "Enter" ? { text: "\r" } : {}) });
    await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: name, code, windowsVirtualKeyCode });
  };
  const tabTo = async (predicate, maximum = 100) => {
    await evaluate("document.activeElement?.blur()");
    for (let index = 0; index < maximum; index += 1) {
      await key("Tab");
      if (await evaluate(`(() => { const e=document.activeElement; return Boolean(e && (${predicate})); })()`)) return;
    }
    throw new Error(`Keyboard target not found: ${predicate}`);
  };
  const layoutChecks = [];
  const checkLayout = async (state, width) => {
    const result = await evaluate(`(() => {
      const controls=[...document.querySelectorAll('button,a,summary')].filter(e=>{const s=getComputedStyle(e);return e.getClientRects().length>0&&s.display!=='none'&&s.visibility!=='hidden'});
      const measured=controls.map(e=>({tag:e.tagName,text:(e.textContent||e.getAttribute('aria-label')||'').trim().slice(0,60),height:e.getBoundingClientRect().height,width:e.getBoundingClientRect().width}));
      return {overflow:document.documentElement.scrollWidth>window.innerWidth,overlay:Boolean(document.querySelector('[data-nextjs-dialog],.vite-error-overlay,#webpack-dev-server-client-overlay')),undersized:measured.filter(e=>e.height<43.5||e.width<43.5),visibleDashes:/[–—]/.test(document.body.innerText)};
    })()`);
    layoutChecks.push({ state, width, ...result });
    if (result.overflow || result.overlay || result.undersized.length || result.visibleDashes) throw new Error(`Layout gate failed ${state} ${width}: ${JSON.stringify(result)}`);
  };
  const accessibility = [];
  const axe = async (state) => {
    await evaluate(axeSource);
    const violations = await evaluate(`axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}}).then(r=>r.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.length,targets:v.nodes.map(n=>n.target)})))`);
    accessibility.push({ state, violations });
    if (violations.length) throw new Error(`Axe A/AA violations at ${state}: ${JSON.stringify(violations)}`);
  };
  const runFastAnalysis = async (draft) => {
    await setDraft(draft); await clearDiagnostic();
    await cdp("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
    const started = Date.now();
    await navigate("/assessment/analysis");
    await poll("location.pathname", "/results");
    await poll("document.body.innerText.includes('Analysis and diagnostic results.')", true);
    return Date.now() - started;
  };

  await cdp("Page.enable"); await cdp("Runtime.enable"); await cdp("Network.enable");
  await viewport(1440, 1000);
  await navigate("/");
  await evaluate("localStorage.clear();sessionStorage.clear()");

  const saveFailureScript = await cdp("Page.addScriptToEvaluateOnNewDocument", { source: `(() => { const original=Storage.prototype.setItem; Storage.prototype.setItem=function(key,value){ if(key===${JSON.stringify(diagnosticKey)}&&sessionStorage.getItem('phase03-fail-save')==='1') throw new DOMException('Forced evidence capture failure','QuotaExceededError'); return original.call(this,key,value); }; })();` });
  await setDraft(caseDraft);
  await evaluate("sessionStorage.setItem('phase03-fail-save','1')");
  await navigate("/assessment/analysis");
  await poll("document.querySelector('[data-analysis-state=error]')!==null", true);
  await screenshot("analysis-error-1440.png");
  const errorPreservedDraft = await evaluate(`JSON.parse(localStorage.getItem(${JSON.stringify(draftKey)})).sessionId===${JSON.stringify(caseDraft.sessionId)}`);
  await evaluate("sessionStorage.removeItem('phase03-fail-save')");
  await click(".analysis-error button");
  await poll("location.pathname", "/results");
  const retryRecovered = await evaluate("document.body.innerText.includes('37.5') && document.body.innerText.includes('42.5')");
  await cdp("Page.removeScriptToEvaluateOnNewDocument", { identifier: saveFailureScript.identifier });

  const validResult = await readDiagnostic();
  await cdp("Page.reload", { ignoreCache: true });
  await poll("document.body.innerText.includes('Analysis and diagnostic results.')", true);
  const restoredId = (await readDiagnostic()).id;
  const validRestore = restoredId === validResult.id;

  const recovery = {};
  await cdp("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  for (const [name, raw] of [
    ["corrupt", "{bad"],
    ["incompatible", JSON.stringify({ ...validResult, scoreModelVersion: "0.0.0" })],
    ["stale", JSON.stringify({ ...validResult, twinRevision: 999 })],
  ]) {
    await setDraft(caseDraft);
    await evaluate(`localStorage.setItem(${JSON.stringify(diagnosticKey)},${JSON.stringify(raw)})`);
    await navigate("/results");
    await poll("location.pathname", "/results");
    await poll("document.body.innerText.includes('Analysis and diagnostic results.')", true);
    const recovered = await readDiagnostic();
    recovery[name] = Boolean(recovered && recovered.id !== validResult.id && recovered.twinRevision === 1);
  }

  const beforeEditId = (await readDiagnostic()).id;
  await click(".edit-twin");
  await poll("location.pathname", "/assessment");
  const editState = await evaluate(`(() => { const d=JSON.parse(localStorage.getItem(${JSON.stringify(draftKey)})); return {revision:d.twinRevision,diagnosticCleared:localStorage.getItem(${JSON.stringify(diagnosticKey)})===null}; })()`);
  await evaluate(`(() => { const d=JSON.parse(localStorage.getItem(${JSON.stringify(draftKey)})); d.status='ready_for_review'; d.currentStep=6; d.updatedAt=new Date().toISOString(); localStorage.setItem(${JSON.stringify(draftKey)},JSON.stringify(d)); })()`);
  await navigate("/assessment/analysis");
  await poll("location.pathname", "/results");
  const editedResult = await readDiagnostic();
  const editRecomputed = editState.revision === 2 && editState.diagnosticCleared && editedResult.twinRevision === 2 && editedResult.id !== beforeEditId;

  const reducedMotionMs = await runFastAnalysis(caseDraft);
  const lowConfidenceMs = await runFastAnalysis(lowConfidenceDraft);
  const lowConfidence = await evaluate("document.body.innerText.includes('Low confidence') && document.body.innerText.includes('Some evidence is unavailable')");
  const unknownMs = await runFastAnalysis(unknownDraft);
  const insufficientEvidence = await evaluate("document.body.innerText.includes('Not available') && document.body.innerText.includes('More recorded evidence is needed') && document.body.innerText.includes('No evidence-linked pain finding was emitted')");

  await cdp("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "no-preference" }] });
  const widths = [
    { width: 1440, height: 1000, label: "1440" },
    { width: 1024, height: 900, label: "1024" },
    { width: 390, height: 844, label: "390" },
    { width: 360, height: 800, label: "360" },
  ];
  const progression = [];
  const screenshots = ["analysis-error-1440.png"];
  for (const size of widths) {
    await viewport(size.width, size.height);
    await setDraft(caseDraft); await clearDiagnostic();
    await navigate("/assessment/analysis");
    await poll("document.querySelector('[data-analysis-state=running]')!==null", true);
    progression.push(await evaluate(`(() => ({width:${size.width},step:document.querySelector('.analysis-state-label')?.textContent,heading:document.querySelector('.analysis-sequence h2')?.textContent}))()`));
    await checkLayout("analysis", size.width);
    await screenshot(`analysis-${size.label}.png`); screenshots.push(`analysis-${size.label}.png`);
    await poll("location.pathname", "/results");
    await poll("document.body.innerText.includes('Analysis and diagnostic results.')", true);
    await checkLayout("results", size.width);
    await screenshot(`results-${size.label}.png`); screenshots.push(`results-${size.label}.png`);
    await click(".score-panel details summary");
    await checkLayout("score evidence expanded", size.width);
    await screenshot(`score-evidence-${size.label}.png`); screenshots.push(`score-evidence-${size.label}.png`);
    await click(".score-panel details summary");
    await click(".pain-detail summary");
    await checkLayout("pain evidence expanded", size.width);
    await screenshot(`pain-evidence-${size.label}.png`); screenshots.push(`pain-evidence-${size.label}.png`);
  }

  await viewport(1440, 1000);
  await navigate("/results");
  await poll("document.body.innerText.includes('Analysis and diagnostic results.')", true);
  await axe("results desktop");
  await tabTo("e.matches('summary') && e.closest('.score-panel')");
  const focusStyle = await evaluate(`(() => { const s=getComputedStyle(document.activeElement); return {tag:document.activeElement.tagName,outlineStyle:s.outlineStyle,outlineWidth:s.outlineWidth}; })()`);
  await key("Enter");
  const keyboardDisclosure = await evaluate("document.activeElement.closest('details')?.open===true");

  await setDraft(caseDraft); await clearDiagnostic();
  await navigate("/assessment/analysis");
  await axe("analysis desktop");
  await viewport(390, 844);
  await axe("analysis mobile");
  await poll("location.pathname", "/results");
  await axe("results mobile");

  const caseAValues = await evaluate(`(() => { const d=JSON.parse(localStorage.getItem(${JSON.stringify(diagnosticKey)})); return {maturity:d.digitalMaturity.value,readiness:d.aiReadiness.value,pains:d.painPoints.slice(0,3).map(p=>p.id)}; })()`);
  const overlay = await evaluate("Boolean(document.querySelector('[data-nextjs-dialog],.vite-error-overlay,#webpack-dev-server-client-overlay'))");
  const evidence = {
    environment: { node: process.version, chromePath, baseUrl, mode: configuredBaseUrl ? "external" : "local-production" },
    screenshots,
    analysis: { progression, errorPreservedDraft, retryRecovered, reducedMotionMs },
    restoration: { validRestore, recovery },
    edit: { ...editState, recomputed: editRecomputed },
    states: { lowConfidence, lowConfidenceMs, insufficientEvidence, unknownMs },
    caseAValues,
    accessibility,
    layoutChecks,
    keyboard: { disclosureOpened: keyboardDisclosure, focusStyle },
    consoleErrors,
    failedRequests,
    overlay,
  };
  await writeFile(path.join(artifacts, "browser-evidence.json"), `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify(evidence, null, 2));
  const recoveryPassed = Object.values(recovery).every(Boolean);
  const focusVisible = focusStyle.outlineStyle !== "none" && Number.parseFloat(focusStyle.outlineWidth) >= 2;
  if (!errorPreservedDraft || !retryRecovered || !validRestore || !recoveryPassed || !editRecomputed || !lowConfidence || !insufficientEvidence || caseAValues.maturity !== 37.5 || caseAValues.readiness !== 42.5 || !keyboardDisclosure || !focusVisible || consoleErrors.length || failedRequests.length || overlay) throw new Error("Phase 03 browser assertions failed");
  await cdp("Browser.close");
} finally {
  try { ws?.close(); } catch {}
  stopTree(chrome); stopTree(server);
  await wait(400);
  if (profile) {
    try { await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 250 }); }
    catch (error) { console.warn(`Temporary Chrome profile cleanup deferred: ${error.message}`); }
  }
}
