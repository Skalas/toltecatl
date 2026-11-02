#!/usr/bin/env node
/**
 * ref-dealer.mjs — Zero-bloat reference dealer for Toltecatl.
 *
 * Deals brand token sheets (data/brands.json), art directions (data/directions.json),
 * palettes (data/palettes.json), and type pairings (data/type.json), keeping every
 * stdout payload under the 3000-byte context budget.
 */
import { randomInt } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(HERE, "..", "data");
const DEFAULT_DEAL_COUNT = 3;
const MAX_DEAL_COUNT = 3;
const SECTOR_ONLY_DEAL_COUNT = 2;
const COMPACT_LIMITS = { idea: 200, composition: 260, typography: 90, colour: 80, pitfalls: 100, seenIn: 2 };
const SYSTEM_LIMITS = { note: 200 };
const EXIT = { OK: 0, NOT_FOUND: 1, USAGE: 2 };

const loadJson = (filename) => JSON.parse(readFileSync(join(DATA_DIR, filename), "utf8"));

function printHelp() {
  console.log(`Usage:
  node ref-dealer.mjs --list-brands                  List all real brand systems
  node ref-dealer.mjs --brand <slug>                 Compact token sheet for a brand
  node ref-dealer.mjs --list-directions              List all researched art directions
  node ref-dealer.mjs --direction <id>               Complete, untruncated direction brief
  node ref-dealer.mjs --deal [n] [--sector <sec>]    Deal n distinct directions (1-3, default 3)
  node ref-dealer.mjs --sector <sec>                 Deal 2 directions matching <sec>
  node ref-dealer.mjs --list-palettes [--tag <tag>]  List palettes (id, name, bg/ink/accent, tags)
  node ref-dealer.mjs --palette <id>                 Full palette token card
  node ref-dealer.mjs --list-types [--class <cls>]   List type pairings (id, class, display/text)
  node ref-dealer.mjs --type <id>                    Full typographic card (settings, css, scale)
  node ref-dealer.mjs --deal-system [--sector <sec>] [--tone <tone>]
                                                     Deal 1 direction + matching palette + type
  -h, --help                                         Show this help message`);
}

const clean = (text) => (text || "").replace(/\u2014/g, "--").replace(/\u2013/g, "-").replace(/\s+/g, " ").trim();

function clip(text, maxLen) {
  const s = clean(text);
  if (s.length <= maxLen) return s;
  const cut = s.slice(0, maxLen - 1);
  const lastStop = cut.lastIndexOf(". ");
  return lastStop > maxLen * 0.6 ? cut.slice(0, lastStop + 1) : cut.replace(/\s+\S*$/, "") + "…";
}

const list = (arr, n = arr?.length) => (arr || []).slice(0, n).join(", ");

function formatBrandCard(b) {
  const lines = [
    `# ${b.title} (${b.slug}) -- ${b.category}`,
    `Style: ${b.style}`,
    `Fonts: Primary="${b.fonts.primary}" | Mono="${b.fonts.mono}"`,
  ];
  if (b.fonts.cssStack) lines.push(`CSS Font: ${b.fonts.cssStack}`);
  if (b.fonts.googleFontsUrl) lines.push(`Google Fonts: ${b.fonts.googleFontsUrl}`);
  lines.push("Palette:");
  for (const c of (b.colors || []).slice(0, 8)) {
    lines.push(`  - ${c.role}: ${c.value}${c.note ? ` (${c.note})` : ""}`);
  }
  if (b.characteristics?.length) {
    lines.push("Key Rules:", ...b.characteristics.slice(0, 4).map((ch) => `  - ${ch}`));
  }
  return lines.join("\n");
}

function formatDirectionCard(d) {
  const L = COMPACT_LIMITS;
  return [
    `# ${d.name} (${d.id}) [${list(d.tones)}]`,
    `Idea: ${clip(d.idea, L.idea)}`,
    `Composition: ${clip(d.composition, L.composition)}`,
    `Typography: ${clip(d.typography, L.typography)}`,
    `Colour: ${clip(d.colour, L.colour)}`,
    `Pitfall: ${clip(d.pitfalls, L.pitfalls)}`,
    `Sections: ${list(d.sectionTags)} | Seen in: ${list(d.seenIn, L.seenIn)}`,
  ].join("\n");
}

function formatDirectionFull(d) {
  return [
    `# ${d.name} (${d.id})`,
    `Idea: ${clean(d.idea)}`,
    `Composition: ${clean(d.composition)}`,
    `Typography: ${clean(d.typography)}`,
    `Colour: ${clean(d.colour)}`,
    `Imagery: ${clean(d.imagery)}`,
    `Richness: ${clean(d.richness)}`,
    `Pitfalls: ${clean(d.pitfalls)}`,
    `Sections: ${list(d.sectionTags)} | Seen in: ${list(d.seenIn)}`,
  ].join("\n");
}

function formatPaletteCard(p, { noteLimit = Infinity } = {}) {
  const fields = (p.fields || []).map((f) => `${f.bg}/${f.ink}`).join(", ") || "none";
  return [
    `# ${p.name} (${p.id}) [${list(p.tags)}]`,
    `bg ${p.bg} | surface ${p.surface} | ink ${p.ink} | muted ${p.muted}`,
    `accent ${p.accent} | accentInk ${p.accentInk} | fields ${fields}`,
    `Note: ${clip(p.note, noteLimit)}`,
    ...(noteLimit === Infinity ? [`Seen in: ${list(p.seenIn)}`] : []),
  ].join("\n");
}

function formatTypeVoice(label, v) {
  return `${label}: ${v.family} (${v.source}) w${(v.weights || []).join("/")}${v.italic ? " +italic" : ""} -- ${clean(v.settings)}`;
}

function formatTypeCard(t, { compact = false } = {}) {
  const lines = [
    `# ${t.name} (${t.id}) [${t.class}]`,
    formatTypeVoice("Display", t.display),
    formatTypeVoice("Text", t.text),
    `Scale: ${Object.entries(t.scale || {}).map(([k, v]) => `${k}=${v}`).join(" ; ")}`,
  ];
  if (compact) return [...lines, `Note: ${clip(t.note, SYSTEM_LIMITS.note)}`].join("\n");
  const cssLinks = [...new Set([t.display.css, t.text.css].filter(Boolean))];
  return [
    ...lines,
    `Note: ${clean(t.note)}`,
    `Stands in for: ${list(t.standsInFor) || "n/a"}`,
    "CSS:",
    ...cssLinks,
  ].join("\n");
}

function findById(items, id, kind, listFlag) {
  const match = items.find((x) => x.id.toLowerCase() === id.toLowerCase());
  if (!match) {
    console.error(`Unknown ${kind} "${id}". Run ${listFlag} to view all ${items.length}.`);
    process.exit(EXIT.NOT_FOUND);
  }
  return match;
}

function pickRandom(pool, count) {
  const copy = [...pool];
  const picked = [];
  while (picked.length < count && copy.length > 0) {
    picked.push(copy.splice(randomInt(0, copy.length), 1)[0]);
  }
  return picked;
}

function filterOrAll(items, predicate) {
  const filtered = items.filter(predicate);
  return filtered.length > 0 ? filtered : items;
}

const SECTOR_ALIASES = { fintech: "finance", devtools: "dev-tool", "dev-tools": "dev-tool", ai: "ai-product", portfolio: "personal-portfolio" };
const canonicalSector = (sector) => SECTOR_ALIASES[sector.toLowerCase()] || sector.toLowerCase();
const bySector = (sector) => (d) => !sector || (d.sectors || []).some((s) => s.toLowerCase() === canonicalSector(sector));
const byTone = (tone) => (d) => !tone || (d.tones || []).some((t) => t.toLowerCase() === tone.toLowerCase());

function dealDirections(count, sector) {
  const pool = filterOrAll(loadJson("directions.json"), bySector(sector));
  return pickRandom(pool, count).map(formatDirectionCard).join("\n\n");
}

function dealSystem(sector, tone) {
  const directions = loadJson("directions.json").filter(bySector(sector));
  const [direction] = pickRandom(filterOrAll(directions.length ? directions : loadJson("directions.json"), byTone(tone)), 1);
  const paletteTags = new Set(direction.paletteTags || []);
  const typeClasses = new Set(direction.typeClasses || []);
  const [palette] = pickRandom(filterOrAll(loadJson("palettes.json"), (p) => (p.tags || []).some((t) => paletteTags.has(t))), 1);
  const [type] = pickRandom(filterOrAll(loadJson("type.json"), (t) => typeClasses.has(t.class)), 1);
  return [
    "## Direction",
    formatDirectionCard(direction),
    "",
    "## Palette",
    formatPaletteCard(palette, { noteLimit: SYSTEM_LIMITS.note }),
    "",
    "## Type",
    formatTypeCard(type, { compact: true }),
  ].join("\n");
}

function listPalettes(tag) {
  const palettes = loadJson("palettes.json");
  if (tag) {
    return palettes
      .filter((p) => (p.tags || []).includes(tag))
      .map((p) => `${p.id} "${p.name}" bg ${p.bg} ink ${p.ink} accent ${p.accent} [${list(p.tags)}]`)
      .join("\n");
  }
  const groups = new Map();
  for (const p of palettes) {
    const primaryTag = p.tags?.[0] || "untagged";
    groups.set(primaryTag, [...(groups.get(primaryTag) || []), p]);
  }
  const header = "# id bg/ink/accent, grouped by primary tag (--tag <tag> for names and all tags)";
  const body = [...groups].map(([t, ps]) => [`## ${t}`, ...ps.map((p) => `${p.id} ${p.bg}/${p.ink}/${p.accent}`)].join("\n"));
  return [header, ...body].join("\n");
}

function listTypes(cls) {
  const types = loadJson("type.json").filter((t) => !cls || t.class === cls);
  return types.map((t) => `${t.id} [${t.class}] ${t.display.family} / ${t.text.family}`).join("\n");
}

function listDirections() {
  return loadJson("directions.json")
    .map((d) => `${d.id.padEnd(24)} ${d.name.slice(0, 32).padEnd(33)} [${(d.tones || []).join(",")}]`)
    .join("\n");
}

function listBrands() {
  return loadJson("brands.json")
    .map((b) => `${b.slug.padEnd(12)} ${b.title.slice(0, 12).padEnd(13)} ${(b.style || "").slice(0, 22)}`)
    .join("\n");
}

function findBrand(slug) {
  const brands = loadJson("brands.json");
  const norm = slug.toLowerCase().replace(/\.md$/, "");
  const match = brands.find(
    (b) => b.slug.toLowerCase() === norm || b.title.toLowerCase() === norm || b.slug.toLowerCase().startsWith(norm)
  );
  if (!match) {
    console.error(`Unknown brand "${slug}". Run --list-brands to view all ${brands.length}.`);
    process.exit(EXIT.NOT_FOUND);
  }
  return match;
}

function parseDealCount(raw) {
  if (raw === null) return DEFAULT_DEAL_COUNT;
  const count = Number(raw);
  if (!Number.isInteger(count) || count < 1) {
    console.error(`Invalid --deal count "${raw}": expected an integer 1-${MAX_DEAL_COUNT}.`);
    process.exit(EXIT.USAGE);
  }
  return Math.min(MAX_DEAL_COUNT, count);
}

function route(args) {
  const has = (flag) => args.includes(flag);
  const getArg = (flag) => {
    const idx = args.indexOf(flag);
    return idx !== -1 && args[idx + 1] && !args[idx + 1].startsWith("--") ? args[idx + 1] : null;
  };
  const sector = getArg("--sector");

  if (has("--list-brands")) return listBrands();
  if (getArg("--brand")) return formatBrandCard(findBrand(getArg("--brand")));
  if (has("--list-directions")) return listDirections();
  if (getArg("--direction")) return formatDirectionFull(findById(loadJson("directions.json"), getArg("--direction"), "direction", "--list-directions"));
  if (has("--list-palettes")) return listPalettes(getArg("--tag"));
  if (getArg("--palette")) return formatPaletteCard(findById(loadJson("palettes.json"), getArg("--palette"), "palette", "--list-palettes"));
  if (has("--list-types")) return listTypes(getArg("--class"));
  if (getArg("--type")) return formatTypeCard(findById(loadJson("type.json"), getArg("--type"), "type pairing", "--list-types"));
  if (has("--deal-system")) return dealSystem(sector, getArg("--tone"));
  if (has("--deal")) return dealDirections(parseDealCount(getArg("--deal")), sector);
  if (sector) return dealDirections(SECTOR_ONLY_DEAL_COUNT, sector);
  return null;
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes("-h") || args.includes("--help")) {
    printHelp();
    process.exit(EXIT.OK);
  }
  const output = route(args);
  if (output === null) {
    console.error("Unrecognized arguments. Run with --help for usage.");
    process.exit(EXIT.USAGE);
  }
  console.log(output);
}

main();
