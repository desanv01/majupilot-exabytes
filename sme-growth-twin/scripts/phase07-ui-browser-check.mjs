import { execFileSync, spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const chromePath = process.env.CHROME_PATH?.trim() || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const appPort = Number(process.env.PHASE07_UI_PORT || 3027);
const debugPort = Number(process.env.PHASE07_UI_DEBUG_PORT || 9567);
const baseUrl = `http://127.0.0.1:${appPort}`;
const defaultArtifacts = path.resolve(process.cwd(), "..", "planning", "evidence", "ui-upgrade", "phase-07-consultation-demo-release");
const artifacts = path.resolve(process.env.PHASE07_UI_ARTIFACT_DIR?.trim() || defaultArtifacts);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const stopTree = (child) => { if (!child?.pid) return; try { execFileSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true }); } catch { try { child.kill(); } catch {} } };

let profile; let server; let chrome; let ws;
try {
  profile = await mkdtemp(path.join(tmpdir(), "sme-growth-twin-phase07-ui-profile-"));
  await mkdir(artifacts, { recursive: true });
  const axeSource = await readFile(path.join(process.cwd(), "node_modules", "axe-core", "axe.min.js"), "utf8");
  const localEnv = { ...process.env, AI_EXECUTION_MODE: "disabled", AI_GATEWAY_MODEL: "", AI_GATEWAY_API_KEY: "", VERCEL_OIDC_TOKEN: "" };
  execFileSync(process.execPath, ["node_modules/next/dist/bin/next", "build"], { cwd: process.cwd(), env: localEnv, stdio: "inherit", windowsHide: true });
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--port", String(appPort)], { cwd: process.cwd(), env: localEnv, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
  let serverOutput = "";
  server.stdout.on("data", (value) => { serverOutput += value.toString(); });
  server.stderr.on("data", (value) => { serverOutput += value.toString(); });
  let ready = false;
  for (let attempt = 0; attempt < 120; attempt += 1) { try { if ((await fetch(baseUrl)).ok) { ready = true; break; } } catch {} await wait(500); }
  if (!ready) throw new Error(`Production server did not start: ${serverOutput.slice(-3000)}`);

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
  });
  const cdp = (method, params = {}) => new Promise((resolve, reject) => { const id = ++nextId; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); });
  const evaluate = async (expression) => { const result = await cdp("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }); if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text); return result.result.value; };
  const poll = async (expression, expected, timeout = 30_000) => { const started = Date.now(); let actual; while (Date.now() - started < timeout) { actual = await evaluate(expression); if (actual === expected) return; await wait(120); } throw new Error(`Timed out: ${expression}; actual=${JSON.stringify(actual)}`); };
  const navigate = async (pathname) => { await cdp("Page.navigate", { url: `${baseUrl}${pathname}` }); await poll("document.readyState", "complete"); };
  const viewport = (width, height) => cdp("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width <= 600 });
  const screenshot = async (name) => { const capture = await cdp("Page.captureScreenshot", { format: "png", fromSurface: true }); await writeFile(path.join(artifacts, name), Buffer.from(capture.data, "base64")); };
  const clickText = (text) => evaluate(`Array.from(document.querySelectorAll('button,a')).find((element)=>(element.textContent||'').includes(${JSON.stringify(text)}))?.click()`);
  const setValue = (name, value) => evaluate(`(() => { const element=document.querySelector('[name=${JSON.stringify(name)}]'); const setter=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element),'value').set; setter.call(element,${JSON.stringify(value)}); element.dispatchEvent(new Event(element.tagName==='SELECT'?'change':'input',{bubbles:true})); })()`);
  const layout = async (state, width) => {
    const result = await evaluate(`(() => { const controls=[...document.querySelectorAll('button,a.button,input:not([type=hidden]):not([type=checkbox]),select,summary,.consent-card label')].filter((e)=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden'); const heights=controls.map((e)=>e.getBoundingClientRect().height).filter(Boolean); return {state:${JSON.stringify(state)},width:${width},overflow:document.documentElement.scrollWidth>innerWidth,minTarget:heights.length?Math.min(...heights):null,overlay:Boolean(document.querySelector('[data-nextjs-dialog],#webpack-dev-server-client-overlay'))}; })()`);
    if (result.overflow || result.overlay || (result.minTarget !== null && result.minTarget < 43.5)) throw new Error(`Layout gate failed: ${JSON.stringify(result)}`);
    return result;
  };
  const axe = async (state) => { await evaluate(axeSource); const violations = await evaluate("axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}}).then((r)=>r.violations.filter((v)=>v.impact==='critical'||v.impact==='serious').map((v)=>({id:v.id,impact:v.impact,nodes:v.nodes.map((n)=>({target:n.target,html:n.html,summary:n.failureSummary}))})))"); if (violations.length) throw new Error(`Axe failed ${state}: ${JSON.stringify(violations)}`); return { state, criticalSerious: 0 }; };
  const captureState = async (state, route, width, height = 900) => { await viewport(width, height); await navigate(route); await wait(120); const checks = await layout(state, width); await screenshot(`${state}-${width}.png`); return checks; };
  const runToConsultation = async () => {
    await navigate("/"); await evaluate("document.querySelector('[data-fixture-id=\"case-a\"]')?.click()"); await poll("location.pathname", "/assessment/review");
    await clickText("Confirm Business Twin"); await poll("location.pathname", "/results", 20_000);
    await clickText("View recommendations"); await poll("location.pathname", "/recommendations");
    await clickText("Compare transformation scenarios"); await poll("location.pathname", "/scenarios");
    await evaluate("Array.from(document.querySelectorAll('.balanced_growth button')).find((element)=>(element.textContent||'').includes('Select as preferred'))?.click()");
    await clickText("Generate Advisor review and Blueprint"); await poll("location.pathname", "/blueprint");
    await clickText("Generate advisor review and Blueprint"); await poll("document.body.innerText.includes('Five advisor reviews')", true, 35_000);
    await clickText("Request consultation"); await poll("location.pathname", "/consultation"); await poll("Boolean(document.querySelector('.consultation-form'))", true);
  };
  const fillValid = async () => { await setValue("name", "Aiman Demo"); await setValue("businessName", "Kopi Kita Café Group"); await setValue("email", "aiman.demo@example.test"); await setValue("phone", "+60 12 300 4000"); await setValue("urgency", "within_30_days"); await evaluate("document.querySelector('[name=consent]')?.click()"); };

  await cdp("Page.enable"); await cdp("Runtime.enable"); await cdp("Network.enable");
  const responsive = [];
  const accessibility = [];
  for (const [width, height] of [[1440, 1000], [1024, 900], [390, 844], [360, 800]]) responsive.push(await captureState("home-pristine", "/", width, height));
  accessibility.push(await axe("home pristine"));
  await viewport(1440, 1000); await runToConsultation();
  accessibility.push(await axe("consultation idle"));

  for (const [width, height] of [[1440, 1000], [1024, 900], [390, 844], [360, 800]]) {
    await viewport(width, height); await navigate("/consultation"); await poll("Boolean(document.querySelector('.consultation-form'))", true); responsive.push(await layout("consultation-idle", width)); await screenshot(`consultation-idle-${width}.png`);
    await clickText("Record consultation request"); await poll("Boolean(document.querySelector('.consultation-error-summary'))", true); responsive.push(await layout("consultation-validation", width)); await screenshot(`consultation-validation-${width}.png`);
  }
  accessibility.push(await axe("consultation validation"));

  for (const [width, height] of [[1440, 1000], [1024, 900], [390, 844], [360, 800]]) {
    await viewport(width, height); await navigate("/"); await poll("Boolean(document.querySelector('.demo-banner'))", true); responsive.push(await layout("home-demo", width)); await screenshot(`home-demo-${width}.png`);
    await evaluate("document.querySelector('#demo-cases')?.scrollIntoView({block:'start'})"); await screenshot(`demo-launcher-${width}.png`);
    await poll("Boolean(document.querySelector('.reset-demo:not(:disabled)'))", true); await evaluate("document.querySelector('.demo-reset-dialog')?.showModal()"); await poll("document.querySelector('.demo-reset-dialog')?.open", true); responsive.push(await layout("reset-confirmation", width)); await screenshot(`reset-confirmation-${width}.png`); if (width === 360) accessibility.push(await axe("reset confirmation")); await clickText("Cancel");
  }
  accessibility.push(await axe("demo home"));

  await viewport(1440, 1000); await navigate("/consultation"); await poll("Boolean(document.querySelector('.consultation-form'))", true); await fillValid();
  await evaluate("window.__phase07Fetch=window.fetch;window.fetch=async()=>new Response(JSON.stringify({error:'lead_unavailable'}),{status:503,headers:{'Content-Type':'application/json'}})"); await clickText("Record consultation request"); await poll("document.body.innerText.includes('could not be recorded safely')", true); accessibility.push(await axe("consultation API error"));
  for (const [width, height] of [[1440, 1000], [1024, 900], [390, 844], [360, 800]]) { await viewport(width, height); await evaluate("document.querySelector('.submission-error')?.scrollIntoView({block:'center'})"); responsive.push(await layout("consultation-api-error", width)); await screenshot(`consultation-api-error-${width}.png`); }
  await navigate("/consultation"); await poll("Boolean(document.querySelector('.consultation-form'))", true); await fillValid(); await evaluate("window.fetch=async()=>new Response(JSON.stringify({error:'rate_limited'}),{status:429,headers:{'Content-Type':'application/json'}})"); await clickText("Record consultation request"); await poll("document.body.innerText.includes('Too many new requests')", true); await evaluate("document.querySelector('.submission-error')?.scrollIntoView({block:'center'})"); await screenshot("consultation-rate-limit-1440.png"); accessibility.push(await axe("consultation rate limit"));

  await navigate("/consultation"); await poll("Boolean(document.querySelector('.consultation-form'))", true); await fillValid(); await evaluate("window.__phase07Resolve=null;window.fetch=()=>new Promise((resolve)=>{window.__phase07Resolve=resolve})"); await clickText("Record consultation request"); await poll("document.querySelector('.consultation-form')?.getAttribute('aria-busy')", "true"); await screenshot("consultation-submitting-1440.png"); await navigate("/consultation");
  await poll("Boolean(document.querySelector('.consultation-form'))", true); await fillValid(); await clickText("Record consultation request"); await poll("document.body.innerText.includes('Request recorded.')", true, 15_000);
  accessibility.push(await axe("consultation success"));
  for (const [width, height] of [[1440, 1000], [1024, 900], [390, 844], [360, 800]]) { await viewport(width, height); responsive.push(await layout("consultation-success", width)); await screenshot(`consultation-success-${width}.png`); }
  await evaluate("(() => { const key='sme-growth-twin:lead-receipt:1.0.0'; const value=JSON.parse(sessionStorage.getItem(key)); value.replayed=true; sessionStorage.setItem(key,JSON.stringify(value)); })()"); await navigate("/consultation"); await poll("document.body.innerText.includes('Same request, same receipt')", true); await screenshot("consultation-idempotent-replay-1440.png");

  await evaluate("localStorage.setItem('phase07-unrelated','preserve');sessionStorage.setItem('phase07-unrelated-session','preserve')"); await navigate("/"); await poll("Boolean(document.querySelector('.reset-demo:not(:disabled)'))", true); await evaluate("document.querySelector('.demo-reset-dialog')?.showModal();document.querySelector('.demo-reset-dialog .danger')?.click()"); await poll("localStorage.getItem('sme-growth-twin:assessment-draft:1.0.0')", null); await poll("document.body.innerText.includes('demonstration data was reset')", true);
  const reset = await evaluate("({unrelatedLocal:localStorage.getItem('phase07-unrelated'),unrelatedSession:sessionStorage.getItem('phase07-unrelated-session'),status:[...document.querySelectorAll('[role=status]')].map((element)=>element.textContent||'').find((text)=>text.includes('demonstration data was reset'))||''})");
  await navigate("/consultation"); await poll("location.pathname === '/blueprint' || location.pathname === '/assessment'", true);
  const missingContextDestination = await evaluate("location.pathname");
  await cdp("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] }); await navigate("/");
  const reducedMotion = await evaluate("matchMedia('(prefers-reduced-motion: reduce)').matches && getComputedStyle(document.querySelector('.home-page .button')).transitionDuration==='0s'");
  const report = { contract: "UI Upgrade Phase 07", goldenOutputs: "Recorded by npm run test:stage07:golden and npm run test:stage07:browser", responsive, accessibility, reset, missingContextDestination, reducedMotion, consoleErrors, failedRequests, screenshots: 35, volatileFields: ["lead reference", "recorded time"] };
  await writeFile(path.join(artifacts, "browser-evidence.json"), `${JSON.stringify(report, null, 2)}\n`);
  if (reset.unrelatedLocal !== "preserve" || reset.unrelatedSession !== "preserve" || !reset.status.includes("demonstration data was reset") || !reducedMotion || consoleErrors.length || failedRequests.length) throw new Error(`Phase 07 UI assertions failed: ${JSON.stringify(report)}`);
  await cdp("Browser.close");
} finally {
  try { ws?.close(); } catch {}
  stopTree(chrome); stopTree(server); await wait(500);
  if (profile) await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 250 });
}
