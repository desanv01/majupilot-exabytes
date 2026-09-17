import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const port = 9333;
const baseUrl = "http://localhost:3000";
const artifacts = path.resolve("artifacts");
const profile = path.join(tmpdir(), `sme-growth-twin-stage03-${process.pid}`);
await mkdir(artifacts, { recursive: true });

const chrome = spawn(chromePath, [
  "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
  `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "about:blank",
], { stdio: "ignore" });

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let endpoint;
for (let attempt = 0; attempt < 40; attempt += 1) {
  try {
    const tabs = await fetch(`http://127.0.0.1:${port}/json`).then((response) => response.json());
    endpoint = tabs.find((tab) => tab.type === "page" && tab.url === "about:blank")?.webSocketDebuggerUrl ?? tabs.find((tab) => tab.type === "page" && !tab.url.startsWith("chrome-extension://"))?.webSocketDebuggerUrl;
    if (endpoint) break;
  } catch {}
  await wait(250);
}
if (!endpoint) throw new Error("Chrome DevTools endpoint did not start");

const ws = new WebSocket(endpoint);
await new Promise((resolve, reject) => { ws.addEventListener("open", resolve, { once: true }); ws.addEventListener("error", reject, { once: true }); });
let nextId = 0;
const pending = new Map();
const consoleErrors = [];
ws.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id); pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message)); else resolve(message.result);
  }
  if (message.method === "Runtime.exceptionThrown") consoleErrors.push(message.params.exceptionDetails.text);
  if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") consoleErrors.push(message.params.args.map((arg) => arg.value ?? arg.description).join(" "));
});
const cdp = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++nextId; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params }));
});
const evaluate = async (expression) => (await cdp("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result.value;
const poll = async (expression, expected, timeout = 15000) => {
  const started = Date.now();
  let actual;
  while (Date.now() - started < timeout) { actual = await evaluate(expression); if (actual === expected) return; await wait(150); }
  const body = await evaluate("document.body?.innerText.slice(0, 1000)");
  throw new Error(`Timed out waiting for ${expression}; actual=${JSON.stringify(actual)}; body=${JSON.stringify(body)}`);
};
const navigate = async (url) => { await cdp("Page.navigate", { url }); await poll("document.readyState", "complete"); };
const screenshot = async (name) => {
  const metrics = await cdp("Page.getLayoutMetrics");
  const width = Math.ceil(metrics.cssContentSize.width);
  const height = Math.ceil(metrics.cssContentSize.height);
  const capture = await cdp("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: 0, y: 0, width, height, scale: 1 } });
  await writeFile(path.join(artifacts, name), Buffer.from(capture.data, "base64"));
  return { width, height };
};
const viewportScreenshot = async (name) => {
  const capture = await cdp("Page.captureScreenshot", { format: "png", fromSurface: true });
  await writeFile(path.join(artifacts, name), Buffer.from(capture.data, "base64"));
};

await cdp("Page.enable");
await cdp("Runtime.enable");
await cdp("Log.enable");
await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
await navigate(baseUrl);

const draft = {
  schemaVersion: "1.0.0", sessionId: "assessment_browser0001", status: "ready_for_review", currentStep: 6, twinRevision: 1,
  answers: {
    q1: { businessName: "Kopi Kita Café Group", industry: "food_beverage", businessModel: "b2c", employeeBand: "25_49", description: "Three Malaysian café outlets serving walk-in and catering customers." },
    q2: { websiteOrStore: "active", businessEmail: "not_used", cloudProductivity: "informal", crm: "not_used", digitalMarketingAnalytics: "active", backup: "not_used", cybersecurityControls: "informal", aiTools: "not_used" },
    q3: { biggestChallenge: "customer_management", manualWorkflow: "WhatsApp orders and catering enquiries", manualHoursPerWeek: null, affectedEmployees: 8, urgency: 4 },
    q4: { primaryObjective: "increase_revenue", budgetBand: "5k_15k", implementationPace: "1_3_months", highestConcern: "cost" },
    q5: { leadershipSponsorship: 4, usableData: 2, employeeDigitalSkills: 3, processConsistency: 2, changeWillingness: 4 },
  },
  selectedFollowUpIds: ["fu_manual_hours", "fu_customer_records", "fu_backup_frequency"],
  followUpAnswers: { fu_manual_hours: "11_20", fu_customer_records: "messaging_apps", fu_backup_frequency: "none" },
  updatedAt: "2026-09-17T09:00:00+08:00",
};
await evaluate(`localStorage.setItem("sme-growth-twin:assessment-draft:1.0.0", ${JSON.stringify(JSON.stringify(draft))})`);
await navigate(`${baseUrl}/assessment/analysis`);
await poll("location.pathname", "/results", 12000);
await poll("document.body.innerText.includes('View recommendations')", true);
const resultAction = await evaluate("document.querySelector('a[href=\"/recommendations\"]')?.textContent.trim()");
await evaluate("document.querySelector('a[href=\"/recommendations\"]')?.click()");
await poll("location.pathname", "/recommendations");
await poll("document.body.innerText.includes('Shared customer operations')", true);

const beforeRefreshId = await evaluate("JSON.parse(localStorage.getItem('sme-growth-twin:recommendations:1.0.0')).id");
await cdp("Page.reload", { ignoreCache: true });
await poll("document.readyState", "complete");
await poll("document.body.innerText.includes('Shared customer operations')", true);
const afterRefreshId = await evaluate("JSON.parse(localStorage.getItem('sme-growth-twin:recommendations:1.0.0')).id");
const desktopOverflow = await evaluate("document.documentElement.scrollWidth <= window.innerWidth");
const desktopSize = await screenshot("stage-03-recommendations-desktop.png");
await evaluate("document.querySelector('details')?.setAttribute('open','')");
const expandedSize = await screenshot("stage-03-recommendations-expanded-desktop.png");

await cdp("Emulation.setDeviceMetricsOverride", { width: 360, height: 800, deviceScaleFactor: 1, mobile: true });
await cdp("Page.reload", { ignoreCache: true });
await poll("document.readyState", "complete");
await poll("document.body.innerText.includes('Shared customer operations')", true);
const mobileOverflow = await evaluate("document.documentElement.scrollWidth <= window.innerWidth");
const minTarget = await evaluate("Math.min(...Array.from(document.querySelectorAll('a,button,summary')).map(e=>e.getBoundingClientRect().height).filter(Boolean))");
await evaluate("document.querySelector('details')?.setAttribute('open','')");
await viewportScreenshot("stage-03-recommendations-mobile-360-viewport.png");
const mobileSize = await screenshot("stage-03-recommendations-mobile-360.png");
await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
const focusedTag = await evaluate("document.activeElement?.tagName");
const overlay = await evaluate("Boolean(document.querySelector('[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay'))");
const bodyLength = await evaluate("document.body.innerText.trim().length");

const report = { resultAction, route: await evaluate("location.pathname"), beforeRefreshId, afterRefreshId, persistenceStable: beforeRefreshId === afterRefreshId, desktopOverflow, mobileOverflow, minTarget, focusedTag, overlay, bodyLength, consoleErrors, desktopSize, expandedSize, mobileSize };
console.log(JSON.stringify(report, null, 2));
await cdp("Browser.close");
ws.close();
chrome.kill();
