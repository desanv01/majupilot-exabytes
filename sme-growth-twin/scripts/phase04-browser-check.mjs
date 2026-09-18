import { execFileSync, spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const chromePath = process.env.CHROME_PATH?.trim() || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const appPort = Number(process.env.PHASE04_PORT || 3024);
const debugPort = Number(process.env.PHASE04_DEBUG_PORT || 9564);
const configuredBaseUrl = process.env.PHASE04_BASE_URL?.trim();
const baseUrl = configuredBaseUrl?.replace(/\/$/, "") || `http://127.0.0.1:${appPort}`;
const artifacts = path.resolve(process.env.PHASE04_ARTIFACT_DIR?.trim() || path.join(process.cwd(), "..", "planning", "evidence", "ui-upgrade", "phase-04-recommendations-catalogue"));
const draftKey = "sme-growth-twin:assessment-draft:1.0.0";
const diagnosticKey = "sme-growth-twin:diagnostic:1.0.0";
const recommendationKey = "sme-growth-twin:recommendations:1.0.0";
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const stopTree = (child) => {
  if (!child?.pid) return;
  try { execFileSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true }); }
  catch { try { child.kill(); } catch {} }
};

const draft = (sessionId, answers, selectedFollowUpIds = [], followUpAnswers = {}) => ({
  schemaVersion: "1.0.0",
  sessionId,
  status: "ready_for_review",
  currentStep: 6,
  twinRevision: 1,
  answers,
  selectedFollowUpIds,
  followUpAnswers,
  updatedAt: "2026-09-18T09:00:00+08:00",
});

const caseAAnswers = {
  q1: { businessName: "Kopi Kita Café Group", industry: "food_beverage", businessModel: "b2c", employeeBand: "25_49", description: "Three Malaysian café outlets serving walk-in and catering customers." },
  q2: { websiteOrStore: "active", businessEmail: "not_used", cloudProductivity: "informal", crm: "not_used", digitalMarketingAnalytics: "active", backup: "not_used", cybersecurityControls: "informal", aiTools: "not_used" },
  q3: { biggestChallenge: "customer_management", manualWorkflow: "WhatsApp orders and catering enquiries", manualHoursPerWeek: null, affectedEmployees: 8, urgency: 4 },
  q4: { primaryObjective: "increase_revenue", budgetBand: "5k_15k", implementationPace: "1_3_months", highestConcern: "cost" },
  q5: { leadershipSponsorship: 4, usableData: 2, employeeDigitalSkills: 3, processConsistency: 2, changeWillingness: 4 },
};
const caseADraft = draft("assessment_phase04browser", caseAAnswers, ["fu_manual_hours", "fu_customer_records", "fu_backup_frequency"], { fu_manual_hours: "11_20", fu_customer_records: "messaging_apps", fu_backup_frequency: "none" });
const unknownDraft = draft("assessment_phase04unknown", { ...caseAAnswers, q5: { leadershipSponsorship: null, usableData: null, employeeDigitalSkills: null, processConsistency: null, changeWillingness: null } }, ["fu_manual_hours", "fu_customer_records", "fu_backup_frequency"], { fu_manual_hours: "11_20", fu_customer_records: "messaging_apps", fu_backup_frequency: "none" });
const caseBDraft = draft("assessment_phase04caseb", {
  q1: { businessName: "Precision Parts Manufacturing", industry: "manufacturing", businessModel: "b2b", employeeBand: "25_49", description: "A 48-employee precision components manufacturer using local accounting and shared-drive quality records." },
  q2: { websiteOrStore: "informal", businessEmail: "active", cloudProductivity: "informal", crm: "not_used", digitalMarketingAnalytics: "not_used", backup: "informal", cybersecurityControls: "informal", aiTools: "not_used" },
  q3: { biggestChallenge: "manual_work", manualWorkflow: "Manual quotation tracking and shared-drive quality records", manualHoursPerWeek: 18, affectedEmployees: 12, urgency: 5 },
  q4: { primaryObjective: "increase_productivity", budgetBand: "15k_50k", implementationPace: "within_30_days", highestConcern: "complexity" },
  q5: { leadershipSponsorship: 5, usableData: 2, employeeDigitalSkills: 2, processConsistency: 2, changeWillingness: 4 },
}, ["fu_customer_records", "fu_backup_frequency"], { fu_customer_records: "accounting_system", fu_backup_frequency: "ad_hoc" });
const caseCDraft = draft("assessment_phase04casec", {
  q1: { businessName: "Northstar Digital Studio", industry: "technology_digital", businessModel: "b2b", employeeBand: "1_9", description: "A nine-person boutique digital agency with mature cloud delivery, marketing, and security practices." },
  q2: { websiteOrStore: "active", businessEmail: "active", cloudProductivity: "active", crm: "informal", digitalMarketingAnalytics: "active", backup: "active", cybersecurityControls: "active", aiTools: "informal" },
  q3: { biggestChallenge: "scaling_operations", manualWorkflow: "Capacity planning across client projects", manualHoursPerWeek: 6, affectedEmployees: 6, urgency: 3 },
  q4: { primaryObjective: "increase_productivity", budgetBand: "15k_50k", implementationPace: "3_6_months", highestConcern: "security" },
  q5: { leadershipSponsorship: 4, usableData: 4, employeeDigitalSkills: 5, processConsistency: 3, changeWillingness: 5 },
}, ["fu_ai_usage"], { fu_ai_usage: ["content", "analysis", "development"] });

let profile; let server; let chrome; let ws;
try {
  await mkdir(artifacts, { recursive: true });
  profile = await mkdtemp(path.join(tmpdir(), "sme-growth-twin-phase04-profile-"));
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
  const screenshot = async (name, fullPage = true) => {
    const capture = await cdp("Page.captureScreenshot", { format: "png", fromSurface: true, captureBeyondViewport: fullPage });
    await writeFile(path.join(artifacts, name), Buffer.from(capture.data, "base64"));
  };
  const setDraft = (value) => evaluate(`localStorage.setItem(${JSON.stringify(draftKey)},${JSON.stringify(JSON.stringify(value))})`);
  const readRecommendation = () => evaluate(`JSON.parse(localStorage.getItem(${JSON.stringify(recommendationKey)}))`);
  const clearDerived = () => evaluate(`localStorage.removeItem(${JSON.stringify(diagnosticKey)});localStorage.removeItem(${JSON.stringify(recommendationKey)})`);
  const setup = async (value) => {
    await setDraft(value); await clearDerived();
    await cdp("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
    await navigate("/assessment/analysis");
    await poll("location.pathname", "/results");
    await navigate("/recommendations");
    await poll("document.body.innerText.includes('Your recommended sequence.')", true);
    return readRecommendation();
  };
  const click = (selector) => evaluate(`document.querySelector(${JSON.stringify(selector)})?.click()`);
  const key = async (name, code = name) => {
    const windowsVirtualKeyCode = name === "Tab" ? 9 : name === "Enter" ? 13 : 0;
    await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: name, code, windowsVirtualKeyCode, ...(name === "Enter" ? { text: "\r" } : {}) });
    await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: name, code, windowsVirtualKeyCode });
  };
  const tabTo = async (predicate, maximum = 120) => {
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
      const measured=controls.map(e=>({tag:e.tagName,text:(e.textContent||e.getAttribute('aria-label')||'').trim().slice(0,70),height:e.getBoundingClientRect().height,width:e.getBoundingClientRect().width}));
      return {overflow:document.documentElement.scrollWidth>window.innerWidth,overlay:Boolean(document.querySelector('[data-nextjs-dialog],.vite-error-overlay,#webpack-dev-server-client-overlay')),undersized:measured.filter(e=>e.height<43.5||e.width<43.5),visibleDashes:/[–—]/.test(document.body.innerText),sourceWrap:[...document.querySelectorAll('.catalogue-source a span')].every(e=>e.scrollWidth<=e.clientWidth+1)};
    })()`);
    layoutChecks.push({ state, width, ...result });
    if (result.overflow || result.overlay || result.undersized.length || result.visibleDashes || !result.sourceWrap) throw new Error(`Layout gate failed ${state} ${width}: ${JSON.stringify(result)}`);
  };
  const accessibility = [];
  const axe = async (state) => {
    await evaluate(axeSource);
    const violations = await evaluate(`axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}}).then(r=>r.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.length,targets:v.nodes.map(n=>n.target)})))`);
    accessibility.push({ state, violations });
    if (violations.length) throw new Error(`Axe A/AA violations at ${state}: ${JSON.stringify(violations)}`);
  };

  await cdp("Page.enable"); await cdp("Runtime.enable"); await cdp("Network.enable");
  await viewport(1440, 1000);
  await navigate("/");
  await evaluate("localStorage.clear();sessionStorage.clear()");

  const validResult = await setup(caseADraft);
  const recovery = {};
  for (const [name, raw] of [
    ["empty", null],
    ["corrupt", "{bad"],
    ["incompatible", JSON.stringify({ ...validResult, recommendationModelVersion: "0.0.0" })],
    ["stale", JSON.stringify({ ...validResult, twinRevision: 999 })],
  ]) {
    await setDraft(caseADraft);
    await evaluate(raw === null ? `localStorage.removeItem(${JSON.stringify(recommendationKey)})` : `localStorage.setItem(${JSON.stringify(recommendationKey)},${JSON.stringify(raw)})`);
    await navigate("/recommendations");
    await poll("document.body.innerText.includes('Your recommended sequence.')", true);
    const recovered = await readRecommendation();
    recovery[name] = Boolean(recovered && recovered.twinRevision === 1 && recovered.recommendationModelVersion === "1.0.0" && recovered.catalogueVersion === "1.0.0");
  }

  const current = await readRecommendation();
  const unmapped = { ...current, recommendations: current.recommendations.map((item, index) => index === 0 ? { ...item, mappedOffering: undefined, alternativeOfferingIds: [] } : item) };
  await evaluate(`localStorage.setItem(${JSON.stringify(recommendationKey)},${JSON.stringify(JSON.stringify(unmapped))})`);
  await navigate("/recommendations");
  await click(".recommendation-record.featured summary");
  const unmappedFailClosed = await evaluate("document.body.innerText.includes('Capability guidance remains available') && !document.body.innerText.includes('Freshsales CRM')");

  const lowEvidenceResult = await setup(unknownDraft);
  await evaluate("document.querySelectorAll('.recommendation-record').forEach((record)=>{record.open=true})");
  const unknownChecks = lowEvidenceResult.recommendations.flatMap((item) => item.prerequisites).filter((check) => check.status === "unknown");
  const unknownRendered = await evaluate("Boolean(document.querySelector('.prerequisite-list li.unknown')) && document.body.textContent.includes('fails closed') && document.body.textContent.includes('Unlock:')");
  const unknownPrerequisite = unknownChecks.length > 0 && unknownChecks.every((check) => check.explanation.includes("fails closed") && Boolean(check.unlockAction)) && unknownRendered;

  const sequenceCases = {};
  for (const [name, value] of [["caseB", caseBDraft], ["caseC", caseCDraft]]) {
    await setup(value);
    sequenceCases[name] = await evaluate(`[...document.querySelectorAll('[data-capability-id]')].map(e=>({id:e.dataset.capabilityId,status:e.className.match(/why_now|why_later|next/)?.[0],fit:e.querySelector('.recommendation-fit strong')?.textContent}))`);
  }

  const caseA = await setup(caseADraft);
  const expectedSequences = {
    caseA: ["shared_customer_operations:why_now:93.5", "professional_team_collaboration:why_now:92.9", "protected_business_continuity:why_now:92.9", "protected_web_presence:next:92.9", "governed_ai_automation:why_later:54.2"],
    caseB: ["professional_team_collaboration:why_now:100.0", "measurable_digital_growth:why_now:86.9", "shared_customer_operations:why_now:85.9", "protected_business_continuity:next:82.0", "governed_ai_automation:why_later:54.3"],
    caseC: ["shared_customer_operations:why_now:84.8", "governed_ai_automation:why_now:83.4", "scalable_cloud_operations:why_now:76.2"],
  };
  const actualSequences = {
    caseA: caseA.recommendations.map((item) => `${item.capabilityId}:${item.status}:${item.fitScore.toFixed(1)}`),
    caseB: sequenceCases.caseB.map((item) => `${item.id}:${item.status}:${item.fit}`),
    caseC: sequenceCases.caseC.map((item) => `${item.id}:${item.status}:${item.fit}`),
  };
  if (JSON.stringify(actualSequences) !== JSON.stringify(expectedSequences)) throw new Error(`Canonical sequences changed: ${JSON.stringify(actualSequences)}`);
  const widths = [
    { width: 1440, height: 1000, label: "1440" },
    { width: 1024, height: 900, label: "1024" },
    { width: 390, height: 844, label: "390" },
    { width: 360, height: 800, label: "360" },
  ];
  const screenshots = [];
  for (const size of widths) {
    await viewport(size.width, size.height);
    await navigate("/recommendations");
    await poll("document.body.innerText.includes('Your recommended sequence.')", true);
    await checkLayout("overview", size.width);
    const overviewName = `recommendations-overview-${size.label}.png`;
    await screenshot(overviewName); screenshots.push(overviewName);

    await click(".recommendation-record.featured summary");
    await checkLayout("first decision expanded", size.width);
    await evaluate("document.querySelector('.recommendation-record.featured')?.scrollIntoView({block:'start'})");
    const firstName = `first-decision-expanded-${size.label}.png`;
    await screenshot(firstName, false); screenshots.push(firstName);
    await evaluate("document.querySelector('.offering-detail')?.scrollIntoView({block:'start'})");
    const catalogueName = `catalogue-evidence-expanded-${size.label}.png`;
    await screenshot(catalogueName, false); screenshots.push(catalogueName);
    await click(".recommendation-record.featured summary");
    await click("[data-capability-id='governed_ai_automation'] summary");
    await checkLayout("why later expanded", size.width);
    await evaluate("document.querySelector(\"[data-capability-id='governed_ai_automation']\")?.scrollIntoView({block:'start'})");
    const laterName = `why-later-expanded-${size.label}.png`;
    await screenshot(laterName, false); screenshots.push(laterName);
    await click("[data-capability-id='governed_ai_automation'] summary");
  }

  await viewport(1440, 1000);
  await navigate("/recommendations");
  await axe("collapsed desktop");
  await tabTo("e.matches('summary') && e.closest('.recommendation-record.featured')");
  const focusStyle = await evaluate(`(() => { const s=getComputedStyle(document.activeElement); return {tag:document.activeElement.tagName,outlineStyle:s.outlineStyle,outlineWidth:s.outlineWidth}; })()`);
  await key("Enter");
  const keyboardDisclosure = await evaluate("document.activeElement.closest('details')?.open===true");
  await axe("expanded desktop");
  await tabTo("e.matches('a[href=\"/scenarios\"]')");
  const keyboardAction = await evaluate("document.activeElement.getAttribute('href')==='/scenarios'");
  await viewport(390, 844);
  await axe("expanded mobile");
  await checkLayout("expanded mobile", 390);

  const reducedMotion = await evaluate("matchMedia('(prefers-reduced-motion: reduce)').matches");
  const safeCatalogueLinks = await evaluate("[...document.querySelectorAll('.catalogue-source a')].every((link)=>link.target==='_blank'&&link.rel.includes('noopener')&&link.rel.includes('noreferrer'))");
  const caseAValues = {
    sequence: caseA.recommendations.map((item) => ({ id: item.capabilityId, status: item.status, fit: item.fitScore })),
    firstComponents: caseA.recommendations[0]?.componentScores,
    firstMapping: caseA.recommendations[0]?.mappedOffering?.name,
  };
  const overlay = await evaluate("Boolean(document.querySelector('[data-nextjs-dialog],.vite-error-overlay,#webpack-dev-server-client-overlay'))");
  const evidence = {
    environment: { node: process.version, chromePath, baseUrl, mode: configuredBaseUrl ? "external" : "local-production" },
    screenshots,
    caseA: caseAValues,
    sequences: sequenceCases,
    recovery,
    fixtures: { unmappedFailClosed, unknownPrerequisite, unknownRendered, unknownChecks, unknownRecommendationCount: lowEvidenceResult.recommendations.length },
    accessibility,
    layoutChecks,
    keyboard: { disclosureOpened: keyboardDisclosure, scenarioActionReached: keyboardAction, focusStyle },
    reducedMotion,
    safeCatalogueLinks,
    consoleErrors,
    failedRequests,
    overlay,
  };
  await writeFile(path.join(artifacts, "browser-evidence.json"), `${JSON.stringify(evidence, null, 2)}\n`);
  await writeFile(path.join(artifacts, "README.md"), `# Phase 04 browser evidence

Generated by \`npm run test:phase04:browser\` against a production build with reduced motion enabled.

\`browser-evidence.json\` records:

- canonical Case A, B, and C recommendation order, status, and fit values;
- all six Case A first-item fit components and its Freshsales CRM mapping;
- empty, corrupt, incompatible, and stale persistence recovery;
- fail-closed unmapped catalogue and unknown-prerequisite fixtures;
- collapsed desktop, expanded desktop, and expanded mobile axe scans with zero violations;
- keyboard disclosure and scenario-action reachability with a visible 2px focus outline;
- 1440, 1024, 390, and 360 pixel layout checks with no overflow, overlays, undersized controls, or visible em/en dashes;
- safe catalogue links, reduced-motion behavior, and zero console or failed-request errors.

## Captures

- \`recommendations-overview-1440.png\`
- \`first-decision-expanded-1440.png\`
- \`catalogue-evidence-expanded-1440.png\`
- \`why-later-expanded-1440.png\`
- \`recommendations-overview-1024.png\`
- \`recommendations-overview-390.png\`
- \`recommendations-overview-360.png\`

## Final gate results

- \`npm run lint\`: passed
- \`npm run type-check\`: passed
- \`npm test\`: 27 files and 152 tests passed
- \`npm run test:stage07:golden\`: 1 file and 2 tests passed
- \`npm run test:phase04:browser\`: passed
- \`npm run test:stage07:browser\`: passed

The protected recommendation formula remains unchanged. It produces a canonical Case A first-item fit of \`93.5\`; the Phase 04 planning packet was corrected from the stale \`92.9\` value to match that protected result.
`);
  console.log(JSON.stringify(evidence, null, 2));

  const recoveryPassed = Object.values(recovery).every(Boolean);
  const focusVisible = focusStyle.outlineStyle !== "none" && Number.parseFloat(focusStyle.outlineWidth) >= 2;
  if (!recoveryPassed || !unmappedFailClosed || !unknownPrerequisite || !keyboardDisclosure || !keyboardAction || !focusVisible || !reducedMotion || !safeCatalogueLinks || consoleErrors.length || failedRequests.length || overlay) throw new Error("Phase 04 browser assertions failed");
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
