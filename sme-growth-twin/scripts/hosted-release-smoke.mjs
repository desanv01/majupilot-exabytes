import { execFileSync, spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const baseUrl = (process.env.MAJUPILOT_RELEASE_BASE_URL || "https://majupilot-exabytes.vercel.app").replace(/\/$/, "");
const chromePath = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const debugPort = Number(process.env.MAJUPILOT_RELEASE_DEBUG_PORT || 9563);
const cronSecret = process.env.CRON_SECRET;
if (!cronSecret) throw new Error("CRON_SECRET is required; load it from .env.local without printing it");
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) throw new Error("hosted Supabase admin configuration is required");

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const stopTree = (child) => {
  if (!child?.pid) return;
  try { execFileSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true }); }
  catch { try { child.kill(); } catch {} }
};
const requireOk = async (response, label) => {
  if (!response.ok) throw new Error(`${label} failed with HTTP ${response.status}`);
  return response;
};

let profile;
let chrome;
let socket;
try {
  const home = await requireOk(await fetch(baseUrl), "home");
  const securityHeaders = {
    frame: home.headers.get("x-frame-options") === "DENY",
    contentType: home.headers.get("x-content-type-options") === "nosniff",
    referrer: home.headers.get("referrer-policy") === "strict-origin-when-cross-origin",
    permissions: home.headers.get("permissions-policy")?.includes("camera=()") === true,
    csp: home.headers.get("content-security-policy")?.includes("frame-ancestors 'none'") === true,
  };
  if (!Object.values(securityHeaders).every(Boolean)) throw new Error("production security headers are incomplete");

  const integration = (await (await requireOk(await fetch(`${baseUrl}/api/v2/integration/status`), "integration status")).json()).data;
  if (!integration?.delivery?.configured || integration.documentRag !== "P1_not_enabled") throw new Error("integration status is not release-ready");
  const ai = (await (await requireOk(await fetch(`${baseUrl}/api/v2/ai/preflight`), "AI preflight")).json()).data;
  if (ai?.state !== "ready" || ai.model !== "deepseek/deepseek-v4.1-flash") throw new Error("AI Gateway preflight did not return the approved model");

  profile = await mkdtemp(path.join(tmpdir(), "majupilot-hosted-release-"));
  chrome = spawn(chromePath, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore", windowsHide: true });
  let endpoint;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const tabs = await fetch(`http://127.0.0.1:${debugPort}/json`).then((response) => response.json());
      endpoint = tabs.find((item) => item.type === "page")?.webSocketDebuggerUrl;
      if (endpoint) break;
    } catch {}
    await wait(250);
  }
  if (!endpoint) throw new Error("Chrome DevTools endpoint did not start");
  socket = new WebSocket(endpoint);
  await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }); });

  let callId = 0;
  const pending = new Map();
  const consoleErrors = [];
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const call = pending.get(message.id); pending.delete(message.id);
      if (message.error) call.reject(new Error(message.error.message)); else call.resolve(message.result);
    }
    if (message.method === "Runtime.exceptionThrown") consoleErrors.push(message.params.exceptionDetails.text);
    if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") consoleErrors.push("console_error");
  });
  const cdp = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++callId; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async (expression) => {
    const result = await cdp("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  };
  const poll = async (expression, expected, timeout = 60_000) => {
    const started = Date.now(); let actual;
    while (Date.now() - started < timeout) {
      actual = await evaluate(expression);
      if (actual === expected) return;
      await wait(200);
    }
    throw new Error(`Timed out waiting for release state; last result was ${JSON.stringify(actual)}`);
  };
  const navigate = async (pathname) => {
    await cdp("Page.navigate", { url: `${baseUrl}${pathname}` });
    await poll("document.readyState", "complete");
  };
  const clickText = (text) => evaluate(`(() => { const element=[...document.querySelectorAll('button,a')].find((item)=>(item.textContent||'').includes(${JSON.stringify(text)})); if(!element) return false; element.click(); return true; })()`);
  const clickSelector = async (selector, timeout = 60_000) => {
    await poll(`Boolean(document.querySelector(${JSON.stringify(selector)}))`, true, timeout);
    await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
  };

  await cdp("Page.enable"); await cdp("Runtime.enable"); await cdp("Network.enable");
  await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await navigate("/");
  const brand = await evaluate("({maju:document.body.innerText.includes('MajuPilot'),legacy:document.body.innerText.includes('SME Growth Twin'),overflow:document.documentElement.scrollWidth>innerWidth})");
  if (!brand.maju || brand.legacy || brand.overflow) throw new Error("home branding or desktop layout gate failed");
  await navigate("/v2");
  await poll("location.pathname", "/copilot");
  await poll("document.body.innerText.toLowerCase().includes('majupilot transformation copilot')", true, 20_000);
  const copilotProductSurface = await evaluate("document.body.innerText.toLowerCase().includes('majupilot transformation copilot')&&!/\\bPhase [A-I]\\b|application boundary|not Phase I/.test(document.body.innerText)");
  if (!copilotProductSurface) throw new Error("legacy V2 route did not resolve to the product Copilot surface");

  await navigate("/");
  await clickSelector('[data-fixture-id="case-a"]');
  await poll("location.pathname", "/assessment/review");
  await poll("document.body.innerText.includes('Confirm Business Twin')", true);
  if (!(await clickText("Confirm Business Twin"))) throw new Error("Business Twin confirmation is unavailable");
  await poll("location.pathname", "/results");
  await clickSelector('a[href="/recommendations"]'); await poll("location.pathname", "/recommendations");
  await clickSelector('a[href="/scenarios"]'); await poll("location.pathname", "/scenarios");
  await clickSelector('.balanced_growth .select-action');
  await wait(250);
  await clickSelector('a[href="/blueprint"]'); await poll("location.pathname", "/blueprint");
  await poll("document.body.innerText.includes('Generate advisor review and Blueprint')", true);
  if (!(await clickText("Generate advisor review and Blueprint"))) throw new Error("Blueprint generation control is unavailable");
  await poll("document.body.innerText.includes('Five advisor reviews')", true, 120_000);
  await poll("document.body.innerText.includes('Blueprint and evidence securely synced.')", true, 90_000);
  const synced = await evaluate(`(() => { const value=JSON.parse(localStorage.getItem('majupilot:durable-journey:1.0.0')||'null'); return Boolean(value?.syncedAt&&value?.artifactIds?.blueprint); })()`);
  if (!synced) throw new Error("durable Blueprint sync was not recorded");

  if (!(await clickText("Request consultation"))) throw new Error("consultation action is unavailable");
  await poll("location.pathname", "/consultation");
  await poll("Boolean(document.querySelector('form input[name=\"name\"]'))", true);
  await evaluate(`(() => {
    const write=(selector,value)=>{const element=document.querySelector(selector);const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;Reflect.apply(setter,element,[value]);element.dispatchEvent(new Event('input',{bubbles:true}));};
    write('form input[name="name"]','Synthetic Release User'); write('form input[name="businessName"]','Synthetic MajuPilot Demo'); write('form input[name="email"]','release-smoke@example.invalid'); write('form input[name="phone"]','+60 10 000 0000');
    const urgency=document.querySelector('form select[name="urgency"]'); urgency.value='exploring'; urgency.dispatchEvent(new Event('change',{bubbles:true}));
    document.querySelector('form input[name="consent"]').click(); document.querySelector('form').requestSubmit(); return true;
  })()`);
  await poll("document.body.innerText.includes('Request recorded.')", true, 120_000);
  const durable = await evaluate(`(() => { const value=JSON.parse(localStorage.getItem('majupilot:durable-journey:1.0.0')||'null'); return {report:value?.report,lead:value?.lead,raw:JSON.stringify(value)}; })()`);
  if (durable.report?.status !== "completed" || !durable.report?.contentSha256 || !durable.lead?.leadId || /release-smoke|example\.invalid|\+60 10/.test(durable.raw)) throw new Error("durable report/lead receipt or browser privacy gate failed");

  const cookies = (await cdp("Network.getAllCookies")).cookies.filter((cookie) => baseUrl.includes(cookie.domain.replace(/^\./, ""))).map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
  const downloadResponse = await requireOk(await fetch(`${baseUrl}/api/v2/reports/${durable.report.id}/download?expiresIn=60`, { headers: { cookie: cookies } }), "signed report URL");
  const download = (await downloadResponse.json()).data;
  const pdf = await requireOk(await fetch(download.url), "private report download");
  const pdfBytes = new Uint8Array(await pdf.arrayBuffer());
  if (pdf.headers.get("content-type")?.includes("application/pdf") !== true || pdfBytes.length < 1_000 || String.fromCharCode(...pdfBytes.slice(0, 4)) !== "%PDF") throw new Error("signed artifact was not a valid PDF");

  const cronUnauthorized = await fetch(`${baseUrl}/api/cron/outbox`);
  if (cronUnauthorized.status !== 401) throw new Error("cron endpoint did not reject an unauthenticated request");
  const cronResponse = await requireOk(await fetch(`${baseUrl}/api/cron/outbox`, { headers: { authorization: `Bearer ${cronSecret}` } }), "authorized outbox cron");
  const cron = (await cronResponse.json()).data;
  const outcome = cron?.outcomes?.find((item) => item.outcome === "succeeded");
  if (!outcome) throw new Error("the synthetic signed webhook was not accepted by the external receiver");
  const eventsResponse = await fetch(`${baseUrl}/api/v2/leads/${durable.lead.leadId}/events`, { headers: { cookie: cookies } });
  if (eventsResponse.status !== 403) throw new Error("guest access to internal lead event history was not denied");
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const persistedEvents = await supabase.from("lead_events").select("event_type").eq("lead_id", durable.lead.leadId);
  if (persistedEvents.error || !persistedEvents.data.some((event) => event.event_type === "delivery.succeeded")) throw new Error("successful delivery audit event was not persisted");

  await navigate("/copilot");
  await poll("Boolean(document.querySelector('#copilot-message:not([disabled])'))", true, 60_000);
  await evaluate(`(() => { const field=document.querySelector('#copilot-message'); const setter=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set; setter.call(field,'Summarize the top priority and cite the saved evidence.'); field.dispatchEvent(new Event('input',{bubbles:true})); field.form.requestSubmit(); return true; })()`);
  await poll("document.querySelectorAll('.copilot-message.assistant').length>=2", true, 90_000);
  const copilot = await evaluate("({messages:document.querySelectorAll('.copilot-message.assistant').length,live:document.body.innerText.includes('Live DeepSeek guidance is available'),overflow:document.documentElement.scrollWidth>innerWidth})");
  if (!copilot.live || copilot.overflow) throw new Error("live Copilot or layout gate failed");
  if (consoleErrors.length) throw new Error(`browser console emitted ${consoleErrors.length} error(s)`);

  process.stdout.write(`${JSON.stringify({
    ok: true,
    baseUrl,
    brand: "MajuPilot",
    legacyBrandAbsent: true,
    copilotProductSurface: true,
    ai: { state: ai.state, model: ai.model },
    durableJourney: true,
    report: { status: durable.report.status, pageCount: durable.report.pageCount, hashPresent: true, signedDownloadPdf: true },
    lead: { created: true, assignmentState: durable.lead.assignmentState, audited: true, guestEventHistoryDenied: true },
    outbox: { unauthorizedRejected: true, deliveryOutcome: outcome.outcome, externalReceiverAccepted: true },
    copilot: { live: copilot.live, assistantMessages: copilot.messages },
    documentRag: "deferred_P1",
    securityHeaders,
    consoleErrors: 0,
  }, null, 2)}\n`);
} finally {
  try { socket?.close(); } catch {}
  stopTree(chrome);
  await wait(400);
  if (profile) await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }).catch(() => undefined);
}
