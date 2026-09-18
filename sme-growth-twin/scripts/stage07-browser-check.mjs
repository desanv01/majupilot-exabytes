import { execFileSync, spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const chromePath = process.env.CHROME_PATH?.trim() || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const appPort = Number(process.env.STAGE07_PORT || 3017);
const debugPort = Number(process.env.STAGE07_DEBUG_PORT || 9557);
const baseUrl = `http://127.0.0.1:${appPort}`;
const artifactOverride = process.env.STAGE07_ARTIFACT_DIR?.trim();
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const stopTree = (child) => { if (!child?.pid) return; try { execFileSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true }); } catch { try { child.kill(); } catch {} } };

let artifacts; let profile; let server; let chrome; let ws;
try {
  artifacts = artifactOverride ? path.resolve(artifactOverride) : await mkdtemp(path.join(tmpdir(), "sme-growth-twin-stage07-artifacts-"));
  profile = await mkdtemp(path.join(tmpdir(), "sme-growth-twin-stage07-profile-"));
  await mkdir(artifacts, { recursive: true });
  const axeSource = await readFile(path.join(process.cwd(), "node_modules", "axe-core", "axe.min.js"), "utf8");

  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--port", String(appPort)], {
    cwd: process.cwd(),
    env: { ...process.env, AI_GATEWAY_MODEL: "", AI_GATEWAY_API_KEY: "", VERCEL_OIDC_TOKEN: "" },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  let serverOutput = "";
  server.stdout.on("data", (value) => { serverOutput += value.toString(); });
  server.stderr.on("data", (value) => { serverOutput += value.toString(); });
  let ready = false;
  for (let attempt = 0; attempt < 120; attempt += 1) { try { if ((await fetch(baseUrl)).ok) { ready = true; break; } } catch {} await wait(500); }
  if (!ready) throw new Error(`Production server did not start: ${serverOutput.slice(-3000)}`);

  const headerResponse = await fetch(baseUrl);
  const securityHeaders = Object.fromEntries(["content-security-policy", "x-frame-options", "x-content-type-options", "referrer-policy", "permissions-policy"].map((name) => [name, headerResponse.headers.get(name)]));

  chrome = spawn(chromePath, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore", windowsHide: true });
  let endpoint;
  for (let attempt = 0; attempt < 80; attempt += 1) { try { const tabs = await fetch(`http://127.0.0.1:${debugPort}/json`).then((response) => response.json()); endpoint = tabs.find((tab) => tab.type === "page")?.webSocketDebuggerUrl; if (endpoint) break; } catch {} await wait(200); }
  if (!endpoint) throw new Error("Chrome DevTools endpoint did not start");
  ws = new WebSocket(endpoint);
  await new Promise((resolve, reject) => { ws.addEventListener("open", resolve, { once: true }); ws.addEventListener("error", reject, { once: true }); });

  let nextId = 0;
  const pending = new Map();
  const consoleErrors = [];
  const failedRequests = [];
  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) { const call = pending.get(message.id); pending.delete(message.id); if (message.error) call.reject(new Error(message.error.message)); else call.resolve(message.result); }
    if (message.method === "Runtime.exceptionThrown") consoleErrors.push(message.params.exceptionDetails.text);
    if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") consoleErrors.push(message.params.args.map((arg) => arg.value ?? arg.description).join(" "));
    if (message.method === "Network.responseReceived" && ["XHR", "Fetch"].includes(message.params.type) && message.params.response.url.startsWith(baseUrl) && message.params.response.status >= 400) failedRequests.push(`${message.params.response.status} ${message.params.response.url}`);
    if (message.method === "Page.javascriptDialogOpening") void cdp("Page.handleJavaScriptDialog", { accept: true });
  });
  const cdp = (method, params = {}) => new Promise((resolve, reject) => { const id = ++nextId; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); });
  const evaluate = async (expression) => { const result = await cdp("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }); if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text); return result.result.value; };
  const poll = async (expression, expected, timeout = 25_000) => { const started = Date.now(); let actual; while (Date.now() - started < timeout) { actual = await evaluate(expression); if (actual === expected) return; await wait(120); } throw new Error(`Timed out: ${expression}; actual=${JSON.stringify(actual)}`); };
  const navigate = async (pathname) => { await cdp("Page.navigate", { url: `${baseUrl}${pathname}` }); await poll("document.readyState", "complete"); };
  const key = async (name, code = name, modifiers = 0) => { const windowsVirtualKeyCode = name === "Tab" ? 9 : name === "Enter" ? 13 : name === " " ? 32 : name === "ArrowDown" ? 40 : 0; const text = name === "Enter" ? "\r" : name === " " ? " " : undefined; await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: name, code, modifiers, windowsVirtualKeyCode, ...(text ? { text } : {}) }); await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: name, code, modifiers, windowsVirtualKeyCode }); };
  const tabTo = async (predicate, maximum = 120) => {
    await evaluate("document.activeElement?.blur()");
    for (let index = 0; index < maximum; index += 1) { await key("Tab"); if (await evaluate(`(() => { const e=document.activeElement; return Boolean(e && (${predicate})); })()`)) return; }
    throw new Error(`Keyboard target not found: ${predicate}`);
  };
  const activateText = async (text) => { await tabTo(`(e.textContent || '').includes(${JSON.stringify(text)})`); await key("Enter"); };
  const activateBalanced = async () => { await tabTo(`e.tagName==='BUTTON' && (e.textContent || '').includes('Select as preferred') && e.closest('.balanced_growth')`); await key("Enter"); };
  const insert = async (name, value) => { await tabTo(`e.getAttribute('name')===${JSON.stringify(name)}`); await key("a", "KeyA", 2); await cdp("Input.insertText", { text: value }); };
  const screenshot = async (name) => { const capture = await cdp("Page.captureScreenshot", { format: "png", fromSurface: true }); await writeFile(path.join(artifacts, name), Buffer.from(capture.data, "base64")); };
  const checks = [];
  const checkLayout = async (route, width) => {
    const value = await evaluate(`(() => { const controls=[...document.querySelectorAll('button,a.button,input:not([type=hidden]):not([type=radio]):not([type=checkbox]),select,textarea,summary,.segmented span,.option-grid span,.range label span,.consent-card label')].filter(e=>{const s=getComputedStyle(e);return e.getClientRects().length>0&&s.display!=='none'&&s.visibility!=='hidden'&&e.getAttribute('aria-hidden')!=='true'}); const routine=controls.filter(e=>!(e.tagName==='A'&&!e.classList.contains('button'))&&!e.classList.contains('quiet-reset')); const ordered=routine.map(e=>({tag:e.tagName,cls:e.className,name:e.getAttribute('name'),text:(e.textContent||'').trim().slice(0,50),height:e.getBoundingClientRect().height})).sort((a,b)=>a.height-b.height); return { overflow:document.documentElement.scrollWidth>window.innerWidth, minTarget:ordered[0]?.height??null, smallest:ordered.slice(0,3), overlay:Boolean(document.querySelector('[data-nextjs-dialog],.vite-error-overlay,#webpack-dev-server-client-overlay')) }; })()`);
    checks.push({ route, width, ...value });
    if (value.overflow || value.overlay || (value.minTarget !== null && value.minTarget < 43.5)) throw new Error(`Layout gate failed ${route} ${width}: ${JSON.stringify(value)}`);
  };
  const axe = async (state) => {
    await evaluate(axeSource);
    const result = await evaluate(`axe.run(document,{resultTypes:['violations']}).then(r=>r.violations.filter(v=>v.impact==='critical'||v.impact==='serious').map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.length,targets:v.nodes.map(n=>n.target)})))`);
    if (result.length) throw new Error(`Axe violations at ${state}: ${JSON.stringify(result)}`);
    return { state, criticalSerious: 0 };
  };
  const viewport = async (width, height = 900) => cdp("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width <= 600 });
  const runToBlueprint = async (fixtureButton, keyboard) => {
    await navigate("/");
    if (keyboard) await activateText(fixtureButton); else await evaluate(`document.querySelector(${JSON.stringify(`[data-fixture-id="${fixtureButton}"]`)})?.click()`);
    await poll("location.pathname", "/assessment/review");
    await poll("document.querySelector('.demo-banner')?.innerText.includes('Fictional demonstration') ?? false", true);
    if (keyboard) await activateText("Confirm Business Twin"); else await evaluate("Array.from(document.querySelectorAll('button')).find(e=>e.textContent.includes('Confirm Business Twin'))?.click()");
    await poll("location.pathname", "/results", 20_000);
    if (keyboard) await activateText("View recommendations"); else await evaluate("document.querySelector('a[href=\"/recommendations\"]')?.click()");
    await poll("location.pathname", "/recommendations");
    if (keyboard) await activateText("Compare transformation scenarios"); else await evaluate("document.querySelector('a[href=\"/scenarios\"]')?.click()");
    await poll("location.pathname", "/scenarios");
    if (keyboard) await activateBalanced(); else await evaluate("Array.from(document.querySelectorAll('.balanced_growth button')).find(e=>e.textContent.includes('Select as preferred'))?.click()");
    await wait(150);
    if (keyboard) await activateText("Generate Advisor review and Blueprint"); else await evaluate("document.querySelector('a[href=\"/blueprint\"]')?.click()");
    await poll("location.pathname", "/blueprint");
    if (keyboard) await activateText("Generate advisor review and Blueprint"); else await evaluate("Array.from(document.querySelectorAll('button')).find(e=>e.textContent.includes('Generate advisor review and Blueprint'))?.click()");
    await poll("document.body.innerText.includes('Five advisor reviews')", true, 35_000);
    return evaluate(`(() => { const b=JSON.parse(localStorage.getItem('sme-growth-twin:blueprint:1.0.0')); const s=b.snapshot.selectedScenario; return { name:b.snapshot.twin.identity.businessName,maturity:b.snapshot.diagnostic.digitalMaturity.value,readiness:b.snapshot.diagnostic.aiReadiness.value,recommendations:b.snapshot.recommendations.recommendations.map(r=>r.capabilityId+':'+r.status),scenario:s.templateId,cost:s.costs.firstYear,operational:s.value.operational.range,net:s.value.net.range,payback:s.value.payback,origins:b.advisorReviews.map(r=>r.origin),sections:b.sectionIds.length }; })()`);
  };
  const resetViaBanner = async () => { await evaluate("window.confirm=()=>true;document.querySelector('.demo-banner button')?.click()"); await poll("location.pathname", "/"); await poll("localStorage.getItem('sme-growth-twin:assessment-draft:1.0.0')", null); };

  await cdp("Page.enable"); await cdp("Runtime.enable"); await cdp("Network.enable"); await viewport(1440, 1000);
  const accessibility = [];
  await navigate("/"); accessibility.push(await axe("home")); await checkLayout("/", 1440);
  await navigate("/assessment?new=1"); await poll("document.body.innerText.includes('Your business at a glance')", true); accessibility.push(await axe("assessment")); await checkLayout("/assessment", 1440);

  const journeyStarted = Date.now();
  const caseA = await runToBlueprint("Load CASE A", true);
  const blueprintDurationMs = Date.now() - journeyStarted;
  accessibility.push(await axe("reviewed blueprint")); await checkLayout("/blueprint", 1440);
  await activateText("Request consultation"); await poll("location.pathname", "/consultation"); accessibility.push(await axe("consultation")); await checkLayout("/consultation", 1440);
  await insert("name", "Aiman Demo");
  await insert("businessName", "Kopi Kita Café Group");
  await insert("email", "aiman.demo@example.test");
  await insert("phone", "+60 12 300 4000");
  await tabTo("e.getAttribute('name')==='urgency'"); await key("ArrowDown");
  await tabTo("e.getAttribute('name')==='consent'"); await key(" ", "Space");
  await tabTo("e.getAttribute('type')==='submit'"); await key("Enter");
  await poll("document.body.innerText.includes('Your consultation request has been recorded.')", true, 15_000);
  accessibility.push(await axe("consultation success")); await checkLayout("/consultation success", 1440);
  const receiptSafe = await evaluate(`(() => { const raw=sessionStorage.getItem('sme-growth-twin:lead-receipt:1.0.0'); const lower=(raw||'').toLowerCase(); return Boolean(raw)&&!['aiman','example.test','+60','email','phone','contact'].some(value=>lower.includes(value)); })()`);
  await evaluate("localStorage.setItem('unrelated-stage07','preserve-me');sessionStorage.setItem('unrelated-stage07-session','preserve-me')");
  await resetViaBanner();
  const scopedReset = await evaluate("localStorage.getItem('unrelated-stage07')==='preserve-me'&&sessionStorage.getItem('unrelated-stage07-session')==='preserve-me'&&localStorage.getItem('sme-growth-twin:demo-session:1.0.0')===null");

  const caseB = await runToBlueprint("case-b", false); await resetViaBanner();
  const caseC = await runToBlueprint("case-c", false);
  await screenshot("stage-07-case-c-blueprint.png");

  const stateRoutes = ["/", "/assessment", "/assessment/review", "/results", "/recommendations", "/scenarios", "/blueprint", "/consultation"];
  for (const route of stateRoutes) {
    await navigate(route);
    await wait(180);
    await checkLayout(route, 1440);
    if (!["/", "/assessment"].includes(route)) accessibility.push(await axe(`desktop ${route}`));
  }
  await viewport(360, 800);
  for (const route of stateRoutes) { await navigate(route); await wait(180); await checkLayout(route, 360); }
  await navigate("/blueprint"); await poll("document.body.innerText.includes('Five advisor reviews')", true); accessibility.push(await axe("mobile blueprint"));

  const expected = {
    caseA: { name: "Kopi Kita Café Group", maturity: 37.5, readiness: 42.5, scenario: "balanced_growth", cost: { low: 9200, base: 18400, high: 27600 }, payback: { status: "estimated", best: 7.2, base: 30.4, worst: 140.5 }, sections: 16 },
    caseB: { name: "Precision Parts Manufacturing", maturity: 23.2, readiness: 43.8, scenario: "balanced_growth", cost: { low: 7400, base: 14800, high: 22200 }, payback: { status: "estimated", best: 5, base: 21.1, worst: 97.3 }, sections: 16 },
    caseC: { name: "Northstar Digital Studio", maturity: 79, readiness: 73.8, scenario: "balanced_growth", cost: { low: 22400, base: 44800, high: 67200 }, payback: { status: "estimated", best: 45.6, base: 191.5, worst: 883.6 }, sections: 16 },
  };
  const casesMatch = [[caseA, expected.caseA], [caseB, expected.caseB], [caseC, expected.caseC]].every(([actual, frozen]) => Object.entries(frozen).every(([keyName, value]) => JSON.stringify(actual[keyName]) === JSON.stringify(value)) && actual.origins.every((origin) => origin === "deterministic_fallback"));
  const headersPass = securityHeaders["x-frame-options"] === "DENY" && securityHeaders["x-content-type-options"] === "nosniff" && securityHeaders["referrer-policy"] === "strict-origin-when-cross-origin" && securityHeaders["content-security-policy"]?.includes("frame-ancestors 'none'") && securityHeaders["permissions-policy"]?.includes("camera=()");
  const evidence = { environment: { node: process.version, chromePath, mode: "production", baseUrl }, cases: { caseA, caseB, caseC }, accessibility, responsive: checks, keyboardJourney: { completed: true, receiptSafe, blueprintDurationMs, underFiveMinutes: blueprintDurationMs < 300_000 }, scopedReset, securityHeaders, consoleErrors, failedRequests, overlay: await evaluate("Boolean(document.querySelector('[data-nextjs-dialog],.vite-error-overlay,#webpack-dev-server-client-overlay'))") };
  await writeFile(path.join(artifacts, "stage-07-browser-evidence.json"), `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify(evidence, null, 2));
  if (!casesMatch || !receiptSafe || !scopedReset || !headersPass || blueprintDurationMs >= 300_000 || consoleErrors.length || failedRequests.length || evidence.overlay) throw new Error("Stage 07 browser assertions failed");
  await cdp("Browser.close");
} finally {
  try { ws?.close(); } catch {}
  stopTree(chrome); stopTree(server);
  await wait(500);
  if (profile) {
    try { await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 250 }); }
    catch (error) { console.warn(`Temporary Chrome profile cleanup deferred: ${error.message}`); }
  }
  if (!artifactOverride && artifacts) {
    try { await rm(artifacts, { recursive: true, force: true, maxRetries: 5, retryDelay: 250 }); }
    catch (error) { console.warn(`Temporary evidence cleanup deferred: ${error.message}`); }
  }
}
