import { execFileSync, spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const chromePath = process.env.CHROME_PATH?.trim() || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const appPort = Number(process.env.PHASE02_PORT || 3022);
const debugPort = Number(process.env.PHASE02_DEBUG_PORT || 9562);
const configuredBaseUrl = process.env.PHASE02_BASE_URL?.trim();
const baseUrl = configuredBaseUrl?.replace(/\/$/, "") || `http://127.0.0.1:${appPort}`;
const artifacts = path.resolve(process.env.PHASE02_ARTIFACT_DIR?.trim() || path.join(process.cwd(), "..", "planning", "evidence", "ui-upgrade", "phase-02-assessment"));
const draftKey = "sme-growth-twin:assessment-draft:1.0.0";
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const stopTree = (child) => {
  if (!child?.pid) return;
  try { execFileSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true }); }
  catch { try { child.kill(); } catch {} }
};

let profile; let server; let chrome; let ws;
try {
  await mkdir(artifacts, { recursive: true });
  profile = await mkdtemp(path.join(tmpdir(), "sme-growth-twin-phase02-profile-"));
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
  let acceptDialog = true;
  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const call = pending.get(message.id); pending.delete(message.id);
      if (message.error) call.reject(new Error(message.error.message)); else call.resolve(message.result);
    }
    if (message.method === "Runtime.exceptionThrown") consoleErrors.push(message.params.exceptionDetails.text);
    if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") consoleErrors.push(message.params.args.map((arg) => arg.value ?? arg.description).join(" "));
    if (message.method === "Network.responseReceived" && ["XHR", "Fetch"].includes(message.params.type) && message.params.response.url.startsWith(baseUrl) && message.params.response.status >= 400) failedRequests.push(`${message.params.response.status} ${message.params.response.url}`);
    if (message.method === "Page.javascriptDialogOpening") void cdp("Page.handleJavaScriptDialog", { accept: acceptDialog });
  });
  const cdp = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async (expression) => {
    const result = await cdp("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  };
  const poll = async (expression, expected, timeout = 20_000) => {
    const started = Date.now(); let actual;
    while (Date.now() - started < timeout) {
      try { actual = await evaluate(expression); } catch { actual = undefined; }
      if (actual === expected) return;
      await wait(120);
    }
    throw new Error(`Timed out: ${expression}; actual=${JSON.stringify(actual)}`);
  };
  const navigate = async (pathname) => {
    await cdp("Page.navigate", { url: `${baseUrl}${pathname}` });
    await poll("document.readyState", "complete");
  };
  const viewport = (width, height = 900) => cdp("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width <= 600 });
  const key = async (name, code = name) => {
    const windowsVirtualKeyCode = name === "Tab" ? 9 : name === "Enter" ? 13 : 0;
    await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: name, code, windowsVirtualKeyCode, ...(name === "Enter" ? { text: "\r" } : {}) });
    await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: name, code, windowsVirtualKeyCode });
  };
  const tabTo = async (predicate, maximum = 150) => {
    await evaluate("document.activeElement?.blur()");
    for (let index = 0; index < maximum; index += 1) {
      await key("Tab");
      if (await evaluate(`(() => { const e=document.activeElement; return Boolean(e && (${predicate})); })()`)) return;
    }
    throw new Error(`Keyboard target not found: ${predicate}`);
  };
  const activateText = async (text) => {
    await tabTo(`(e.textContent || '').includes(${JSON.stringify(text)})`);
    await key("Enter");
  };
  const screenshot = async (name) => {
    const capture = await cdp("Page.captureScreenshot", { format: "png", fromSurface: true, captureBeyondViewport: true });
    await writeFile(path.join(artifacts, name), Buffer.from(capture.data, "base64"));
  };
  const layoutChecks = [];
  const checkLayout = async (state, width) => {
    const result = await evaluate(`(() => {
      const selector='button,a,input:not([type=hidden]):not([type=radio]):not([type=checkbox]),select,textarea,summary,.segmented span,.option-grid span,.range label span';
      const controls=[...document.querySelectorAll(selector)].filter(e=>{const s=getComputedStyle(e);return e.getClientRects().length>0&&s.display!=='none'&&s.visibility!=='hidden'&&e.getAttribute('aria-hidden')!=='true'});
      const measured=controls.map(e=>({tag:e.tagName,text:(e.textContent||e.getAttribute('aria-label')||'').trim().slice(0,55),height:e.getBoundingClientRect().height,width:e.getBoundingClientRect().width})).sort((a,b)=>a.height-b.height);
      return {overflow:document.documentElement.scrollWidth>window.innerWidth,overlay:Boolean(document.querySelector('[data-nextjs-dialog],.vite-error-overlay,#webpack-dev-server-client-overlay')),smallest:measured.slice(0,5),undersized:measured.filter(e=>e.height<43.5||e.width<43.5).slice(0,10),visibleDashes:/[–—]/.test(document.body.innerText)};
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
  const setDraft = async (draft) => evaluate(`localStorage.setItem(${JSON.stringify(draftKey)},${JSON.stringify(JSON.stringify(draft))})`);
  const stateReady = (text) => poll(`document.body.innerText.includes(${JSON.stringify(text)})`, true);

  await cdp("Page.enable"); await cdp("Runtime.enable"); await cdp("Network.enable");
  await viewport(1440, 1000);
  await navigate("/");
  await evaluate("localStorage.clear();sessionStorage.clear()");
  await activateText("Load CASE A");
  await poll("location.pathname", "/assessment/review");
  await stateReady("Check the facts before analysis");
  const caseDraft = await evaluate(`JSON.parse(localStorage.getItem(${JSON.stringify(draftKey)}))`);

  const widths = [
    { width: 1440, height: 1000, label: "1440" },
    { width: 1024, height: 900, label: "1024" },
    { width: 390, height: 844, label: "390" },
    { width: 360, height: 800, label: "360" },
  ];
  const states = [
    { name: "q1", step: 1, text: "Your business at a glance" },
    { name: "q2", step: 2, text: "Your current digital foundation" },
    { name: "follow-up", step: 6, text: "Help us clarify what matters" },
  ];
  for (const size of widths) {
    await viewport(size.width, size.height);
    for (const state of states) {
      await setDraft({ ...caseDraft, status: "in_progress", currentStep: state.step });
      await navigate("/assessment");
      await stateReady(state.text);
      await checkLayout(state.name, size.width);
      await screenshot(`${state.name}-${size.label}.png`);
    }
    await navigate("/assessment?new=1");
    await stateReady("Your business at a glance");
    await activateText("Continue");
    await poll("document.activeElement?.id", "assessment-errors");
    await checkLayout("validation", size.width);
    await screenshot(`validation-${size.label}.png`);

    await setDraft(caseDraft);
    await navigate("/assessment/review");
    await stateReady("Check the facts before analysis");
    await checkLayout("review", size.width);
    await screenshot(`review-${size.label}.png`);
  }

  await viewport(1440, 1000);
  await setDraft({ ...caseDraft, status: "in_progress", currentStep: 1 });
  await navigate("/assessment");
  await stateReady("Your business at a glance");
  await axe("assessment desktop");
  await setDraft(caseDraft);
  await navigate("/assessment/review");
  await stateReady("Check the facts before analysis");
  await axe("review desktop");
  await tabTo("e.getAttribute('aria-label')==='Edit Identity'");
  await key("Enter");
  await poll("location.pathname", "/assessment");
  for (const label of ["Continue", "Continue", "Continue", "Continue", "Continue", "Review Business Twin"]) {
    await activateText(label);
  }
  await poll("location.pathname", "/assessment/review");
  await stateReady("Check the facts before analysis");
  const revisionIncrementedOnce = await evaluate(`JSON.parse(localStorage.getItem(${JSON.stringify(draftKey)})).twinRevision===${caseDraft.twinRevision + 1}`);

  await setDraft({ ...caseDraft, status: "in_progress", currentStep: 2 });
  await navigate("/assessment");
  await stateReady("Your saved draft was restored at step 2.");
  await cdp("Page.reload", { ignoreCache: true });
  await stateReady("Your saved draft was restored at step 2.");
  const restoredAfterRefresh = await evaluate("document.body.innerText.includes('Your current digital foundation')");

  await setDraft({ ...caseDraft, status: "in_progress", currentStep: 1 });
  await navigate("/assessment");
  const beforeStartOver = await evaluate(`JSON.parse(localStorage.getItem(${JSON.stringify(draftKey)})).sessionId`);
  await evaluate("window.confirm=()=>false;document.querySelector('.start-over')?.click()");
  const cancelPreserved = await evaluate(`JSON.parse(localStorage.getItem(${JSON.stringify(draftKey)})).sessionId===${JSON.stringify(beforeStartOver)}`);
  await evaluate("window.confirm=()=>true;document.querySelector('.start-over')?.click()");
  await stateReady("Your previous draft was removed.");
  const confirmReset = await evaluate(`JSON.parse(localStorage.getItem(${JSON.stringify(draftKey)})).sessionId!==${JSON.stringify(beforeStartOver)}`);

  await cdp("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  const reducedMotion = await evaluate(`(() => { const e=document.querySelector('.assessment-page .button'); const s=getComputedStyle(e); return {transition:s.transitionDuration,animation:s.animationDuration,query:matchMedia('(prefers-reduced-motion: reduce)').matches}; })()`);
  if (!reducedMotion.query || !["0s", "0.00001s", "1e-05s"].includes(reducedMotion.transition)) throw new Error(`Reduced motion gate failed: ${JSON.stringify(reducedMotion)}`);
  await cdp("Emulation.setEmulatedMedia", { features: [] });

  await navigate("/");
  await evaluate(`(() => {
    localStorage.removeItem(${JSON.stringify(draftKey)});
    let index=0;
    for(const size of [1048576,65536,4096,256,16]) {
      const value='x'.repeat(size);
      while(true) { try { localStorage.setItem('phase02-storage-fill-'+index++,value); } catch { break; } }
    }
    document.querySelector('a[href="/assessment?new=1"]')?.click();
  })()`);
  await poll("location.pathname", "/assessment");
  await stateReady("Device storage unavailable");
  const storageUnavailable = await evaluate("document.body.innerText.includes('review requires browser storage') && document.body.innerText.includes('Device storage unavailable')");
  await evaluate(`Object.keys(localStorage).filter(key=>key.startsWith('phase02-storage-fill-')).forEach(key=>localStorage.removeItem(key))`);

  await viewport(390, 844);
  await setDraft({ ...caseDraft, status: "in_progress", currentStep: 1 });
  await navigate("/assessment");
  await stateReady("Your business at a glance");
  await axe("assessment mobile");
  await setDraft(caseDraft);
  await navigate("/assessment/review");
  await stateReady("Check the facts before analysis");
  await axe("review mobile");

  const overlay = await evaluate("Boolean(document.querySelector('[data-nextjs-dialog],.vite-error-overlay,#webpack-dev-server-client-overlay'))");
  const evidence = {
    environment: { node: process.version, chromePath, baseUrl, mode: configuredBaseUrl ? "external" : "local-production" },
    screenshots: widths.flatMap(({ label }) => ["q1", "q2", "follow-up", "validation", "review"].map((state) => `${state}-${label}.png`)),
    accessibility,
    layoutChecks,
    keyboardJourney: { caseAThroughReviewAndEditReturn: true, revisionIncrementedOnce },
    restoration: { restoredAfterRefresh },
    startOver: { cancelPreserved, confirmReset },
    storageUnavailable,
    reducedMotion,
    consoleErrors,
    failedRequests,
    overlay,
  };
  await writeFile(path.join(artifacts, "browser-evidence.json"), `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify(evidence, null, 2));
  if (!revisionIncrementedOnce || !restoredAfterRefresh || !cancelPreserved || !confirmReset || !storageUnavailable || consoleErrors.length || failedRequests.length || overlay) throw new Error("Phase 02 browser assertions failed");
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
