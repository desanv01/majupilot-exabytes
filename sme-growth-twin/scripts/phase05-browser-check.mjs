import { execFileSync, spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const chromePath = process.env.CHROME_PATH?.trim() || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const appPort = Number(process.env.PHASE05_PORT || 3025);
const debugPort = Number(process.env.PHASE05_DEBUG_PORT || 9565);
const configuredBaseUrl = process.env.PHASE05_BASE_URL?.trim();
const baseUrl = configuredBaseUrl?.replace(/\/$/, "") || `http://127.0.0.1:${appPort}`;
const artifacts = path.resolve(process.env.PHASE05_ARTIFACT_DIR?.trim() || path.join(process.cwd(), "..", "planning", "evidence", "ui-upgrade", "phase-05-scenario-roi"));
const draftKey = "sme-growth-twin:assessment-draft:1.0.0";
const diagnosticKey = "sme-growth-twin:diagnostic:1.0.0";
const recommendationKey = "sme-growth-twin:recommendations:1.0.0";
const scenarioKey = "sme-growth-twin:scenarios:1.0.0";
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const stopTree = (child) => {
  if (!child?.pid) return;
  try { execFileSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true }); }
  catch { try { child.kill(); } catch {} }
};

const caseADraft = {
  schemaVersion: "1.0.0",
  sessionId: "assessment_phase05browser",
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
  updatedAt: "2026-09-19T09:00:00+08:00",
};

let profile; let server; let chrome; let ws;
try {
  await mkdir(artifacts, { recursive: true });
  profile = await mkdtemp(path.join(tmpdir(), "sme-growth-twin-phase05-profile-"));
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
  const viewport = (width, height = 900) => cdp("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
  const screenshot = async (name, fullPage = true) => {
    let params = { format: "png", fromSurface: true, captureBeyondViewport: false };
    if (fullPage) {
      const metrics = await cdp("Page.getLayoutMetrics");
      params = { format: "png", fromSurface: true, captureBeyondViewport: true, clip: { x: 0, y: 0, width: Math.ceil(metrics.cssContentSize.width), height: Math.ceil(metrics.cssContentSize.height), scale: 1 } };
    }
    const capture = await cdp("Page.captureScreenshot", params);
    await writeFile(path.join(artifacts, name), Buffer.from(capture.data, "base64"));
  };
  const click = (selector) => evaluate(`document.querySelector(${JSON.stringify(selector)})?.click()`);
  const scrollTo = (selector) => evaluate(`document.querySelector(${JSON.stringify(selector)})?.scrollIntoView({block:'start'})`);
  const setInput = (selector, value) => evaluate(`(() => { const input=document.querySelector(${JSON.stringify(selector)}); if(!input) return false; const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; setter.call(input,${JSON.stringify(value)}); input.dispatchEvent(new Event('input',{bubbles:true})); return true; })()`);
  const readScenario = () => evaluate(`JSON.parse(localStorage.getItem(${JSON.stringify(scenarioKey)}))`);
  const setScenario = (raw) => evaluate(raw === null ? `localStorage.removeItem(${JSON.stringify(scenarioKey)})` : `localStorage.setItem(${JSON.stringify(scenarioKey)},${JSON.stringify(raw)})`);
  const key = async (name, code = name) => {
    const windowsVirtualKeyCode = name === "Tab" ? 9 : name === "Enter" ? 13 : 0;
    await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: name, code, windowsVirtualKeyCode, ...(name === "Enter" ? { text: "\r" } : {}) });
    await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: name, code, windowsVirtualKeyCode });
  };
  const tabTo = async (predicate, maximum = 180) => {
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
      const controls=[...document.querySelectorAll('button,a,summary,input')].filter(e=>{const s=getComputedStyle(e);return e.getClientRects().length>0&&s.display!=='none'&&s.visibility!=='hidden'});
      const measured=controls.map(e=>({tag:e.tagName,text:(e.textContent||e.getAttribute('aria-label')||'').trim().slice(0,80),height:e.getBoundingClientRect().height,width:e.getBoundingClientRect().width}));
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
    if (violations.some((violation) => ["critical", "serious"].includes(violation.impact))) throw new Error(`Axe critical/serious violations at ${state}: ${JSON.stringify(violations)}`);
  };
  const setupCaseA = async () => {
    await evaluate(`localStorage.setItem(${JSON.stringify(draftKey)},${JSON.stringify(JSON.stringify(caseADraft))});localStorage.removeItem(${JSON.stringify(diagnosticKey)});localStorage.removeItem(${JSON.stringify(recommendationKey)});localStorage.removeItem(${JSON.stringify(scenarioKey)});`);
    await navigate("/assessment/analysis");
    await poll("location.pathname", "/results");
    await navigate("/recommendations");
    await poll("document.body.innerText.includes('Your recommended sequence.')", true);
    await navigate("/scenarios");
    await poll("document.body.innerText.includes('Choose a path with the evidence in view.')", true);
    return readScenario();
  };
  const freshScenario = async (token) => {
    await setScenario(null);
    await navigate(`/scenarios?fresh=${token}`);
    await poll("document.body.innerText.includes('Choose a path with the evidence in view.')", true);
    await poll("document.querySelector('.scenario-recovery')?.dataset.recoveryStatus", "empty");
    return readScenario();
  };

  await cdp("Page.enable"); await cdp("Runtime.enable"); await cdp("Network.enable");
  await cdp("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await viewport(1440, 1000);
  await navigate("/");
  await evaluate("localStorage.clear();sessionStorage.clear()");

  const baseline = await setupCaseA();
  const expectedCaseA = [
    { id: "lean_foundation", cost: { low: 5640, base: 11280, high: 16920 }, operational: { low: 1088, base: 3778, high: 8392 }, net: { low: -15832, base: -7502, high: 2752 }, payback: { status: "estimated", best: 8.1, base: 35.8, worst: 186.6 }, budgetFit: "base_within", conditional: null },
    { id: "balanced_growth", cost: { low: 9200, base: 18400, high: 27600 }, operational: { low: 2358, base: 7254, high: 15233 }, net: { low: -25242, base: -11146, high: 6033 }, payback: { status: "estimated", best: 7.2, base: 30.4, worst: 140.5 }, budgetFit: "only_low_within", conditional: null },
    { id: "accelerated_ai", cost: { low: 10320, base: 20640, high: 30960 }, operational: { low: 2327, base: 8312, high: 17377 }, net: { low: -28633, base: -12328, high: 7057 }, payback: { status: "estimated", best: 7.1, base: 29.8, worst: 159.6 }, budgetFit: "only_low_within", conditional: { low: 7200, base: 14400, high: 21600 } },
  ];
  const caseAValues = baseline.scenarios.map((scenario) => ({ id: scenario.templateId, cost: scenario.costs.firstYear, operational: scenario.value.operational.range, net: scenario.value.net.range, payback: scenario.value.payback, budgetFit: scenario.budgetFit, conditional: scenario.costs.conditionalExpansionCost }));
  if (JSON.stringify(caseAValues) !== JSON.stringify(expectedCaseA)) throw new Error(`Frozen Case A changed: ${JSON.stringify(caseAValues)}`);
  const defaultState = await evaluate(`({focused:document.querySelector('.scenario-path.is-focused')?.dataset.scenario,preferred:Boolean(document.querySelector('.scenario-path.is-preferred')),blueprint:Boolean(document.querySelector('a[href="/blueprint"]')),months:document.querySelectorAll('[data-month]').length,notEstimated:(document.body.innerText.match(/Not estimated/g)||[]).length,conditional:document.body.innerText.includes('Conditional scope, outside committed economics')&&document.body.innerText.includes('Excluded while the gate is blocked')})`);
  if (defaultState.focused !== "balanced_growth" || defaultState.preferred || defaultState.blueprint || defaultState.months !== 12 || defaultState.notEstimated < 6 || !defaultState.conditional) throw new Error(`Default state failed: ${JSON.stringify(defaultState)}`);

  const recovery = {};
  for (const [name, raw] of [
    ["empty", null],
    ["corrupt", "{bad"],
    ["incompatible", JSON.stringify({ ...baseline, scenarioModelVersion: "9.9.9" })],
    ["stale", JSON.stringify({ ...baseline, twinRevision: 999 })],
  ]) {
    await setScenario(raw);
    await navigate(`/scenarios?recovery=${name}`);
    await poll("document.body.innerText.includes('Choose a path with the evidence in view.')", true);
    await poll("document.querySelector('.scenario-recovery')?.dataset.recoveryStatus", name);
    const rebuilt = await readScenario();
    recovery[name] = Boolean(rebuilt && rebuilt.scenarioModelVersion === "1.0.0" && rebuilt.roiModelVersion === "1.0.0" && rebuilt.twinRevision === 1);
  }

  await freshScenario("restore");
  await click(".balanced_growth .select-action");
  await setInput('input[name="balanced_growth.operational.loadedHourlyCost.base"]', "30");
  await poll(`JSON.parse(localStorage.getItem(${JSON.stringify(scenarioKey)})).scenarios.find(s=>s.templateId==='balanced_growth').assumptions.operational.loadedHourlyCost.range.base`, 30);
  await navigate("/scenarios?restored=1");
  await poll("document.body.innerText.includes('Choose a path with the evidence in view.')", true);
  const persistedRestore = await evaluate(`(() => { const saved=JSON.parse(localStorage.getItem(${JSON.stringify(scenarioKey)})); const item=saved.scenarios.find(s=>s.templateId==='balanced_growth').assumptions.operational.loadedHourlyCost; return {preferred:document.querySelector('.balanced_growth.is-preferred')!==null,value:document.querySelector('input[name="balanced_growth.operational.loadedHourlyCost.base"]')?.value,source:item.source,sourceRef:item.sourceRef,blueprint:Boolean(document.querySelector('a[href="/blueprint"]'))}; })()`);
  if (!persistedRestore.preferred || persistedRestore.value !== "30" || persistedRestore.source !== "user_override" || persistedRestore.sourceRef !== "scenario-lab-edit" || !persistedRestore.blueprint) throw new Error(`Restore failed: ${JSON.stringify(persistedRestore)}`);

  const widths = [
    { width: 1440, height: 1000, label: "1440" },
    { width: 1024, height: 900, label: "1024" },
    { width: 390, height: 844, label: "390" },
    { width: 360, height: 800, label: "360" },
  ];
  const screenshots = [];
  const interactionResults = [];
  for (const size of widths) {
    await viewport(size.width, size.height);
    await freshScenario(size.label);
    await poll("window.innerWidth", size.width);
    await checkLayout("comparison", size.width);
    const comparisonName = `comparison-${size.label}.png`; await screenshot(comparisonName); screenshots.push(comparisonName);

    await click(".lean_foundation .inspect-action");
    await poll("document.querySelector('.scenario-detail-lab')?.dataset.focusedScenario", "lean_foundation");
    await scrollTo(".scenario-detail-lab"); await checkLayout("lean focused detail", size.width);
    const detailName = `focused-detail-${size.label}.png`; await screenshot(detailName, false); screenshots.push(detailName);

    await click(".accelerated_ai .inspect-action");
    await poll("document.querySelector('.scenario-detail-lab')?.dataset.focusedScenario", "accelerated_ai");
    const conditionalVisible = await evaluate("document.body.innerText.includes('Blocked conditional gate: Governed AI automation') && document.body.innerText.includes('outside the committed scenario')");
    await scrollTo(".conditional-gate"); await checkLayout("conditional AI detail", size.width);
    const conditionalName = `conditional-ai-${size.label}.png`; await screenshot(conditionalName, false); screenshots.push(conditionalName);

    await click(".balanced_growth .inspect-action");
    await click(".assumption-section.revenue summary");
    await poll("document.querySelector('.assumption-section.revenue')?.open", true);
    await scrollTo(".assumptions-workbench"); await checkLayout("assumptions expanded", size.width);
    const assumptionsName = `assumptions-${size.label}.png`; await screenshot(assumptionsName, false); screenshots.push(assumptionsName);

    await setInput('input[name="balanced_growth.operational.loadedHourlyCost.base"]', "30");
    await poll(`JSON.parse(localStorage.getItem(${JSON.stringify(scenarioKey)})).scenarios.find(s=>s.templateId==='balanced_growth').assumptions.operational.loadedHourlyCost.range.base`, 30);
    const validEdit = await evaluate(`(() => { const saved=JSON.parse(localStorage.getItem(${JSON.stringify(scenarioKey)})); const scenario=saved.scenarios.find(s=>s.templateId==='balanced_growth'); const assumption=scenario.assumptions.operational.loadedHourlyCost; return {value:assumption.range.base,source:assumption.source,sourceRef:assumption.sourceRef,operational:scenario.value.operational.range.base,visible:document.querySelector('.live-result-summary')?.innerText}; })()`);
    await scrollTo('input[name="balanced_growth.operational.loadedHourlyCost.base"]');
    await checkLayout("valid edit", size.width);
    const validName = `valid-edit-${size.label}.png`; await screenshot(validName, false); screenshots.push(validName);

    const lastValid = validEdit.operational;
    await setInput('input[name="balanced_growth.operational.loadedHourlyCost.base"]', "");
    await poll(`document.querySelector('input[name="balanced_growth.operational.loadedHourlyCost.base"]')?.getAttribute('aria-invalid')`, "true");
    const invalidEdit = await evaluate(`(() => { const saved=JSON.parse(localStorage.getItem(${JSON.stringify(scenarioKey)})); return {operational:saved.scenarios.find(s=>s.templateId==='balanced_growth').value.operational.range.base,error:Boolean(document.querySelector('input[name="balanced_growth.operational.loadedHourlyCost.base"] + small + .field-error, input[name="balanced_growth.operational.loadedHourlyCost.base"]')?.getAttribute('aria-invalid')==='true')}; })()`);
    await scrollTo('input[name="balanced_growth.operational.loadedHourlyCost.base"]');
    await checkLayout("invalid edit", size.width);
    const invalidName = `invalid-edit-${size.label}.png`; await screenshot(invalidName, false); screenshots.push(invalidName);

    await click(".reset-assumptions > .button");
    await click(".reset-confirm");
    await poll(`document.querySelector('input[name="balanced_growth.operational.loadedHourlyCost.base"]')?.value`, "25");
    const reset = await evaluate(`(() => { const saved=JSON.parse(localStorage.getItem(${JSON.stringify(scenarioKey)})); const assumption=saved.scenarios.find(s=>s.templateId==='balanced_growth').assumptions.operational.loadedHourlyCost; return {value:assumption.range.base,source:assumption.source,error:Boolean(document.querySelector('[aria-invalid="true"]'))}; })()`);

    await click(".lean_foundation .select-action");
    await click(".accelerated_ai .select-action");
    await poll("document.querySelector('.accelerated_ai.is-preferred')!==null", true);
    const selected = await evaluate(`(() => { const saved=JSON.parse(localStorage.getItem(${JSON.stringify(scenarioKey)})); return {selected:saved.scenarios.find(s=>s.id===saved.selectedScenarioId)?.templateId,focused:document.querySelector('.scenario-path.is-focused')?.dataset.scenario,blueprint:Boolean(document.querySelector('a[href="/blueprint"]'))}; })()`);
    await scrollTo(".comparison-command"); await checkLayout("selected path", size.width);
    const selectedName = `selected-${size.label}.png`; await screenshot(selectedName, false); screenshots.push(selectedName);

    const timelineColumns = await evaluate("getComputedStyle(document.querySelector('.scenario-timeline')).gridTemplateColumns");
    interactionResults.push({ width: size.width, conditionalVisible, validEdit, invalidEdit: { ...invalidEdit, lastValidRetained: invalidEdit.operational === lastValid }, reset, selected, timelineColumns });

    if (size.width === 1440) {
      await axe("comparison desktop");
      await scrollTo(".assumptions-workbench"); await axe("expanded assumptions desktop");
      await setInput('input[name="balanced_growth.operational.loadedHourlyCost.base"]', ""); await poll(`document.querySelector('input[name="balanced_growth.operational.loadedHourlyCost.base"]')?.getAttribute('aria-invalid')`, "true"); await axe("invalid edit desktop");
    }
    if (size.width === 390) {
      await scrollTo(".comparison-command"); await axe("selected mobile");
      await scrollTo(".assumptions-workbench"); await axe("expanded assumptions mobile");
    }
  }

  await viewport(1440, 1000);
  await freshScenario("keyboard");
  await tabTo("e.matches('.formula-disclosure summary')");
  const focusStyle = await evaluate(`(() => { const s=getComputedStyle(document.activeElement); return {tag:document.activeElement.tagName,outlineStyle:s.outlineStyle,outlineWidth:s.outlineWidth}; })()`);
  await key("Enter");
  const keyboardDisclosure = await evaluate("document.activeElement.closest('details')?.open===true");
  await tabTo("e.matches('.balanced_growth .select-action')"); await key("Enter");
  await poll("document.querySelector('.balanced_growth.is-preferred')!==null", true);
  await tabTo("e.matches('a[href=\"/blueprint\"]')");
  const keyboardBlueprint = await evaluate("document.activeElement.getAttribute('href')==='/blueprint'");
  const focusVisible = focusStyle.outlineStyle !== "none" && Number.parseFloat(focusStyle.outlineWidth) >= 2;
  const reducedMotion = await evaluate("matchMedia('(prefers-reduced-motion: reduce)').matches");
  await cdp("Emulation.setEmulatedMedia", { media: "print", features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  const printSafe = await evaluate("getComputedStyle(document.querySelector('.scenario-path-actions')).display==='none' && getComputedStyle(document.querySelector('.reset-assumptions')).display==='none' && getComputedStyle(document.querySelector('.scenario-blueprint-handoff')).display==='none'");
  await cdp("Emulation.setEmulatedMedia", { media: "screen", features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  const overlay = await evaluate("Boolean(document.querySelector('[data-nextjs-dialog],.vite-error-overlay,#webpack-dev-server-client-overlay'))");

  const evidence = {
    environment: { node: process.version, chromePath, baseUrl, mode: configuredBaseUrl ? "external" : "local-production" },
    screenshots,
    caseAValues,
    defaultState,
    recovery,
    persistedRestore,
    interactions: interactionResults,
    accessibility,
    layoutChecks,
    keyboard: { disclosureOpened: keyboardDisclosure, blueprintReached: keyboardBlueprint, focusStyle },
    reducedMotion,
    printSafe,
    consoleErrors,
    failedRequests,
    overlay,
  };
  await writeFile(path.join(artifacts, "browser-evidence.json"), `${JSON.stringify(evidence, null, 2)}\n`);
  await writeFile(path.join(artifacts, "README.md"), `# Phase 05 Scenario and ROI Lab evidence

Generated by \`npm run test:phase05:browser\` against a production build with reduced motion enabled.

The committed evidence records the frozen Case A economics, default inspection without preselection, all three focused paths, conditional AI exclusion, assumption disclosure, valid and invalid edits, two-step reset, explicit selection switching, persisted restoration, recovery from empty/corrupt/incompatible/stale records, keyboard operation, print behavior, and axe-core A/AA results.

## Captures

At 1440, 1024, 390, and 360 CSS pixels the harness captures comparison, focused detail, conditional AI detail, assumptions, valid edit, invalid edit, and selected states.

## Required gates

- no page-level horizontal overflow;
- no undersized visible controls;
- no framework overlay, console error, or failed application request;
- no visible en dash or em dash;
- 12 months rendered exactly once;
- mobile schedule resolves to a vertical one-column path;
- reduced motion and print-safe behavior are active;
- zero critical or serious axe A/AA violations in the required states.
`);
  console.log(JSON.stringify(evidence, null, 2));

  const recoveryPassed = Object.values(recovery).every(Boolean);
  const interactionsPassed = interactionResults.every((item) => item.conditionalVisible && item.validEdit.value === 30 && item.validEdit.source === "user_override" && item.invalidEdit.lastValidRetained && item.invalidEdit.error && item.reset.value === 25 && item.reset.source === "planning_default" && !item.reset.error && item.selected.selected === "accelerated_ai" && item.selected.focused === "balanced_growth" && item.selected.blueprint && (item.width > 600 || item.timelineColumns === `${Math.max(1, item.width - 78)}px` || !item.timelineColumns.includes(" ")));
  if (!recoveryPassed || !interactionsPassed || !keyboardDisclosure || !keyboardBlueprint || !focusVisible || !reducedMotion || !printSafe || consoleErrors.length || failedRequests.length || overlay) {
    throw new Error(`Phase 05 browser assertions failed. Server output:\n${serverOutput.slice(-3000)}`);
  }
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
