# House Pack: Editorial & Personal Sites (Essays, Portfolios, Publications)

Load this pack for personal sites, essays, blogs, CVs, portfolios, studio pages, and editorial publications (e.g. `Skalas.github.io`). Its job is to stop personal and editorial work from being dressed as a B2B SaaS dashboard or an industrial POS ledger.

---

## 1. Domain First: A Person Is Not a Product Console

- A personal site's subject is a voice and a body of work. It never needs status dots, `3 ACTIVE` counters, uptime badges, "Systems Ledger" headings, command-bar chrome, or mono uppercase kickers on every block.
- Surface Mode is `PERSUADE`; Archetype is **Decide/Learn** (home, about, essay) or **Explore** (project index, archive).
- Deal starting points from directions that fit: `ref-dealer.mjs --deal-system --sector personal-portfolio --tone editorial`.

## 2. Daylit or High-Contrast Paper Posture First

- **Default canvas:** crisp architectural paper (`#FAF9F6`, `#F6F5F2`) or pure optical white `#FFFFFF`, with deep ink `#111111`. Target `meanLightness` `0.94..0.98`.
- **High-contrast inverse blocks** (ink ground, paper type) are allowed as deliberate punctuation: one footer, one pull-quote plate, one chapter break.
- **Never default to near-black terminal gloom** (`L < 0.12` across the whole page) unless the person explicitly asks for a dark site; record the request in `COMMIT-SHEET.md` field 3.
- **Warm paper is deliberate here.** `OFF_BRAND_CREAM_HEX` is a guard for cool `OPERATE` surfaces; on an editorial canvas suppress it with a reason at the token declaration:
  ```css
  :root {
    /* toltecatl-allow: OFF_BRAND_CREAM_HEX -- deliberate editorial/hospitality paper canvas */
    --paper: #faf8f5;
  }
  ```
  Keep the ink achromatic or cool (`R <= B`) so paper + ink never collapse into the warm-brown signature banned in `anti-rgb-and-svg-geometry.md`.

## 3. Extreme Scale Contrast + Silence

- Pair an expressive display serif or a tight heavy grotesk at `clamp(2.5rem, 5vw, 4.5rem)` (or larger for a name-as-monument) against calm body prose at `1.0625rem..1.1875rem`, measure `60-68ch`, leading `1.5-1.6`. Target `h1/body >= 2.5x`.
- Pull type pairings from `ref-dealer.mjs --list-types --class serif-display` / `serif-text` / `grotesk-tight` and print the chosen card with `--type <id>`.
- **Silence is structural:** wide margins, whitespace `>= 35%` of the viewport on reading pages, and at most 2-3 type sizes per screen. Do not fill the margins with badges or meta chips.

## 4. Show the Artifact, Cut the Explanation

- **Project / system index:** a clean typographic index, one line per item:
  `Name` · `Role / Year` · one crisp sentence `<= 15 words`.
  Never multi-paragraph cards, status badges, tech-stack pill clouds, or numbered `01 ·` kickers.
- Let the work speak: a screenshot, a diagram, a specimen, a real number. If a card needs a paragraph to justify itself, link to a case page instead.
- One eyebrow kicker per page, maximum. Section names are plain words in the heading face, not tracked mono labels.

## 5. Break the Prose Tube on Long Pages

Long essays and about pages must not be one `65ch` column of identical paragraphs from top to bottom. Alternate the reading column with at least one of:
- **Outdented marginalia:** notes, dates, or citations hung in the left/right margin at small size.
- **2-column asymmetric splits (`4/8`):** facts, timeline, or a CV ledger on the narrow side; prose on the wide side.
- **Full-bleed plates:** one image, quote, or inverse block spanning the viewport.
- **Pull facts:** a single number or phrase at display size, used once.

## 6. Audit Checks (with `dom-probe.mjs` / `ui-gate.mjs`)

| Check | Target |
| --- | --- |
| `composition.meanLightness` | `>= 0.90` (unless dark is a recorded request) |
| `composition.typographicScale.h1ToBodyRatio` | `>= 2.0` |
| `composition.eyebrowSpam` / `EYEBROW_SPAM` | `false` / absent |
| `NUMBERED_SCAFFOLDING` | absent |
| `proseDensity.cardTextBloat` | `[]` |
| `proseDensity.longParagraphs` measure | `<= 78ch` |
| `composition.sectionOpeningClone.flagged` | `false` |
