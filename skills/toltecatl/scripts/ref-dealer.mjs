#!/usr/bin/env node
/**
 * ref-dealer.mjs — Zero-bloat reference dealer for Toltecatl.
 *
 * Deals compact brand design tokens (from 54 real systems in data/brands.json)
 * and researched art directions (from 20 compositions in data/directions.json)
 * while keeping stdout strictly under context budgets (< 1.5 KB per item, < 3 KB per list).
 */
import { randomInt } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(HERE, "..", "data");

function loadJson(filename) {
  return JSON.parse(readFileSync(join(DATA_DIR, filename), "utf8"));
}

function printHelp() {
  console.log(`Usage:
  node ref-dealer.mjs --list-brands                 List all 54 real brand systems
  node ref-dealer.mjs --brand <slug>                Print compact token sheet for a brand (< 1.5 KB)
  node ref-dealer.mjs --list-directions             List all 20 researched art directions
  node ref-dealer.mjs --direction <id>              Print compact composition brief for a direction (< 1.5 KB)
  node ref-dealer.mjs --deal <n> [--sector <sec>]   Deal <n> distinct directions (default 3)
  node ref-dealer.mjs --sector <sec>                Deal 2 directions matching <sec>
  -h, --help                                        Show this help message`);
}

function formatBrandCard(b) {
  const lines = [
    `# ${b.title} (${b.slug}) — ${b.category}`,
    `Style: ${b.style}`,
    `Fonts: Primary="${b.fonts.primary}" | Mono="${b.fonts.mono}"`,
  ];
  if (b.fonts.cssStack) lines.push(`CSS Font: ${b.fonts.cssStack}`);
  if (b.fonts.googleFontsUrl) lines.push(`Google Fonts: ${b.fonts.googleFontsUrl}`);
  lines.push("Palette:");
  for (const c of (b.colors || []).slice(0, 8)) {
    lines.push(`  - ${c.role}: ${c.value}${c.note ? ` (${c.note})` : ""}`);
  }
  if (b.characteristics && b.characteristics.length > 0) {
    lines.push("Key Rules:");
    for (const ch of b.characteristics.slice(0, 4)) {
      lines.push(`  - ${ch}`);
    }
  }
  return lines.join("\n");
}

function firstSentence(text, maxLen = 200) {
  if (!text) return "";
  const clean = text.replace(/\u2014/g, "--").replace(/\s+/g, " ").trim();
  const m = clean.match(/^[^.!?]+[.!?]/);
  const s = m ? m[0] : clean;
  return s.length > maxLen ? s.slice(0, maxLen - 1) + "." : s;
}

function formatDirectionCard(d) {
  return [
    `# ${d.name} (${d.id})`,
    `Sectors: ${(d.sectors || []).slice(0, 8).join(", ")} | Tones: ${(d.tones || []).join(", ")}`,
    `Idea: ${firstSentence(d.idea, 240)}`,
    `Composition: ${firstSentence(d.composition, 260)}`,
    `Typography: ${firstSentence(d.typography, 180)} [${(d.typeClasses || []).join(", ")}]`,
    `Colour: ${firstSentence(d.colour, 180)} [${(d.paletteTags || []).join(", ")}]`,
    `Motion: ${d.motion || "subtle"} | Pitfall: ${firstSentence(d.pitfalls, 180)}`,
  ].join("\n");
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes("-h") || args.includes("--help")) {
    printHelp();
    process.exit(0);
  }

  const getArg = (flag) => {
    const idx = args.indexOf(flag);
    return idx !== -1 && args[idx + 1] && !args[idx + 1].startsWith("--")
      ? args[idx + 1]
      : null;
  };

  if (args.includes("--list-brands")) {
    const brands = loadJson("brands.json");
    for (const b of brands) {
      const styleShort = (b.style || "").slice(0, 22);
      console.log(`${b.slug.padEnd(12)} ${b.title.slice(0, 12).padEnd(13)} ${styleShort}`);
    }
    process.exit(0);
  }

  const brandSlug = getArg("--brand");
  if (brandSlug) {
    const brands = loadJson("brands.json");
    const norm = brandSlug.toLowerCase().replace(/\.md$/, "");
    const match = brands.find(
      (b) =>
        b.slug.toLowerCase() === norm ||
        b.title.toLowerCase() === norm ||
        b.slug.toLowerCase().startsWith(norm)
    );
    if (!match) {
      console.error(`Unknown brand "${brandSlug}". Run --list-brands to view all 54.`);
      process.exit(1);
    }
    console.log(formatBrandCard(match));
    process.exit(0);
  }

  if (args.includes("--list-directions")) {
    const directions = loadJson("directions.json");
    for (const d of directions) {
      const tones = (d.tones || []).join(",");
      console.log(`${d.id.padEnd(24)} ${d.name.slice(0, 32).padEnd(33)} [${tones}]`);
    }
    process.exit(0);
  }

  const directionId = getArg("--direction");
  if (directionId) {
    const directions = loadJson("directions.json");
    const match = directions.find(
      (d) => d.id.toLowerCase() === directionId.toLowerCase()
    );
    if (!match) {
      console.error(
        `Unknown direction "${directionId}". Run --list-directions to view all 20.`
      );
      process.exit(1);
    }
    console.log(formatDirectionCard(match));
    process.exit(0);
  }

  const dealArg = getArg("--deal");
  const sectorArg = getArg("--sector");
  if (args.includes("--deal") || sectorArg) {
    const count = Math.max(1, Math.min(5, Number(dealArg || 2)));
    const directions = loadJson("directions.json");
    let pool = directions;
    if (sectorArg) {
      const sec = sectorArg.toLowerCase();
      const filtered = directions.filter((d) =>
        (d.sectors || []).some((s) => s.toLowerCase() === sec)
      );
      if (filtered.length > 0) pool = filtered;
    }
    const copy = [...pool];
    const picked = [];
    while (picked.length < count && copy.length > 0) {
      const idx = randomInt(0, copy.length);
      picked.push(copy.splice(idx, 1)[0]);
    }
    console.log(picked.map((d) => formatDirectionCard(d)).join("\n\n"));
    process.exit(0);
  }

  console.error("Unrecognized arguments. Run with --help for usage.");
  process.exit(2);
}

main();
