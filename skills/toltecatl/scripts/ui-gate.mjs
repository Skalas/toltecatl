#!/usr/bin/env node
/**
 * ui-gate.mjs — Zero-dependency deterministic UI & House-Rule static gate (Node 20+ ESM).
 *
 * Usage:
 *   node ui-gate.mjs [--json] [--strict-house] [--static] <file-or-dir> [...]
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";

const SCAN_EXTENSIONS = new Set([
  ".html",
  ".htm",
  ".css",
  ".scss",
  ".vue",
  ".jsx",
  ".tsx",
  ".svelte",
  ".astro",
]);

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
]);

const EM_DASH = "\u2014";
const EM_DASH_ENTITY_RE = /&mdash;|&#8212;|&#x2014;|\\u\{?2014\}?/i;
const TRANSITION_ALL_RE =
  /transition\s*:\s*["']?all\b|transition-property\s*:\s*all\b|\btransition-all\b/i;
const EASE_IN_UI_RE = /\bease-in\b(?![-\w])/i;
const SCALE_ZERO_ENTRY_RE = /scale\(\s*0(?:\.0+)?\s*\)|\bscale-0\b/;
const SCROLL_LISTENER_RE =
  /addEventListener\s*\(\s*["']scroll["']|\bonscroll\s*=/;
const GRADIENT_TEXT_CLIP_RE =
  /(?:-webkit-)?background-clip\s*:\s*text\b|\bbg-clip-text\b/i;
const GRADIENT_FN_RE = /(?:linear|radial|conic)-gradient\s*\(/i;
const SIDE_STRIPE_DECL_RE =
  /border-(?:left|right)\s*:\s*(?:[2-9]|\d{2,})px\s+solid\b|\bborder-[lr]-(?:[2-9]|\[\d+px\])/i;
const CARD_CALLOUT_CONTEXT_RE =
  /card|callout|alert|notice|banner|panel|toast|quote|blockquote|aside/i;
const EMOJI_OR_DINGBAT_RE =
  /[\u{1F512}\u{1F680}\u{1F525}\u{1F4A1}\u{2728}\u{2605}\u{2726}\u{25CF}\u{1F300}-\u{1FAFF}]/u;
const OFF_BRAND_CREAM_RE =
  /#(?:f4f1ea|f7f4ee|faf8f5|f2ede4|efece6|fdf8f3)\b/i;
const SLOP_BUZZWORDS_RE =
  /\b(?:revolutionize[sd]?|revolutionizing|unleash(?:es|ed|ing)?|supercharge[sd]?|supercharging|game-changer|seamlessly|elevate\s+your)\b/i;
const Z_INDEX_MAGIC_RE =
  /\bz-index\s*:\s*(9{3,})\b|\bzIndex\s*:\s*["']?(9{3,})\b|\bz-\[(9{3,})\]/;
const OUTLINE_NONE_RE =
  /\boutline\s*:\s*["']?(?:none|0(?:px)?)\b|\boutline-(?:none|hidden)\b/;

function printHelp() {
  console.log(`Usage: node ui-gate.mjs [--json] [--strict-house] [--static] <file-or-dir> [...]

Deterministic UI/UX and Toltecatl House static gate.

Options:
  --json          Emit machine-readable JSON findings report
  --strict-house  Promote house rules (EMOJI_OR_DINGBAT, OFF_BRAND_CREAM_HEX) from WARN to FAIL
  --static        Run static source analysis (default mode)
  -h, --help      Show this help message and exit 0

Inline suppression:
  /* toltecatl-allow: <RULE_ID> -- <reason> */
  <!-- toltecatl-allow: <RULE_ID> -- <reason> -->`);
}

function parseSuppressions(content) {
  const allowed = new Map();
  const patterns = [
    /\/\*\s*(?:toltecatl|auteur)-allow:\s*([A-Z0-9_]+)\s*--\s*([\s\S]*?)\*\//g,
    /\/\/\s*(?:toltecatl|auteur)-allow:\s*([A-Z0-9_]+)\s*--\s*(.+)/g,
    /<!--\s*(?:toltecatl|auteur)-allow:\s*([A-Z0-9_]+)\s*--\s*([\s\S]*?)-->/g,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(content)) !== null) {
      const ruleId = m[1].trim();
      const reason = m[2].trim();
      if (reason.length > 0) {
        allowed.set(ruleId, reason);
      }
    }
  }
  return allowed;
}

function stripCommentsPreserveLines(content) {
  return content
    .replace(/\/\*[\s\S]*?\*\//g, (match) => match.replace(/[^\n]/g, " "))
    .replace(/<!--[\s\S]*?-->/g, (match) => match.replace(/[^\n]/g, " "))
    .replace(/(^|[^:\\])\/\/[^\n]*/gm, "$1");
}

function collectFiles(targets) {
  const files = [];
  for (const target of targets) {
    const abs = resolve(target);
    let stat;
    try {
      stat = statSync(abs);
    } catch {
      continue;
    }
    if (stat.isFile()) {
      if (SCAN_EXTENSIONS.has(extname(abs).toLowerCase())) {
        files.push(abs);
      }
      continue;
    }
    if (stat.isDirectory()) {
      for (const entry of readdirSync(abs, { withFileTypes: true })) {
        if (entry.isSymbolicLink()) continue;
        const full = join(abs, entry.name);
        if (entry.isDirectory()) {
          if (SKIP_DIRS.has(entry.name)) continue;
          files.push(...collectFiles([full]));
        } else if (SCAN_EXTENSIONS.has(extname(entry.name).toLowerCase())) {
          files.push(full);
        }
      }
    }
  }
  return files;
}

function snippet(line) {
  return line.trim().slice(0, 96);
}

export function scanFile(filePath, { strictHouse = false } = {}) {
  const raw = readFileSync(filePath, "utf8");
  const suppressions = parseSuppressions(raw);
  const stripped = stripCommentsPreserveLines(raw);
  const rawLines = raw.split("\n");
  const cleanLines = stripped.split("\n");

  const findings = [];
  const hasFocusVisible = /:focus-visible|\bfocus-visible:/.test(stripped);
  const hasGradientInFile =
    GRADIENT_FN_RE.test(stripped) || /\bbg-gradient-to-/.test(stripped);

  const pushFinding = (lineNum, rule, defaultSeverity, detail) => {
    const supReason = suppressions.get(rule);
    const suppressed = Boolean(supReason);
    findings.push({
      file: filePath,
      line: lineNum,
      rule,
      severity: defaultSeverity,
      detail,
      suppressed,
      suppressionReason: supReason || null,
    });
  };

  let enclosingContext = "";

  for (let i = 0; i < cleanLines.length; i++) {
    const lineNum = i + 1;
    const line = cleanLines[i];
    const rawLine = rawLines[i] || "";

    if (/\{/.test(line)) {
      enclosingContext =
        (cleanLines[i - 1] || "") + " " + line;
    }

    if (line.includes(EM_DASH) || EM_DASH_ENTITY_RE.test(line)) {
      pushFinding(lineNum, "EM_DASH", "FAIL", snippet(rawLine));
    }

    if (TRANSITION_ALL_RE.test(line)) {
      pushFinding(lineNum, "TRANSITION_ALL", "FAIL", snippet(rawLine));
    }

    if (EASE_IN_UI_RE.test(line)) {
      pushFinding(lineNum, "EASE_IN_UI", "FAIL", snippet(rawLine));
    }

    if (SCALE_ZERO_ENTRY_RE.test(line)) {
      pushFinding(lineNum, "SCALE_ZERO_ENTRY", "FAIL", snippet(rawLine));
    }

    if (SCROLL_LISTENER_RE.test(line)) {
      pushFinding(lineNum, "SCROLL_LISTENER", "FAIL", snippet(rawLine));
    }

    if (GRADIENT_TEXT_CLIP_RE.test(line) && hasGradientInFile) {
      pushFinding(lineNum, "GRADIENT_TEXT", "FAIL", snippet(rawLine));
    }

    if (SIDE_STRIPE_DECL_RE.test(line)) {
      const windowCtx = [
        cleanLines[i - 3] || "",
        cleanLines[i - 2] || "",
        cleanLines[i - 1] || "",
        line,
        enclosingContext,
      ].join(" ");
      if (CARD_CALLOUT_CONTEXT_RE.test(windowCtx) || /border-(?:left|right)/i.test(line)) {
        pushFinding(lineNum, "SIDE_STRIPE_BORDER", "FAIL", snippet(rawLine));
      }
    }

    if (EMOJI_OR_DINGBAT_RE.test(line)) {
      pushFinding(
        lineNum,
        "EMOJI_OR_DINGBAT",
        strictHouse ? "FAIL" : "WARN",
        snippet(rawLine)
      );
    }

    if (OFF_BRAND_CREAM_RE.test(line)) {
      pushFinding(
        lineNum,
        "OFF_BRAND_CREAM_HEX",
        strictHouse ? "FAIL" : "WARN",
        snippet(rawLine)
      );
    }

    if (SLOP_BUZZWORDS_RE.test(line)) {
      pushFinding(lineNum, "SLOP_BUZZWORDS", "FAIL", snippet(rawLine));
    }

    if (Z_INDEX_MAGIC_RE.test(line)) {
      pushFinding(lineNum, "Z_INDEX_MAGIC", "WARN", snippet(rawLine));
    }

    if (OUTLINE_NONE_RE.test(line) && !hasFocusVisible) {
      pushFinding(lineNum, "OUTLINE_NONE_UNSAFE", "WARN", snippet(rawLine));
    }

    if (/\}/.test(line)) {
      enclosingContext = "";
    }
  }

  return findings;
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes("-h") || args.includes("--help")) {
    printHelp();
    process.exit(0);
  }

  const jsonMode = args.includes("--json");
  const strictHouse = args.includes("--strict-house");
  const targets = args.filter((a) => !a.startsWith("-"));

  if (targets.length === 0) {
    console.error(
      "Usage: node ui-gate.mjs [--json] [--strict-house] <file-or-dir> [...]"
    );
    process.exit(2);
  }

  const files = collectFiles(targets);
  const allFindings = [];
  for (const file of files) {
    allFindings.push(...scanFile(file, { strictHouse }));
  }

  const activeFails = allFindings.filter(
    (f) => !f.suppressed && f.severity === "FAIL"
  );
  const activeWarns = allFindings.filter(
    (f) => !f.suppressed && f.severity === "WARN"
  );
  const suppressedCount = allFindings.filter((f) => f.suppressed).length;

  if (jsonMode) {
    console.log(
      JSON.stringify(
        {
          filesScanned: files.length,
          strictHouse,
          summary: {
            fails: activeFails.length,
            warns: activeWarns.length,
            suppressed: suppressedCount,
          },
          findings: allFindings.map((f) => ({
            ...f,
            file: relative(process.cwd(), f.file) || f.file,
          })),
        },
        null,
        2
      )
    );
  } else {
    for (const f of allFindings) {
      const rel = relative(process.cwd(), f.file) || f.file;
      const status = f.suppressed ? `SKIP(${f.severity})` : f.severity;
      console.log(`${status}  ${f.rule}  ${rel}:${f.line}  ${f.detail}`);
    }
    console.log(
      `\nScanned ${files.length} file(s): ${activeFails.length} FAIL, ${activeWarns.length} WARN, ${suppressedCount} suppressed.`
    );
  }

  process.exit(activeFails.length > 0 ? 1 : 0);
}

main();
