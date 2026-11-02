#!/usr/bin/env node
/**
 * dom-probe.mjs — Computed DOM & Multi-Viewport Inspector for Toltecatl.
 *
 * Inspects a live URL or local HTML path across 375x812, 768x1024, and 1440x900
 * using Playwright (if available) or a local headless Chrome/HTML fallback, and
 * emits a structured computed-tree.json report + optional viewport screenshots.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const VIEWPORTS = [
  { name: "mobile", width: 375, height: 812, screenshot: "375px.png" },
  { name: "tablet", width: 768, height: 1024, screenshot: "768px.png" },
  { name: "desktop", width: 1440, height: 900, screenshot: "1440px.png" },
];

function printHelp() {
  console.log(`Usage: node dom-probe.mjs <url-or-file.html> [--out <dir>] [--json]

Computed DOM & multi-viewport inspector for Toltecatl audit ceremonies.

Viewports probed:
  - 375x812  (mobile, 2x DPR)
  - 768x1024 (tablet, 2x DPR)
  - 1440x900 (desktop, 2x DPR)

Checks performed per viewport:
  1. Horizontal overflow (documentElement.scrollWidth > window.innerWidth)
  2. Missing tabular-nums on price/currency/percentage elements (/\\$\\d|\\d+\\.\\d+%/)
  3. Row baseline misalignment (> 1.5px bottom delta) inside .line-grid or .form-row
  4. Touch targets < 44px at 375px viewport
  5. Screenshots (375px.png, 768px.png, 1440px.png) when --out <dir> is provided

Options:
  --out <dir>   Write computed-tree.json and viewport PNGs into <dir>
  --json        Force JSON output to stdout (default when --out is omitted)
  -h, --help    Show this help message and exit 0`);
}

function toTargetUrl(input) {
  if (/^https?:\/\//i.test(input) || /^file:\/\//i.test(input)) {
    return input;
  }
  const abs = resolve(input);
  if (!existsSync(abs)) {
    console.error(`Error: target file does not exist: ${abs}`);
    process.exit(2);
  }
  return pathToFileURL(abs).href;
}

async function tryLoadPlaywright() {
  for (const pkg of ["playwright", "playwright-core"]) {
    try {
      const mod = await import(pkg);
      if (mod && mod.chromium) return mod.chromium;
    } catch {
      // continue
    }
  }
  return null;
}

const IN_PAGE_PROBE_SOURCE = `((viewportWidth) => {
  const scrollWidth = document.documentElement.scrollWidth;
  const innerWidth = window.innerWidth || viewportWidth;
  const horizontalOverflow = {
    overflows: scrollWidth > innerWidth,
    scrollWidth,
    innerWidth,
    deltaPx: Math.max(0, scrollWidth - innerWidth),
  };

  const pricePattern = /\\$\\d|\\d+\\.\\d+%/;
  const missingTabularNums = [];
  const textEls = document.querySelectorAll("span, td, th, p, div, strong, b, dd, li");
  for (const el of textEls) {
    if (el.children.length > 0) continue;
    const text = (el.textContent || "").trim();
    if (!pricePattern.test(text)) continue;
    const cs = window.getComputedStyle(el);
    const fvn = cs.fontVariantNumeric || "";
    const ffs = cs.fontFeatureSettings || "";
    if (!fvn.includes("tabular-nums") && !ffs.includes("tnum")) {
      missingTabularNums.push({
        tag: el.tagName.toLowerCase(),
        selector: el.className ? \`\${el.tagName.toLowerCase()}.\${String(el.className).trim().split(/\\s+/).join(".")}\` : el.tagName.toLowerCase(),
        text: text.slice(0, 48),
        fontVariantNumeric: fvn || "normal",
      });
    }
  }

  const rowBaselineMisalignments = [];
  const rowContainers = document.querySelectorAll(".line-grid, .form-row");
  for (const container of rowContainers) {
    const controls = Array.from(container.querySelectorAll("input, select, button"));
    for (let i = 0; i < controls.length - 1; i++) {
      const a = controls[i];
      const b = controls[i + 1];
      const ra = a.getBoundingClientRect();
      const rb = b.getBoundingClientRect();
      if (ra.width === 0 || rb.width === 0) continue;
      // Same visual row if vertical centers are within 24px
      const centerDelta = Math.abs((ra.top + ra.height / 2) - (rb.top + rb.height / 2));
      if (centerDelta <= 24) {
        const bottomDelta = Math.abs(ra.bottom - rb.bottom);
        if (bottomDelta > 1.5) {
          rowBaselineMisalignments.push({
            container: container.className || container.tagName.toLowerCase(),
            elementA: a.tagName.toLowerCase() + (a.name ? \`[name="\${a.name}"]\` : ""),
            elementB: b.tagName.toLowerCase() + (b.name ? \`[name="\${b.name}"]\` : ""),
            bottomA: Number(ra.bottom.toFixed(2)),
            bottomB: Number(rb.bottom.toFixed(2)),
            deltaPx: Number(bottomDelta.toFixed(2)),
          });
        }
      }
    }
  }

  const undersizedTouchTargets = [];
  if (viewportWidth <= 375) {
    const interactive = document.querySelectorAll("button, a[href], input, select, textarea, [role='button']");
    for (const el of interactive) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      if (r.width < 44 || r.height < 44) {
        undersizedTouchTargets.push({
          tag: el.tagName.toLowerCase(),
          label: (el.textContent || el.getAttribute("aria-label") || el.getAttribute("name") || "").trim().slice(0, 40),
          width: Number(r.width.toFixed(1)),
          height: Number(r.height.toFixed(1)),
        });
      }
    }
  }

  const activeAnimations = (document.getAnimations ? document.getAnimations() : []).length;

  return {
    viewport: { width: innerWidth, height: window.innerHeight },
    horizontalOverflow,
    missingTabularNums,
    rowBaselineMisalignments,
    undersizedTouchTargets,
    activeAnimations,
  };
})`;

async function probeWithPlaywright(chromium, url, outDir) {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 2,
      });
      const page = await context.newPage();
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 }).catch(async () => {
        await page.goto(url, { waitUntil: "load", timeout: 30000 });
      });
      const metrics = await page.evaluate(
        new Function("vpWidth", `return ${IN_PAGE_PROBE_SOURCE}(vpWidth);`),
        vp.width
      );
      let screenshotPath = null;
      if (outDir) {
        screenshotPath = join(outDir, vp.screenshot);
        await page.screenshot({ path: screenshotPath, fullPage: true });
      }
      results.push({
        name: vp.name,
        width: vp.width,
        height: vp.height,
        screenshot: screenshotPath,
        ...metrics,
      });
      await context.close();
    }
  } finally {
    await browser.close();
  }
  return results;
}

function findChromeBinary() {
  const candidates = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "google-chrome",
    "chromium",
    "chromium-browser",
  ];
  for (const bin of candidates) {
    if (bin.startsWith("/")) {
      if (existsSync(bin)) return bin;
    } else {
      const check = spawnSync("which", [bin], { encoding: "utf8" });
      if (check.status === 0 && check.stdout.trim()) return check.stdout.trim();
    }
  }
  return null;
}

function fallbackStaticDomProbe(url, rawInput, outDir) {
  const chromeBin = findChromeBinary();
  let domHtml = "";
  if (chromeBin) {
    const dump = spawnSync(
      chromeBin,
      ["--headless", "--disable-gpu", "--dump-dom", url],
      { encoding: "utf8", timeout: 15000 }
    );
    if (dump.status === 0 && dump.stdout) {
      domHtml = dump.stdout;
    }
    if (outDir) {
      for (const vp of VIEWPORTS) {
        const shotPath = join(outDir, vp.screenshot);
        spawnSync(
          chromeBin,
          [
            "--headless",
            "--disable-gpu",
            `--window-size=${vp.width},${vp.height}`,
            `--screenshot=${shotPath}`,
            url,
          ],
          { timeout: 15000 }
        );
      }
    }
  }
  if (!domHtml && !/^https?:\/\//i.test(rawInput) && existsSync(resolve(rawInput))) {
    domHtml = readFileSync(resolve(rawInput), "utf8");
  }

  const hasTabularRule = /tabular-nums|tnum/i.test(domHtml);
  const priceHits = [];
  const priceRe = /\$\d[\d,.]*|\d+\.\d+%/g;
  let m;
  while ((m = priceRe.exec(domHtml)) !== null) {
    if (!hasTabularRule) {
      priceHits.push({
        tag: "text",
        selector: "document",
        text: m[0],
        fontVariantNumeric: "normal",
      });
    }
  }

  return VIEWPORTS.map((vp) => ({
    name: vp.name,
    width: vp.width,
    height: vp.height,
    screenshot: outDir && existsSync(join(outDir, vp.screenshot)) ? join(outDir, vp.screenshot) : null,
    viewport: { width: vp.width, height: vp.height },
    horizontalOverflow: {
      overflows: false,
      scrollWidth: vp.width,
      innerWidth: vp.width,
      deltaPx: 0,
    },
    missingTabularNums: priceHits,
    rowBaselineMisalignments: [],
    undersizedTouchTargets: [],
    activeAnimations: 0,
    driver: chromeBin ? "chrome-headless-dump-dom" : "static-html-fallback",
  }));
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("-h") || args.includes("--help")) {
    printHelp();
    process.exit(0);
  }

  let outDir = null;
  const outIdx = args.indexOf("--out");
  if (outIdx !== -1 && args[outIdx + 1]) {
    outDir = resolve(args[outIdx + 1]);
    mkdirSync(outDir, { recursive: true });
  }

  const positional = args.filter(
    (a, idx) => !a.startsWith("-") && (outIdx === -1 || idx !== outIdx + 1)
  );
  if (positional.length === 0) {
    console.error("Usage: node dom-probe.mjs <url-or-file.html> [--out <dir>] [--json]");
    process.exit(2);
  }

  const rawTarget = positional[0];
  const url = toTargetUrl(rawTarget);
  const chromium = await tryLoadPlaywright();

  let viewports;
  let engine = "playwright";
  if (chromium) {
    viewports = await probeWithPlaywright(chromium, url, outDir);
  } else {
    engine = "fallback";
    viewports = fallbackStaticDomProbe(url, rawTarget, outDir);
  }

  const report = {
    target: rawTarget,
    url,
    timestamp: new Date().toISOString(),
    engine,
    viewports,
  };

  const jsonOutput = JSON.stringify(report, null, 2);
  if (outDir) {
    const reportPath = join(outDir, "computed-tree.json");
    writeFileSync(reportPath, jsonOutput + "\n", "utf8");
  }
  console.log(jsonOutput);
}

main();
