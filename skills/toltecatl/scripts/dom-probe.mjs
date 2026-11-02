#!/usr/bin/env node
/**
 * dom-probe.mjs — Computed DOM & Multi-Viewport Inspector for Toltecatl.
 *
 * Inspects a live URL or local HTML path across 375x812, 768x1024, and 1440x900
 * using Playwright (if installed) or a zero-dependency Chrome DevTools Protocol
 * driver (Node 22+ global WebSocket), and emits computed-tree.json + screenshots.
 * It never reports passing zeros silently: with no real engine it exits 3 unless
 * --allow-degraded is passed, in which case the report is marked degraded.
 */
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const VIEWPORTS = [
  { name: "mobile", width: 375, height: 812, mobile: true, screenshot: "375px.png" },
  { name: "tablet", width: 768, height: 1024, mobile: false, screenshot: "768px.png" },
  { name: "desktop", width: 1440, height: 900, mobile: false, screenshot: "1440px.png" },
];
const DEVICE_SCALE_FACTOR = 2;
const SCHEMES = new Set(["light", "dark"]);
const NAV_TIMEOUT_MS = 30000;
const CHROME_START_TIMEOUT_MS = 15000;
const MAX_SCREENSHOT_HEIGHT_PX = 4800;
const REVEAL_STEP_PAUSE_MS = 30;
const REVEAL_SETTLE_MS = 100;
const USER_DATA_RM_OPTIONS = { recursive: true, force: true, maxRetries: 5, retryDelay: 100 };
const EXIT = { OK: 0, STRICT_FAIL: 1, USAGE: 2, NO_ENGINE: 3 };

function printHelp() {
  console.log(`Usage: node dom-probe.mjs <url-or-file.html> [--out <dir>] [--scheme light|dark] [--strict] [--allow-degraded]

Computed DOM & multi-viewport inspector for Toltecatl audit ceremonies.
Engines: Playwright (if installed) -> native Chrome CDP driver (zero deps).

Viewports probed (device metrics emulated before any measurement):
  - 375x812  (mobile, 2x DPR)
  - 768x1024 (tablet, 2x DPR)
  - 1440x900 (desktop, 2x DPR)

Metrics per viewport:
  horizontalOverflow, missingTabularNums, rowBaselineMisalignments,
  undersizedTouchTargets (<= 480px), proseDensity (words, long paragraphs,
  cardTextBloat), composition (eyebrowCount, typographicScale,
  sectionOpeningClone, meanLightness), activeAnimations.

Options:
  --out <dir>        Write computed-tree.json and 375px/768px/1440px.png into <dir>
  --scheme <s>       Emulate prefers-color-scheme: light | dark (default: page default)
  --strict           Exit 1 on overflow, undersized touch targets, or row misalignment
  --allow-degraded   Without Playwright/Chrome, emit a degraded report instead of exit 3
  --json             Accepted for compatibility (JSON is always printed)
  -h, --help         Show this help message and exit 0`);
}

function toTargetUrl(input) {
  if (/^(?:https?|file):\/\//i.test(input)) return input;
  const abs = resolve(input);
  if (!existsSync(abs)) {
    console.error(`Error: target file does not exist: ${abs}`);
    process.exit(EXIT.USAGE);
  }
  return pathToFileURL(abs).href;
}

async function tryLoadPlaywright() {
  for (const pkg of ["playwright", "playwright-core"]) {
    try {
      const mod = await import(pkg);
      if (mod && mod.chromium) return mod.chromium;
    } catch {
      // Package not installed: try the next candidate, then the CDP driver.
    }
  }
  return null;
}

// Scroll-reveal sections (IntersectionObserver) stay opacity:0 until scrolled into view,
// so step through the page once before measuring or capturing it.
const PAGE_READY_SOURCE = `(async () => {
  if (document.fonts) await document.fonts.ready;
  const pause = (ms) => new Promise((done) => setTimeout(done, ms));
  const step = Math.max(1, window.innerHeight);
  const end = Math.min(document.documentElement.scrollHeight, ${MAX_SCREENSHOT_HEIGHT_PX});
  for (let y = step; y < end; y += step) {
    window.scrollTo(0, y);
    await pause(${REVEAL_STEP_PAUSE_MS});
  }
  window.scrollTo(0, 0);
  await pause(${REVEAL_SETTLE_MS});
  return true;
})()`;

const IN_PAGE_PROBE_SOURCE = `((viewportWidth) => {
  const words = (t) => (t || "").trim().split(/\\s+/).filter(Boolean).length;
  const isVisible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return false;
    const cs = getComputedStyle(el);
    return cs.visibility !== "hidden" && cs.display !== "none";
  };
  const describe = (el) => {
    const tag = el.tagName.toLowerCase();
    const cls = typeof el.className === "string" ? el.className.trim() : "";
    return cls ? tag + "." + cls.split(/\\s+/).join(".") : tag;
  };
  const px = (v) => parseFloat(v) || 0;
  const round = (n, d = 2) => Number(n.toFixed(d));

  const scrollWidth = document.documentElement.scrollWidth;
  const innerWidth = window.innerWidth || viewportWidth;
  const horizontalOverflow = {
    overflows: scrollWidth > innerWidth,
    scrollWidth,
    innerWidth,
    deltaPx: Math.max(0, scrollWidth - innerWidth),
  };

  const pricePattern = /\\$\\s?\\d|\\d+\\.\\d+%|\\b(?:MXN|USD)\\s?\\d|\\b\\d{1,2}:\\d{2}\\b/;
  const missingTabularNums = [];
  for (const el of document.querySelectorAll("body *:not(script):not(style)")) {
    if (el.children.length > 0) continue;
    const text = (el.textContent || "").trim();
    if (!pricePattern.test(text)) continue;
    const cs = getComputedStyle(el);
    const fvn = cs.fontVariantNumeric || "";
    const ffs = cs.fontFeatureSettings || "";
    if (fvn.includes("tabular-nums") || ffs.includes("tnum")) continue;
    missingTabularNums.push({ tag: el.tagName.toLowerCase(), selector: describe(el), text: text.slice(0, 48), fontVariantNumeric: fvn || "normal" });
  }

  const rowBaselineMisalignments = [];
  const seenPairs = new Set();
  const rowContainers = document.querySelectorAll('.line-grid, .form-row, form, [class*="grid"], [class*="row"]');
  for (const container of rowContainers) {
    const controls = Array.from(container.querySelectorAll("input, select, button, textarea"))
      .filter((c) => !/^(?:hidden|checkbox|radio)$/i.test(c.type || "") && isVisible(c));
    for (let i = 0; i < controls.length - 1; i++) {
      const a = controls[i];
      const b = controls[i + 1];
      const ra = a.getBoundingClientRect();
      const rb = b.getBoundingClientRect();
      const centerDelta = Math.abs((ra.top + ra.height / 2) - (rb.top + rb.height / 2));
      const bottomDelta = Math.abs(ra.bottom - rb.bottom);
      if (centerDelta > 24 || bottomDelta <= 1.5) continue;
      const key = describe(a) + ra.top + "|" + describe(b) + rb.top;
      if (seenPairs.has(key)) continue;
      seenPairs.add(key);
      rowBaselineMisalignments.push({
        container: describe(container),
        elementA: a.tagName.toLowerCase() + (a.name ? '[name="' + a.name + '"]' : ""),
        elementB: b.tagName.toLowerCase() + (b.name ? '[name="' + b.name + '"]' : ""),
        bottomA: round(ra.bottom), bottomB: round(rb.bottom), deltaPx: round(bottomDelta),
      });
    }
  }

  const undersizedTouchTargets = [];
  if (viewportWidth <= 480) {
    for (const el of document.querySelectorAll("button, a[href], input, select, textarea, [role='button']")) {
      if (!isVisible(el)) continue;
      if (el.type === "hidden") continue;
      const inlineProseLink = el.tagName === "A" && el.closest("p, li") !== null && getComputedStyle(el).display === "inline";
      if (inlineProseLink) continue;
      const r = el.getBoundingClientRect();
      if (r.width >= 44 && r.height >= 44) continue;
      undersizedTouchTargets.push({
        tag: el.tagName.toLowerCase(),
        label: (el.textContent || el.getAttribute("aria-label") || el.getAttribute("name") || "").trim().slice(0, 40),
        width: round(r.width, 1), height: round(r.height, 1),
      });
    }
  }

  const paragraphs = Array.from(document.querySelectorAll("p")).filter(isVisible);
  const longParagraphs = [];
  for (const p of paragraphs) {
    const w = words(p.innerText);
    const fontSizePx = px(getComputedStyle(p).fontSize) || 16;
    const measureCh = p.getBoundingClientRect().width / (fontSizePx * 0.52);
    if (w > 45 || measureCh > 78) {
      longParagraphs.push({ selector: describe(p), words: w, measureCh: round(measureCh, 1), text: p.innerText.trim().slice(0, 60) });
    }
  }
  const cardTextBloat = [];
  const cardSelector = '.card, [class*="card"], [class*="ledger"] > div, article, li';
  for (const item of new Set(document.querySelectorAll(cardSelector))) {
    const ps = Array.from(item.querySelectorAll("p")).filter(isVisible);
    if (ps.length === 0) continue;
    const text = ps.map((p) => p.innerText.trim()).join(" ");
    const w = words(text);
    if (w > 38 || text.length > 240) {
      cardTextBloat.push({ selector: describe(item), words: w, chars: text.length, text: text.slice(0, 60) });
    }
  }
  const proseDensity = {
    totalWords: words(document.body ? document.body.innerText : ""),
    paragraphCount: paragraphs.length,
    longParagraphs,
    cardTextBloat,
  };

  let eyebrowCount = 0;
  for (const el of document.querySelectorAll("body *:not(script):not(style)")) {
    const ownText = Array.from(el.childNodes).filter((n) => n.nodeType === 3).map((n) => n.textContent).join(" ").trim();
    if (!ownText || words(ownText) > 6 || !isVisible(el)) continue;
    const cs = getComputedStyle(el);
    const tracked = px(cs.letterSpacing) >= 1;
    if (px(cs.fontSize) <= 13 && (cs.textTransform === "uppercase" || tracked)) eyebrowCount++;
  }

  const fontSizeOf = (sel) => {
    const el = document.querySelector(sel);
    return el ? px(getComputedStyle(el).fontSize) : null;
  };
  const h1 = fontSizeOf("h1");
  const h2 = fontSizeOf("h2");
  const body = fontSizeOf("body") || 16;
  const h1ToBodyRatio = h1 ? round(h1 / body) : null;
  const typographicScale = {
    h1Px: h1, h2Px: h2, bodyPx: body,
    h1ToBodyRatio,
    h2ToBodyRatio: h2 ? round(h2 / body) : null,
    timidScale: h1 !== null && h1ToBodyRatio < 1.8,
  };

  const sections = Array.from(document.querySelectorAll("main > section, body > section, main > div"));
  let run = 0, maxRun = 0, prevKey = null, cloneSignature = null;
  for (const s of sections) {
    const signature = Array.from(s.children).slice(0, 2).map((c) => c.tagName.toLowerCase()).join("+");
    const key = signature ? signature + "@" + getComputedStyle(s).paddingTop : null;
    run = key && key === prevKey ? run + 1 : (key ? 1 : 0);
    if (run > maxRun) { maxRun = run; cloneSignature = signature; }
    prevKey = key;
  }
  const sectionOpeningClone = { flagged: maxRun >= 3, maxConsecutive: maxRun, signature: cloneSignature };

  const resolveBackground = () => {
    const candidates = [document.body, document.documentElement, document.querySelector("main, #app, #root, body > div")];
    for (const el of candidates.filter(Boolean)) {
      const bg = getComputedStyle(el).backgroundColor;
      const ctx = document.createElement("canvas").getContext("2d");
      ctx.fillStyle = "#000"; ctx.fillStyle = bg; ctx.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
      if (a > 0) return { css: bg, rgb: [r, g, b] };
    }
    return { css: "canvas-default", rgb: [255, 255, 255] };
  };
  const bg = resolveBackground();
  const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const [lr, lg, lb] = bg.rgb.map(lin);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const sCone = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  const meanLightness = round(0.2104542553 * l + 0.793617785 * m - 0.0040720468 * sCone, 3);

  const composition = {
    eyebrowCount,
    eyebrowSpam: eyebrowCount > 3,
    typographicScale,
    sectionOpeningClone,
    meanLightness,
    background: bg.css,
    relativeLuminance: round(0.2126 * lr + 0.7152 * lg + 0.0722 * lb, 3),
  };

  return {
    viewport: { width: innerWidth, height: window.innerHeight },
    horizontalOverflow,
    missingTabularNums,
    rowBaselineMisalignments,
    undersizedTouchTargets,
    proseDensity,
    composition,
    activeAnimations: (document.getAnimations ? document.getAnimations() : []).length,
  };
})`;

async function probeWithPlaywright(chromium, url, outDir, scheme) {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: DEVICE_SCALE_FACTOR,
        isMobile: vp.mobile,
        hasTouch: vp.mobile,
        ...(scheme ? { colorScheme: scheme } : {}),
      });
      const page = await context.newPage();
      await page.goto(url, { waitUntil: "networkidle", timeout: NAV_TIMEOUT_MS }).catch(() =>
        page.goto(url, { waitUntil: "load", timeout: NAV_TIMEOUT_MS })
      );
      await page.evaluate(PAGE_READY_SOURCE);
      const metrics = await page.evaluate(
        new Function("vpWidth", `return ${IN_PAGE_PROBE_SOURCE}(vpWidth);`),
        vp.width
      );
      const screenshot = outDir ? join(outDir, vp.screenshot) : null;
      if (screenshot) await playwrightScreenshot(page, vp, screenshot);
      results.push({ name: vp.name, width: vp.width, height: vp.height, screenshot, ...metrics });
      await context.close();
    }
  } finally {
    await browser.close();
  }
  return results;
}

const cappedScreenshotHeight = (vp, contentHeight) =>
  Math.min(MAX_SCREENSHOT_HEIGHT_PX, Math.max(vp.height, Math.ceil(contentHeight)));

async function playwrightScreenshot(page, vp, path) {
  const contentHeight = await page.evaluate("document.documentElement.scrollHeight");
  const height = cappedScreenshotHeight(vp, contentHeight);
  await page.screenshot({ path, fullPage: true, clip: { x: 0, y: 0, width: vp.width, height } });
}

function findChromeBinary() {
  const candidates = [
    process.env.CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "google-chrome",
    "google-chrome-stable",
    "chromium",
    "chromium-browser",
  ].filter(Boolean);
  for (const bin of candidates) {
    if (bin.startsWith("/")) {
      if (existsSync(bin)) return bin;
      continue;
    }
    const check = spawnSync("which", [bin], { encoding: "utf8" });
    if (check.status === 0 && check.stdout.trim()) return check.stdout.trim();
  }
  return null;
}

function launchChrome(chromeBin, userDataDir) {
  const chrome = spawn(chromeBin, [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--allow-file-access-from-files",
    "--remote-debugging-port=0",
    `--user-data-dir=${userDataDir}`,
    "about:blank",
  ], { stdio: ["ignore", "ignore", "pipe"] });
  const ready = new Promise((resolvePort, reject) => {
    let buffer = "";
    const timer = setTimeout(() => reject(new Error("Chrome did not expose a DevTools endpoint in time")), CHROME_START_TIMEOUT_MS);
    chrome.stderr.on("data", (chunk) => {
      buffer += chunk.toString();
      const match = buffer.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (!match) return;
      clearTimeout(timer);
      resolvePort(new URL(match[1]).port);
    });
    chrome.once("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`Chrome exited before DevTools was ready (code ${code})`));
    });
  });
  return { chrome, ready };
}

async function openPageTarget(port) {
  const base = `http://127.0.0.1:${port}`;
  const targets = await (await fetch(`${base}/json/list`)).json();
  const page = targets.find((t) => t.type === "page");
  if (page) return page;
  return (await fetch(`${base}/json/new?about:blank`, { method: "PUT" })).json();
}

class CdpSession {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    this.waiters = [];
    socket.addEventListener("message", (event) => this.#onMessage(JSON.parse(event.data)));
  }

  static async connect(wsUrl) {
    const socket = new WebSocket(wsUrl);
    await new Promise((ok, fail) => {
      socket.addEventListener("open", ok, { once: true });
      socket.addEventListener("error", () => fail(new Error(`CDP socket failed: ${wsUrl}`)), { once: true });
    });
    return new CdpSession(socket);
  }

  #onMessage(msg) {
    if (msg.id && this.pending.has(msg.id)) {
      const { ok, fail } = this.pending.get(msg.id);
      this.pending.delete(msg.id);
      if (msg.error) fail(new Error(`CDP ${msg.error.message}`));
      else ok(msg.result);
      return;
    }
    this.waiters = this.waiters.filter((w) => (w.method === msg.method ? (w.ok(msg.params), false) : true));
  }

  send(method, params = {}) {
    const id = this.nextId++;
    this.socket.send(JSON.stringify({ id, method, params }));
    return new Promise((ok, fail) => this.pending.set(id, { ok, fail }));
  }

  waitFor(method, timeoutMs = NAV_TIMEOUT_MS) {
    return new Promise((ok, fail) => {
      const timer = setTimeout(() => fail(new Error(`Timed out waiting for ${method}`)), timeoutMs);
      this.waiters.push({ method, ok: (p) => { clearTimeout(timer); ok(p); } });
    });
  }

  close() {
    this.socket.close();
  }
}

async function cdpEvaluate(session, expression) {
  const { result, exceptionDetails } = await session.send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) throw new Error(`In-page probe failed: ${exceptionDetails.text}`);
  return result.value;
}

async function cdpScreenshot(session, vp, path) {
  const { cssContentSize } = await session.send("Page.getLayoutMetrics");
  const height = cappedScreenshotHeight(vp, cssContentSize.height);
  const { data } = await session.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
    clip: { x: 0, y: 0, width: vp.width, height, scale: 1 },
  });
  writeFileSync(path, Buffer.from(data, "base64"));
}

async function cdpProbeViewport(session, vp, url, outDir) {
  await session.send("Emulation.setDeviceMetricsOverride", {
    width: vp.width,
    height: vp.height,
    deviceScaleFactor: DEVICE_SCALE_FACTOR,
    mobile: vp.mobile,
  });
  await session.send("Emulation.setTouchEmulationEnabled", { enabled: vp.mobile });
  const loaded = session.waitFor("Page.loadEventFired");
  const nav = await session.send("Page.navigate", { url });
  if (nav.errorText) throw new Error(`Navigation failed: ${nav.errorText} (${url})`);
  await loaded;
  const landedOnErrorPage = await cdpEvaluate(session, 'location.href.startsWith("chrome-error://")');
  if (landedOnErrorPage) throw new Error(`Navigation failed: Chrome error page for ${url}`);
  await cdpEvaluate(session, PAGE_READY_SOURCE);
  const metrics = await cdpEvaluate(session, `${IN_PAGE_PROBE_SOURCE}(${vp.width})`);
  const screenshot = outDir ? join(outDir, vp.screenshot) : null;
  if (screenshot) await cdpScreenshot(session, vp, screenshot);
  return { name: vp.name, width: vp.width, height: vp.height, screenshot, ...metrics };
}

async function probeWithCdp(chromeBin, url, outDir, scheme) {
  const userDataDir = mkdtempSync(join(tmpdir(), "toltecatl-cdp-"));
  const { chrome, ready } = launchChrome(chromeBin, userDataDir);
  let session = null;
  try {
    const port = await ready;
    const target = await openPageTarget(port);
    session = await CdpSession.connect(target.webSocketDebuggerUrl);
    await session.send("Page.enable");
    await session.send("Runtime.enable");
    if (scheme) {
      await session.send("Emulation.setEmulatedMedia", {
        features: [{ name: "prefers-color-scheme", value: scheme }],
      });
    }
    const results = [];
    for (const vp of VIEWPORTS) results.push(await cdpProbeViewport(session, vp, url, outDir));
    return results;
  } finally {
    if (session) session.close();
    chrome.kill("SIGKILL");
    await new Promise((done) => (chrome.exitCode !== null ? done() : chrome.once("exit", done)));
    try {
      rmSync(userDataDir, USER_DATA_RM_OPTIONS);
    } catch {
      // Chrome helpers can hold profile locks briefly after exit; a leftover temp dir is harmless.
    }
  }
}

function degradedReport() {
  return VIEWPORTS.map((vp) => ({
    name: vp.name,
    width: vp.width,
    height: vp.height,
    screenshot: null,
    degraded: true,
    note: "No Playwright or Chrome available: nothing was measured. Values are null, not passing.",
    horizontalOverflow: null,
    missingTabularNums: null,
    rowBaselineMisalignments: null,
    undersizedTouchTargets: null,
    proseDensity: null,
    composition: null,
    activeAnimations: null,
  }));
}

function parseArgs(argv) {
  const valueFlags = new Set(["--out", "--scheme"]);
  const opts = { out: null, scheme: null, strict: false, allowDegraded: false, positional: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (valueFlags.has(a)) {
      opts[a.slice(2)] = argv[++i] || null;
    } else if (a === "--strict") {
      opts.strict = true;
    } else if (a === "--allow-degraded") {
      opts.allowDegraded = true;
    } else if (!a.startsWith("-")) {
      opts.positional.push(a);
    }
  }
  return opts;
}

function strictViolations(viewports) {
  const violations = [];
  for (const vp of viewports) {
    if (vp.horizontalOverflow?.overflows) violations.push(`${vp.name}: horizontal overflow ${vp.horizontalOverflow.deltaPx}px`);
    if (vp.undersizedTouchTargets?.length) violations.push(`${vp.name}: ${vp.undersizedTouchTargets.length} undersized touch target(s)`);
    if (vp.rowBaselineMisalignments?.length) violations.push(`${vp.name}: ${vp.rowBaselineMisalignments.length} row baseline misalignment(s)`);
  }
  return violations;
}

async function runEngines(url, outDir, scheme, allowDegraded) {
  const chromium = await tryLoadPlaywright();
  if (chromium) {
    try {
      return { engine: "playwright", viewports: await probeWithPlaywright(chromium, url, outDir, scheme) };
    } catch (err) {
      console.error(`Playwright probe failed (${err.message.split("\n")[0]}); falling back to Chrome CDP.`);
    }
  }
  const chromeBin = typeof WebSocket === "function" ? findChromeBinary() : null;
  if (chromeBin) return { engine: "cdp", viewports: await probeWithCdp(chromeBin, url, outDir, scheme) };
  if (!allowDegraded) {
    console.error("Error: no usable engine (Playwright, or Chrome/Chromium with Node 22+ global WebSocket). Install one, set CHROME_PATH, or pass --allow-degraded.");
    process.exit(EXIT.NO_ENGINE);
  }
  return { engine: "degraded-fallback", degraded: true, viewports: degradedReport() };
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("-h") || argv.includes("--help")) {
    printHelp();
    process.exit(EXIT.OK);
  }
  const opts = parseArgs(argv);
  if (opts.positional.length === 0) {
    console.error("Usage: node dom-probe.mjs <url-or-file.html> [--out <dir>] [--scheme light|dark] [--strict] [--allow-degraded]");
    process.exit(EXIT.USAGE);
  }
  if (opts.scheme && !SCHEMES.has(opts.scheme)) {
    console.error(`Error: --scheme must be "light" or "dark", got "${opts.scheme}"`);
    process.exit(EXIT.USAGE);
  }
  const outDir = opts.out ? resolve(opts.out) : null;
  if (outDir) mkdirSync(outDir, { recursive: true });

  const rawTarget = opts.positional[0];
  const url = toTargetUrl(rawTarget);
  const { engine, degraded = false, viewports } = await runEngines(url, outDir, opts.scheme, opts.allowDegraded);
  const report = {
    target: rawTarget,
    url,
    timestamp: new Date().toISOString(),
    engine,
    degraded,
    scheme: opts.scheme || "page-default",
    viewports,
  };

  const jsonOutput = JSON.stringify(report, null, 2);
  if (outDir) writeFileSync(join(outDir, "computed-tree.json"), jsonOutput + "\n", "utf8");
  console.log(jsonOutput);

  const violations = opts.strict ? strictViolations(viewports) : [];
  if (violations.length > 0) {
    console.error(`--strict: ${violations.join("; ")}`);
    process.exit(EXIT.STRICT_FAIL);
  }
}

main().catch((err) => {
  console.error(`dom-probe failed: ${err.message}`);
  process.exit(EXIT.USAGE);
});
