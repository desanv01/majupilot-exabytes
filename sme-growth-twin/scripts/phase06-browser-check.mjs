import { execFileSync, spawn } from "node:child_process";
import { readFile, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const appPort = 3026;
const debugPort = 9566;
const baseUrl = `http://localhost:${appPort}`;
const configuredEvidenceDir = process.env.PHASE4_BLUEPRINT_ARTIFACT_DIR?.trim() || process.env.PHASE06_ARTIFACT_DIR?.trim();
const evidenceDir = path.resolve(configuredEvidenceDir || path.join("..", "planning", "evidence", "ui-upgrade", "phase-06-blueprint-advisors"));
const expectedRoles = ["growth", "operations", "finance", "cybersecurity", "change"];
const expectedSectionIds = ["cover", "executive-summary", "business-profile", "maturity-readiness", "pain-points", "recommendations", "scenario-comparison", "selected-plan", "roi", "roadmap", "risks", "advisor-reviews", "synthesis", "consultant-notes", "methodology", "consultation-preview"];
const expectedFigures = {
  maturity: 37.5,
  readiness: 42.5,
  selectedPath: "Balanced Growth",
  costs: { low: 9200, base: 18400, high: 27600 },
  operational: { low: 2358, base: 7254, high: 15233 },
  net: { low: -25242, base: -11146, high: 6033 },
  payback: { status: "estimated", best: 7.2, base: 30.4, worst: 140.5 },
};
const draft = {
  schemaVersion: "1.0.0",
  sessionId: "assessment_phase060001",
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

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const stopTree = (child) => {
  if (!child?.pid) return;
  try { execFileSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true }); }
  catch { try { child.kill(); } catch {} }
};
const equal = (left, right) => JSON.stringify(left) === JSON.stringify(right);

let server;
let chrome;
let ws;
let profile;
try {
  await mkdir(evidenceDir, { recursive: true });
  profile = await mkdtemp(path.join(tmpdir(), "sme-growth-twin-phase06-"));
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--port", String(appPort)], {
    cwd: process.cwd(),
    env: { ...process.env, AI_EXECUTION_MODE: "disabled", AI_GATEWAY_MODEL: "", AI_GATEWAY_API_KEY: "", VERCEL_OIDC_TOKEN: "" },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  let serverOutput = "";
  server.stdout.on("data", (value) => { serverOutput += value.toString(); });
  server.stderr.on("data", (value) => { serverOutput += value.toString(); });
  let serverReady = false;
  for (let attempt = 0; attempt < 120; attempt += 1) {
    try { if ((await fetch(baseUrl)).ok) { serverReady = true; break; } } catch {}
    await wait(500);
  }
  if (!serverReady) throw new Error(`Next.js did not start: ${serverOutput.slice(-2500)}`);

  chrome = spawn(chromePath, [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profile}`,
    "about:blank",
  ], { stdio: "ignore", windowsHide: true });

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
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });

  let nextId = 0;
  const pending = new Map();
  const consoleErrors = [];
  const failedRequests = [];
  const requestUrls = new Map();
  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const call = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) call.reject(new Error(message.error.message));
      else call.resolve(message.result);
    }
    if (message.method === "Runtime.exceptionThrown") consoleErrors.push(message.params.exceptionDetails.text);
    if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") {
      consoleErrors.push(message.params.args.map((arg) => arg.value ?? arg.description).join(" "));
    }
    if (message.method === "Network.requestWillBeSent") requestUrls.set(message.params.requestId, message.params.request.url);
    if (message.method === "Network.loadingFailed" && message.params.errorText !== "net::ERR_ABORTED") {
      failedRequests.push({ url: requestUrls.get(message.params.requestId), error: message.params.errorText });
    }
  });

  const cdp = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async (expression) => {
    const result = await cdp("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
    return result.result.value;
  };
  const poll = async (expression, expected, timeout = 25_000) => {
    const started = Date.now();
    let actual;
    let lastNavigationError;
    while (Date.now() - started < timeout) {
      try {
        actual = await evaluate(expression);
        lastNavigationError = undefined;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        // Page.reload returns before the new document and its body are ready.
        // Retry only navigation/DOM-not-ready failures; other script errors
        // still fail immediately, and persistent transients still time out.
        if (!/Cannot read properties of (?:null|undefined) \(reading '[^']+'\)|Execution context was destroyed|Cannot find context with specified id|Inspected target navigated or closed/i.test(message)) throw error;
        actual = undefined;
        lastNavigationError = message;
      }
      if (equal(actual, expected)) return actual;
      await wait(120);
    }
    throw new Error(`Timed out: ${expression}; actual=${JSON.stringify(actual)}${lastNavigationError ? `; last navigation error=${lastNavigationError}` : ""}`);
  };
  const navigate = async (url) => {
    await cdp("Page.navigate", { url });
    await poll("document.readyState", "complete");
  };
  const viewport = async (width, height = 900) => {
    await cdp("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 700 });
    await wait(80);
  };
  const screenshot = async (name, full = true) => {
    let params = { format: "png", fromSurface: true };
    if (full) {
      const metrics = await cdp("Page.getLayoutMetrics");
      params = {
        ...params,
        captureBeyondViewport: true,
        clip: { x: 0, y: 0, width: Math.ceil(metrics.cssContentSize.width), height: Math.ceil(metrics.cssContentSize.height), scale: 1 },
      };
    }
    const capture = await cdp("Page.captureScreenshot", params);
    await writeFile(path.join(evidenceDir, name), Buffer.from(capture.data, "base64"));
  };
  const press = async (key) => {
    const code = key === " " ? "Space" : key;
    const windowsVirtualKeyCode = key === "Enter" ? 13 : key === "Tab" ? 9 : 32;
    await cdp("Input.dispatchKeyEvent", {
      type: "keyDown",
      key,
      code,
      windowsVirtualKeyCode,
      ...(key === "Enter" ? { text: "\r" } : key === " " ? { text: " " } : {}),
    });
    await cdp("Input.dispatchKeyEvent", { type: "keyUp", key, code, windowsVirtualKeyCode });
  };
  const layoutAudit = async (label, width) => ({
    label,
    width,
    overflow: await evaluate("Math.max(document.documentElement.scrollWidth,document.body.scrollWidth) > document.documentElement.clientWidth + 1"),
    widths: await evaluate("({document:document.documentElement.scrollWidth,body:document.body.scrollWidth,client:document.documentElement.clientWidth})"),
    overflowElements: await evaluate("Array.from(document.querySelectorAll('*')).map((element)=>{const r=element.getBoundingClientRect();return {tag:element.tagName,cls:element.className?.toString().slice(0,120),left:Math.round(r.left),right:Math.round(r.right),width:Math.round(r.width)}}).filter((item)=>item.right>document.documentElement.clientWidth+1||item.left<-1).slice(0,20)"),
    minTarget: await evaluate(`Math.min(...Array.from(document.querySelectorAll('a,button,summary')).filter((element)=>{const s=getComputedStyle(element);const r=element.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0}).map((element)=>Math.min(element.getBoundingClientRect().width,element.getBoundingClientRect().height)))`),
    overlay: await evaluate("Boolean(document.querySelector('[data-nextjs-dialog],.vite-error-overlay,#webpack-dev-server-client-overlay'))"),
    visibleDash: await evaluate("/[–—]/.test(document.body.innerText)"),
  });

  await cdp("Page.enable");
  await cdp("Runtime.enable");
  await cdp("Network.enable");
  await cdp("Log.enable");
  await viewport(1440, 1000);
  await navigate(baseUrl);
  await evaluate(`localStorage.setItem("sme-growth-twin:assessment-draft:1.0.0", ${JSON.stringify(JSON.stringify(draft))})`);
  await navigate(`${baseUrl}/assessment/analysis`);
  await poll("location.pathname", "/results", 18_000);
  await evaluate("document.querySelector('a[href=\"/recommendations\"]')?.click()");
  await poll("location.pathname", "/recommendations");
  await poll("document.body.innerText.includes('Compare transformation scenarios')", true);
  await evaluate("document.querySelector('a[href=\"/scenarios\"]')?.click()");
  await poll("location.pathname", "/scenarios");
  await poll("document.body.innerText.includes('Balanced Growth')", true);
  await evaluate("Array.from(document.querySelectorAll('.balanced_growth button')).find((button)=>button.textContent.includes('Select as preferred'))?.click()");
  await wait(150);
  await evaluate("document.querySelector('a[href=\"/blueprint\"]')?.click()");
  await poll("location.pathname", "/blueprint");
  await poll("document.body.innerText.includes('No Blueprint has been generated')", true);

  const axeSource = await readFile(path.resolve("node_modules", "axe-core", "axe.min.js"), "utf8");
  await evaluate(axeSource);
  const axe = {};
  const runAxe = async (label) => {
    axe[label] = await evaluate(`axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}}).then((r)=>r.violations.filter((v)=>v.impact==='critical'||v.impact==='serious').map((v)=>({id:v.id,impact:v.impact,nodes:v.nodes.length,targets:v.nodes.map((n)=>n.target),html:v.nodes.map((n)=>n.html)})))`);
  };

  await runAxe("readyDesktop");
  await screenshot("ready-1440.png");
  await viewport(390, 844);
  await screenshot("ready-390.png");
  await runAxe("readyMobile");
  await viewport(1440, 1000);

  await evaluate(`(() => {
    window.__phase06Fetch = window.fetch.bind(window);
    window.fetch = (...args) => args[0] === '/api/advisors/review'
      ? new Promise((resolve) => setTimeout(() => resolve(window.__phase06Fetch(...args)), 2500))
      : window.__phase06Fetch(...args);
    document.querySelector('a[href="/scenarios"]').focus();
  })()`);
  await press("Tab");
  const generationFocusVisible = await evaluate("document.activeElement.textContent.includes('Generate review') && document.activeElement.matches(':focus-visible')");
  await press("Enter");
  await poll("Array.from(document.querySelectorAll('.advisor-status-item small')).filter((item)=>item.textContent==='Reviewing').length", 5);
  await runAxe("reviewingDesktop");
  await screenshot("reviewing-1440.png");
  await viewport(390, 844);
  await screenshot("reviewing-390.png", false);
  await viewport(1440, 1000);
  await poll("document.body.innerText.includes('Five advisor reviews')", true, 30_000);
  await evaluate("window.fetch = window.__phase06Fetch");

  const blueprint = JSON.parse(await evaluate("localStorage.getItem('sme-growth-twin:blueprint:1.0.0')"));
  const selected = blueprint.snapshot.selectedScenario;
  const figures = {
    maturity: blueprint.snapshot.diagnostic.digitalMaturity.value,
    readiness: blueprint.snapshot.diagnostic.aiReadiness.value,
    selectedPath: selected.title,
    costs: selected.costs.firstYear,
    operational: selected.value.operational.range,
    net: selected.value.net.range,
    payback: selected.value.payback,
  };
  const identityBeforeReload = blueprint.id;
  const sourceIdentityBefore = blueprint.sourceIdentity;
  const origins = blueprint.advisorReviews.map((review) => review.origin);
  const roles = blueprint.advisorReviews.map((review) => review.advisor);
  const sectionIds = blueprint.sectionIds;
  const contentEvidence = {
    advisorCount: await evaluate("document.querySelectorAll('.phase06-advisor-card').length"),
    sectionCount: await evaluate("document.querySelectorAll('.phase06-report > section').length"),
    evidenceRefs: await evaluate("document.querySelectorAll('.phase06-evidence code').length"),
    provenance: await evaluate("document.querySelectorAll('.phase06-provenance').length"),
    formulas: await evaluate("document.body.innerText.includes('Inspect formulas and exclusions')"),
    exclusions: await evaluate("Boolean(document.querySelector('#roi .phase06-disclosure'))"),
    limitations: await evaluate("document.body.innerText.includes('Inspect limitations')"),
    modelCalls: await evaluate("document.body.innerText.includes('Inspect model-call disclosure')"),
    noHiddenDisagreement: await evaluate("document.body.innerText.includes('No material disagreement detected')"),
  };

  const responsive = [];
  for (const [width, height] of [[1920, 1080], [1366, 900], [768, 1024], [390, 844]]) {
    await viewport(width, height);
    responsive.push(await layoutAudit("complete", width));
    await screenshot(`completed-overview-${width}.png`, width >= 1024);
  }

  await viewport(1366, 900);
  await evaluate("document.querySelector('#roi').scrollIntoView({block:'start'})");
  await poll("document.querySelector('.phase06-contents-rail a[aria-current=location]')?.getAttribute('href')", "#roi");
  const sectionTracking = await evaluate("document.querySelector('.phase06-contents-rail a[aria-current=location]')?.textContent.includes('ROI assumptions') === true");
  const metadataRestraint = await evaluate("!document.querySelector('.phase06-report-cover > dl')?.innerText.includes(JSON.parse(localStorage.getItem('sme-growth-twin:blueprint:1.0.0')).id) && !document.querySelector('.phase06-cover-technical')?.open");
  await screenshot("section-tracking-1366.png", false);

  await viewport(1440, 1000);
  await evaluate("document.querySelector('.phase06-advisor-card summary').focus()");
  await press("Enter");
  await poll("document.querySelector('.phase06-advisor-card').open", true);
  const disclosureFocusVisible = await evaluate("document.activeElement.matches(':focus-visible')");
  await runAxe("expandedAdvisorDesktop");
  await evaluate("document.querySelector('#advisor-reviews').scrollIntoView()");
  await screenshot("advisor-detail-1440.png", false);
  await viewport(390, 844);
  responsive.push(await layoutAudit("expanded-advisor", 390));
  await runAxe("expandedAdvisorMobile");
  await screenshot("advisor-detail-390.png", false);

  await viewport(1440, 1000);
  await evaluate("document.querySelector('#synthesis').scrollIntoView()");
  await runAxe("synthesisDesktop");
  await screenshot("synthesis-1440.png", false);
  await viewport(390, 844);
  await screenshot("synthesis-390.png", false);
  await runAxe("synthesisMobile");

  await viewport(1024, 900);
  await evaluate("document.querySelector('.phase06-mobile-contents > summary').focus()");
  await press("Enter");
  await poll("document.querySelector('.phase06-mobile-contents').open", true);
  await screenshot("report-navigation-1024.png", false);
  const contentsKeyboard = await evaluate("document.querySelector('.phase06-mobile-contents').open && document.activeElement.matches(':focus-visible')");

  await viewport(1440, 1000);
  await cdp("Page.reload", { ignoreCache: true });
  await poll("document.body.innerText.includes('Five advisor reviews')", true);
  const restoredId = JSON.parse(await evaluate("localStorage.getItem('sme-growth-twin:blueprint:1.0.0')")).id;

  await evaluate("Array.from(document.querySelectorAll('button')).find((item)=>item.textContent.includes('Regenerate review'))?.click()");
  await poll(`JSON.parse(localStorage.getItem('sme-growth-twin:blueprint:1.0.0')).id !== ${JSON.stringify(restoredId)}`, true, 30_000);
  const regenerated = JSON.parse(await evaluate("localStorage.getItem('sme-growth-twin:blueprint:1.0.0')"));
  const regeneration = {
    changedId: regenerated.id !== restoredId,
    sourceIdentityStable: equal(regenerated.sourceIdentity, sourceIdentityBefore),
    upstreamSelectedScenarioStable: regenerated.snapshot.selectedScenario.id === blueprint.snapshot.selectedScenario.id,
  };

  await evaluate(`(() => {
    window.__phase06SetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      if (key === 'sme-growth-twin:blueprint:1.0.0') throw new Error('simulated write failure');
      return window.__phase06SetItem.call(this, key, value);
    };
  })()`);
  await evaluate("Array.from(document.querySelectorAll('button')).find((item)=>item.textContent.includes('Regenerate review'))?.click()");
  await poll("Array.from(document.querySelectorAll('.advisor-status-item small')).filter((item)=>item.textContent==='Failed-safe').length", 5, 30_000);
  const failedSafe = {
    count: await evaluate("document.querySelectorAll('.status-failed-safe').length"),
    notice: await evaluate("document.querySelector('.phase06-status-notice')?.textContent"),
    persistedId: JSON.parse(await evaluate("localStorage.getItem('sme-growth-twin:blueprint:1.0.0')")).id,
  };
  await screenshot("failed-safe-1440.png", false);
  await evaluate("Storage.prototype.setItem = window.__phase06SetItem");
  await cdp("Page.reload", { ignoreCache: true });
  await poll("document.body.innerText.includes('Five advisor reviews')", true);

  await evaluate("localStorage.setItem('sme-growth-twin:blueprint:1.0.0','{corrupt')");
  await cdp("Page.reload", { ignoreCache: true });
  await poll("document.body.innerText.includes('safely discarded')", true);
  const recoveryNotice = await evaluate("document.querySelector('.phase06-status-notice')?.textContent");
  await screenshot("corrupt-recovery-1440.png", false);
  await evaluate(`localStorage.setItem('sme-growth-twin:blueprint:1.0.0', ${JSON.stringify(JSON.stringify(blueprint))})`);
  await cdp("Page.reload", { ignoreCache: true });
  await poll("document.body.innerText.includes('Five advisor reviews')", true, 30_000);

  const scenarioRaw = await evaluate("localStorage.getItem('sme-growth-twin:scenarios:1.0.0')");
  await evaluate(`(() => { const scenario=JSON.parse(localStorage.getItem('sme-growth-twin:scenarios:1.0.0')); delete scenario.selectedScenarioId; localStorage.setItem('sme-growth-twin:scenarios:1.0.0',JSON.stringify(scenario)); })()`);
  await cdp("Page.reload", { ignoreCache: true });
  await poll("document.body.innerText.includes('A preferred scenario is required')", true);
  const missingPreference = await evaluate("document.body.innerText.includes('Return to scenarios')");
  await screenshot("missing-preference-1440.png", false);
  await evaluate(`localStorage.setItem('sme-growth-twin:scenarios:1.0.0', ${JSON.stringify(scenarioRaw)})`);
  await cdp("Page.reload", { ignoreCache: true });
  await poll("document.body.innerText.includes('No Blueprint has been generated') || document.body.innerText.includes('Five advisor reviews')", true);
  if (await evaluate("document.body.innerText.includes('No Blueprint has been generated')")) {
    await evaluate("Array.from(document.querySelectorAll('button')).find((item)=>item.textContent.includes('Generate advisor review and Blueprint'))?.click()");
    await poll("document.body.innerText.includes('Five advisor reviews')", true, 30_000);
  }

  await cdp("Emulation.setEmulatedMedia", { media: "screen", features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await cdp("Page.reload", { ignoreCache: true });
  await poll("document.body.innerText.includes('Five advisor reviews')", true);
  const reducedMotion = {
    preferenceActive: await evaluate("matchMedia('(prefers-reduced-motion: reduce)').matches"),
    animationDuration: await evaluate("getComputedStyle(document.querySelector('.phase06-advisor-card')).animationDuration"),
  };
  await cdp("Emulation.setEmulatedMedia", { media: "screen", features: [] });

  await viewport(794, 1123);
  await cdp("Emulation.setEmulatedMedia", { media: "print" });
  await wait(250);
  const print = {
    controlsHidden: await evaluate("Array.from(document.querySelectorAll('.no-print,.diagnostic-rail,.diagnostic-mobile-header,.diagnostic-mobile-journey')).every((element)=>getComputedStyle(element).display==='none')"),
    sectionCount: await evaluate("document.querySelectorAll('.phase06-report > section').length"),
    advisorCount: await evaluate("document.querySelectorAll('.phase06-advisor-card').length"),
    detailExpanded: await evaluate("Array.from(document.querySelectorAll('.phase06-advisor-card')).every((element)=>Array.from(element.children).every((child)=>getComputedStyle(child).display!=='none'))"),
    interpretationContext: await evaluate("['Blueprint ID','Generated','Model version','Evidence references','Inspect claim provenance','Inspect model-call disclosure','Inspect limitations'].every((text)=>document.body.textContent.includes(text))"),
  };
  const pdf = await cdp("Page.printToPDF", {
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: false,
  });
  await writeFile(path.join(evidenceDir, "blueprint-a4.pdf"), Buffer.from(pdf.data, "base64"));
  await screenshot("print-media-full.png");
  await cdp("Emulation.setEmulatedMedia", { media: "screen" });

  const allAxeClean = Object.values(axe).every((violations) => violations.length === 0);
  const allResponsiveClean = responsive.every((check) => !check.overflow && check.minTarget >= 44 && !check.overlay && !check.visibleDash);
  const evidence = {
    environment: { node: process.version, chromePath, baseUrl, mode: "local-production" },
    design: { designVariance: 7, motionIntensity: 3, visualDensity: 5 },
    caseA: { figures, roles, origins, sectionIds, synthesisDecision: blueprint.synthesis.decision },
    identity: { initial: identityBeforeReload, restored: restoredId, stableAfterReload: identityBeforeReload === restoredId, regeneration },
    states: { ready: true, reviewing: true, allFallback: origins.every((origin) => origin === "deterministic_fallback"), mixedOriginCoveredByRenderTest: true, failedSafe, recoveryNotice, missingPreference },
    contentEvidence,
    keyboard: { generationFocusVisible, disclosureFocusVisible, contentsKeyboard },
    clarity: { sectionTracking, metadataRestraint },
    responsive,
    accessibility: axe,
    print,
    reducedMotion,
    consoleErrors,
    failedRequests,
  };
  await writeFile(path.join(evidenceDir, "browser-evidence.json"), `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify(evidence, null, 2));

  const figuresPass = equal(figures, expectedFigures);
  const identitiesPass = identityBeforeReload === restoredId && regeneration.changedId && regeneration.sourceIdentityStable && regeneration.upstreamSelectedScenarioStable;
  const structurePass = equal(roles, expectedRoles) && equal(sectionIds, expectedSectionIds) && contentEvidence.advisorCount === 5 && contentEvidence.sectionCount === 16 && Object.values(contentEvidence).every(Boolean);
  const statePass = origins.every((origin) => origin === "deterministic_fallback") && failedSafe.count === 5 && /Upstream records were not changed/.test(failedSafe.notice) && recoveryNotice?.includes("safely discarded") && missingPreference;
  const printPass = print.controlsHidden && print.sectionCount === 16 && print.advisorCount === 5 && print.detailExpanded && print.interpretationContext;
  const keyboardPass = generationFocusVisible && disclosureFocusVisible && contentsKeyboard;

  const reducedMotionPass = reducedMotion.preferenceActive && parseFloat(reducedMotion.animationDuration) <= 0.001;
  if (!figuresPass || !identitiesPass || !structurePass || !statePass || !printPass || !keyboardPass || !sectionTracking || !metadataRestraint || !reducedMotionPass || !allAxeClean || !allResponsiveClean || consoleErrors.length || failedRequests.length) {
    throw new Error("Phase 06 browser assertions failed");
  }
  await cdp("Browser.close");
} finally {
  try { ws?.close(); } catch {}
  stopTree(chrome);
  stopTree(server);
  if (profile) {
    try { await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch {}
  }
}
