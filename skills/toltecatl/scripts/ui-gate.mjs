#!/usr/bin/env node
/**
 * ui-gate.mjs -- Zero-dependency deterministic UI & House-Rule static gate (Node 20+ ESM).
 *
 * Usage:
 *   node ui-gate.mjs [--json] [--strict-house] [--static] <file-or-dir> [...]
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { basename, extname, join, relative, resolve } from "node:path";

const KIND = { STYLE: "style", MARKUP: "markup", SCRIPT: "script", DATA: "data" };
const EXTENSION_KINDS = new Map([
  [".css", KIND.STYLE], [".scss", KIND.STYLE],
  [".html", KIND.MARKUP], [".htm", KIND.MARKUP], [".vue", KIND.MARKUP], [".jsx", KIND.MARKUP],
  [".tsx", KIND.MARKUP], [".svelte", KIND.MARKUP], [".astro", KIND.MARKUP],
  [".js", KIND.SCRIPT], [".ts", KIND.SCRIPT], [".mjs", KIND.SCRIPT],
  [".json", KIND.DATA],
]);
const SKIP_FILES = new Set(["package.json", "package-lock.json", "tsconfig.json", "computed-tree.json", "ui-gate.json"]);
const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", ".next"]);

const ALL_KINDS = Object.values(KIND);
const CSS_KINDS = [KIND.STYLE, KIND.MARKUP];
const CODE_KINDS = [KIND.MARKUP, KIND.SCRIPT];
const TEMPLATE_KINDS = [KIND.MARKUP];

const FILE_WIDE_SUPPRESSION_MAX_LINE = 15;
const EYEBROW_SPAM_THRESHOLD = 4;
const CARD_TEXT_MAX_CHARS = 240;
const NUMBERED_SCAFFOLD_MIN_STEPS = 3;
const SNIPPET_MAX_CHARS = 96;
const EXIT = { OK: 0, FAIL: 1, USAGE: 2 };

const EM_DASH = "—";
const EM_DASH_ENTITY_RE = /&mdash;|&#8212;|&#x2014;|\\u\{?2014\}?/i;
const TRANSITION_ALL_RE = /transition\s*:\s*["']?all\b|transition-property\s*:\s*all\b|\btransition-all\b/i;
const EASE_IN_UI_RE = /\bease-in\b(?![-\w])/i;
const SCALE_ZERO_ENTRY_RE = /scale\(\s*0(?:\.0+)?\s*\)|\bscale-0\b/;
const SCROLL_LISTENER_RE = /addEventListener\s*\(\s*["']scroll["']|\bonscroll\s*=/;
const GRADIENT_TEXT_CLIP_RE = /(?:-webkit-)?background-clip\s*:\s*text\b|\bbg-clip-text\b/i;
const GRADIENT_FN_RE = /(?:linear|radial|conic)-gradient\s*\(|\bbg-gradient-to-/i;
const SIDE_STRIPE_DECL_RE = /border-(?:left|right)\s*:\s*(?:[2-9]|\d{2,})px\s+solid\b|\bborder-[lr]-(?:[2-9]|\[\d+px\])/i;
const CARD_CALLOUT_CONTEXT_RE = /card|callout|alert|notice|banner|panel|toast|aside/i;
const EMOJI_OR_DINGBAT_RE =
  /[\u{1F512}\u{1F680}\u{1F525}\u{1F4A1}\u{2728}\u{2605}\u{2726}\u{25CF}\u{2713}\u{2714}\u{23F1}\u{26A1}\u{1F300}-\u{1FAFF}]/u;
const OFF_BRAND_CREAM_RE = /#(?:f4f1ea|f7f4ee|faf8f5|f2ede4|efece6|fdf8f3)\b/i;
const SLOP_BUZZWORDS_RE =
  /\b(?:revolutionize[sd]?|revolutionizing|unleash(?:es|ed|ing)?|supercharge[sd]?|supercharging|game-changer|seamlessly|elevate\s+your)\b/i;
const Z_INDEX_MAGIC_RE = /\bz-index\s*:\s*(9{3,})\b|\bzIndex\s*:\s*["']?(9{3,})\b|\bz-\[(9{3,})\]/;
const OUTLINE_NONE_RE = /\boutline\s*:\s*["']?(?:none|0(?:px)?)\b|\boutline-(?:none|hidden)\b/;
const NUMBERED_SCAFFOLD_RE = /(?<![\d.:/])0([1-9])\s*([·/])\s+(?=\S)/g;
const CLASS_ATTR_RE = /\bclass(?:Name)?\s*=\s*["'`]([^"'`]*)["'`]/g;
const EYEBROW_CLASS_TOKEN_RE = /(?:^|[\s-])(?:eyebrow|kicker|overline)(?:$|[\s-])/i;
const SUPPRESSION_RES = [
  /\/\*\s*(?:toltecatl|auteur)-allow:\s*([A-Z0-9_]+)\s*--\s*([\s\S]*?)\*\//g,
  /\/\/\s*(?:toltecatl|auteur)-allow:\s*([A-Z0-9_]+)\s*--\s*(.+)/g,
  /<!--\s*(?:toltecatl|auteur)-allow:\s*([A-Z0-9_]+)\s*--\s*([\s\S]*?)-->/g,
];

const fail = () => "FAIL";
const warn = () => "WARN";
const houseSeverity = (strictHouse) => (strictHouse ? "FAIL" : "WARN");

const LINE_RULES = [
  { id: "EM_DASH", kinds: ALL_KINDS, severity: fail, test: ({ line }) => line.includes(EM_DASH) || EM_DASH_ENTITY_RE.test(line) },
  { id: "TRANSITION_ALL", kinds: CSS_KINDS, severity: fail, test: ({ line }) => TRANSITION_ALL_RE.test(line) },
  { id: "EASE_IN_UI", kinds: CSS_KINDS, severity: fail, test: ({ line }) => EASE_IN_UI_RE.test(line) },
  { id: "SCALE_ZERO_ENTRY", kinds: CSS_KINDS, severity: fail, test: ({ line }) => SCALE_ZERO_ENTRY_RE.test(line) },
  { id: "SCROLL_LISTENER", kinds: CODE_KINDS, severity: fail, test: ({ line }) => SCROLL_LISTENER_RE.test(line) },
  { id: "GRADIENT_TEXT", kinds: CSS_KINDS, severity: fail, test: ({ line, file }) => file.hasGradient && GRADIENT_TEXT_CLIP_RE.test(line) },
  { id: "SIDE_STRIPE_BORDER", kinds: CSS_KINDS, severity: fail, test: ({ line, cardContext }) => SIDE_STRIPE_DECL_RE.test(line) && CARD_CALLOUT_CONTEXT_RE.test(cardContext) },
  { id: "EMOJI_OR_DINGBAT", kinds: ALL_KINDS, severity: houseSeverity, test: ({ line }) => EMOJI_OR_DINGBAT_RE.test(line) },
  { id: "OFF_BRAND_CREAM_HEX", kinds: CSS_KINDS, severity: houseSeverity, test: ({ line }) => OFF_BRAND_CREAM_RE.test(line) },
  { id: "SLOP_BUZZWORDS", kinds: ALL_KINDS, severity: fail, test: ({ line }) => SLOP_BUZZWORDS_RE.test(line) },
  { id: "Z_INDEX_MAGIC", kinds: CSS_KINDS, severity: warn, test: ({ line }) => Z_INDEX_MAGIC_RE.test(line) },
  { id: "OUTLINE_NONE_UNSAFE", kinds: CSS_KINDS, severity: warn, test: (ctx) => OUTLINE_NONE_RE.test(ctx.line) && !hasFocusVisiblePartner(ctx) },
];

function printHelp() {
  console.log(`Usage: node ui-gate.mjs [--json] [--strict-house] [--static] <file-or-dir> [...]

Deterministic UI/UX and Toltecatl House static gate.
Scans: .css .scss (style) | .html .htm .vue .jsx .tsx .svelte .astro (markup)
       .js .ts .mjs (script: copy, emoji, scroll rules) | .json (copy, emoji rules)

Options:
  --json          Emit machine-readable JSON findings report
  --strict-house  Promote house rules (EMOJI_OR_DINGBAT, OFF_BRAND_CREAM_HEX,
                  EYEBROW_SPAM, CARD_TEXT_BLOAT) from WARN to FAIL
  --static        Run static source analysis (default mode)
  -h, --help      Show this help message and exit 0

Exit codes: 0 clean, 1 active FAIL findings, 2 usage error, missing path, or no scannable files.

Inline suppression (reason required):
  /* toltecatl-allow: <RULE_ID> -- <reason> */
  <!-- toltecatl-allow: <RULE_ID> -- <reason> -->
  Applies to its own line and the next line; placed in the first ${FILE_WIDE_SUPPRESSION_MAX_LINE} lines it is file-wide.`);
}

function lineOfIndex(content, index) {
  let line = 1;
  for (let i = 0; i < index; i++) if (content.charCodeAt(i) === 10) line++;
  return line;
}

export function parseSuppressions(content) {
  const fileWide = new Map();
  const byLine = new Map();
  for (const re of SUPPRESSION_RES) {
    for (const m of content.matchAll(re)) {
      const [ruleId, reason] = [m[1].trim(), m[2].trim()];
      if (!reason) continue;
      const startLine = lineOfIndex(content, m.index);
      const endLine = startLine + (m[0].match(/\n/g) || []).length;
      if (startLine <= FILE_WIDE_SUPPRESSION_MAX_LINE) fileWide.set(ruleId, reason);
      for (let l = startLine; l <= endLine + 1; l++) byLine.set(`${ruleId}@${l}`, reason);
    }
  }
  return { reasonFor: (rule, line) => byLine.get(`${rule}@${line}`) || fileWide.get(rule) || null };
}

function stripCommentsPreserveLines(content) {
  const blank = (match) => match.replace(/[^\n]/g, " ");
  return content
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/<!--[\s\S]*?-->/g, blank)
    .replace(/(^|[^:\\])\/\/[^\n]*/gm, "$1");
}

const isScannable = (path) => EXTENSION_KINDS.has(extname(path).toLowerCase()) && !SKIP_FILES.has(basename(path));

function walkDirectory(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory() && !SKIP_DIRS.has(entry.name)) files.push(...walkDirectory(full));
    else if (entry.isFile() && isScannable(full)) files.push(full);
  }
  return files;
}

export function collectFiles(targets) {
  const files = [];
  const missing = [];
  for (const target of targets) {
    const abs = resolve(target);
    let stat;
    try {
      stat = statSync(abs);
    } catch {
      missing.push(target);
      continue;
    }
    if (stat.isDirectory()) files.push(...walkDirectory(abs));
    else if (stat.isFile() && isScannable(abs)) files.push(abs);
  }
  return { files, missing };
}

const snippet = (line) => line.trim().slice(0, SNIPPET_MAX_CHARS);
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function selectorBases(selector) {
  return selector
    .split(",")
    .map((part) => part.trim().replace(/::?[a-z-]+(?:\([^)]*\))?/gi, "").trim())
    .filter(Boolean);
}

function hasFocusVisiblePartner({ line, selector, file }) {
  if (/focus-visible/.test(line) || /focus-visible/.test(selector)) return true;
  const bases = selectorBases(selector);
  return bases.some((base) => new RegExp(`${escapeRegex(base)}:focus-visible`).test(file.stripped));
}

function selectorBefore(line, previousLine) {
  const head = line.slice(0, line.indexOf("{")).trim();
  return head || previousLine.trim();
}

function scanLines(lines, file, report) {
  const rules = LINE_RULES.filter((r) => r.kinds.includes(file.kind));
  let selector = "";
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes("{")) selector = selectorBefore(line, lines[i - 1] || "");
    const cardContext = [selector, lines[i - 2] || "", lines[i - 1] || "", line].join(" ");
    const ctx = { line, selector, cardContext, file };
    for (const rule of rules) {
      if (rule.test(ctx)) report(i + 1, rule.id, rule.severity(file.strictHouse));
    }
    if (line.includes("}")) selector = "";
  }
}

function collectEyebrowClasses(stripped) {
  const names = new Set();
  for (const m of stripped.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    const body = m[2];
    if (!/text-transform\s*:\s*uppercase/i.test(body) || !/letter-spacing\s*:/i.test(body)) continue;
    for (const cls of m[1].matchAll(/\.([\w-]+)/g)) names.add(cls[1]);
  }
  return names;
}

function isEyebrowClassList(classList, eyebrowClasses) {
  if (EYEBROW_CLASS_TOKEN_RE.test(classList)) return true;
  const tokens = classList.split(/\s+/);
  if (tokens.includes("uppercase") && tokens.some((t) => t.startsWith("tracking-"))) return true;
  return tokens.some((t) => eyebrowClasses.has(t));
}

function scanEyebrowSpam(lines, file, report) {
  const eyebrowClasses = collectEyebrowClasses(file.stripped);
  const hits = [];
  lines.forEach((line, i) => {
    for (const m of line.matchAll(CLASS_ATTR_RE)) {
      if (isEyebrowClassList(m[1], eyebrowClasses)) hits.push(i + 1);
    }
  });
  if (hits.length >= EYEBROW_SPAM_THRESHOLD) {
    report(hits[0], "EYEBROW_SPAM", houseSeverity(file.strictHouse), `${hits.length} eyebrow/kicker labels in one template (max ${EYEBROW_SPAM_THRESHOLD - 1})`);
  }
}

const VOID_TAGS = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);
const isCardOpening = (tag, attrs) => tag === "article" || tag === "li" || /\bclass(?:Name)?\s*=\s*["'`][^"'`]*card/i.test(attrs);

const blankEmbeddedCode = (markup) =>
  markup.replace(/(<(script|style)\b[^>]*>)([\s\S]*?)(<\/\2>)/gi, (_, open, _tag, body, close) => open + body.replace(/[^\n]/g, " ") + close);

function scanCardTextBloat(file, report) {
  const stack = [];
  const tagRe = /<(\/?)([a-zA-Z][\w-]*)([^>]*)>/g;
  for (const m of blankEmbeddedCode(file.stripped).matchAll(tagRe)) {
    const [, closing, rawTag, attrs] = m;
    const tag = rawTag.toLowerCase();
    if (closing) {
      const idx = stack.findLastIndex((s) => s.tag === tag);
      if (idx !== -1) stack.length = idx;
      continue;
    }
    if (VOID_TAGS.has(tag) || attrs.trim().endsWith("/")) continue;
    if (tag === "p" && stack.some((s) => s.card)) reportBloatedParagraph(file, m.index + m[0].length, report);
    stack.push({ tag, card: isCardOpening(tag, attrs) });
  }
}

function reportBloatedParagraph(file, start, report) {
  const end = file.stripped.indexOf("</p>", start);
  if (end === -1) return;
  const text = file.stripped.slice(start, end).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (text.length <= CARD_TEXT_MAX_CHARS) return;
  const words = text.split(" ").length;
  report(lineOfIndex(file.stripped, start), "CARD_TEXT_BLOAT", houseSeverity(file.strictHouse), `${text.length} chars / ${words} words in one card paragraph (max ${CARD_TEXT_MAX_CHARS} chars)`);
}

function scanNumberedScaffolding(lines, report) {
  const bySeparator = new Map();
  lines.forEach((line, i) => {
    for (const m of line.matchAll(NUMBERED_SCAFFOLD_RE)) {
      const entry = bySeparator.get(m[2]) || { steps: new Set(), lines: [] };
      entry.steps.add(Number(m[1]));
      entry.lines.push(i + 1);
      bySeparator.set(m[2], entry);
    }
  });
  for (const [separator, { steps, lines: hitLines }] of bySeparator) {
    const sequential = [1, 2, 3].every((n) => steps.has(n));
    if (!sequential || steps.size < NUMBERED_SCAFFOLD_MIN_STEPS) continue;
    report(hitLines[0], "NUMBERED_SCAFFOLDING", "WARN", `Decorative "01 ${separator} 02 ${separator} 03 ${separator}" section prefixes (${hitLines.length} hits)`);
  }
}

export function scanFile(filePath, { strictHouse = false } = {}) {
  const raw = readFileSync(filePath, "utf8");
  const stripped = stripCommentsPreserveLines(raw);
  const rawLines = raw.split("\n");
  const cleanLines = stripped.split("\n");
  const suppressions = parseSuppressions(raw);
  const file = {
    kind: EXTENSION_KINDS.get(extname(filePath).toLowerCase()),
    stripped,
    strictHouse,
    hasGradient: GRADIENT_FN_RE.test(stripped),
  };

  const findings = [];
  const report = (line, rule, severity, detail = snippet(rawLines[line - 1] || "")) => {
    const suppressionReason = suppressions.reasonFor(rule, line);
    findings.push({ file: filePath, line, rule, severity, detail, suppressed: Boolean(suppressionReason), suppressionReason });
  };

  scanLines(cleanLines, file, report);
  if (TEMPLATE_KINDS.includes(file.kind)) {
    scanEyebrowSpam(cleanLines, file, report);
    scanCardTextBloat(file, report);
    scanNumberedScaffolding(cleanLines, report);
  }
  return findings.sort((a, b) => a.line - b.line);
}

function summarize(files, findings, strictHouse) {
  const active = findings.filter((f) => !f.suppressed);
  return {
    filesScanned: files.length,
    strictHouse,
    summary: {
      fails: active.filter((f) => f.severity === "FAIL").length,
      warns: active.filter((f) => f.severity === "WARN").length,
      suppressed: findings.length - active.length,
    },
    findings: findings.map((f) => ({ ...f, file: relative(process.cwd(), f.file) || f.file })),
  };
}

function printText(result) {
  for (const f of result.findings) {
    const status = f.suppressed ? `SKIP(${f.severity})` : f.severity;
    console.log(`${status}  ${f.rule}  ${f.file}:${f.line}  ${f.detail}`);
  }
  const { fails, warns, suppressed } = result.summary;
  console.log(`\nScanned ${result.filesScanned} file(s): ${fails} FAIL, ${warns} WARN, ${suppressed} suppressed.`);
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes("-h") || args.includes("--help")) {
    printHelp();
    process.exit(EXIT.OK);
  }
  const jsonMode = args.includes("--json");
  const strictHouse = args.includes("--strict-house");
  const targets = args.filter((a) => !a.startsWith("-"));
  if (targets.length === 0) {
    console.error("Usage: node ui-gate.mjs [--json] [--strict-house] <file-or-dir> [...]");
    process.exit(EXIT.USAGE);
  }

  const { files, missing } = collectFiles(targets);
  for (const m of missing) console.error(`Error: path does not exist: ${m}`);
  if (missing.length > 0) process.exit(EXIT.USAGE);
  if (files.length === 0) {
    console.error(`Error: no scannable files found in: ${targets.join(", ")}`);
    process.exit(EXIT.USAGE);
  }

  const findings = files.flatMap((file) => scanFile(file, { strictHouse }));
  const result = summarize(files, findings, strictHouse);
  if (jsonMode) console.log(JSON.stringify(result, null, 2));
  else printText(result);
  process.exit(result.summary.fails > 0 ? EXIT.FAIL : EXIT.OK);
}

main();
