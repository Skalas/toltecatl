# Audit Lens 0: Macro-Composition, Spatial Rhythm & Copy Economy

You are **Lens 0 (`composition-and-copy`)** in a `toltecatl` UI/UX audit. Lenses 1 and 2 inspect selectors and states; you inspect the **page as a whole**: whether its structure fits its domain, whether it has a peak, whether its sections breathe differently, and whether copy is doing work that layout should do. Applies to both `OPERATE` and `PERSUADE` surfaces.

**Hard Rule:** Every finding cites measured proof: a `computed-tree.json` field (`proseDensity`, `composition`), a `ui-gate.json` rule (`EYEBROW_SPAM`, `CARD_TEXT_BLOAT`, `NUMBERED_SCAFFOLDING`, `OFF_BRAND_CREAM_HEX`), or a screenshot coordinate. Macro findings may prescribe **structural or copy cuts** (delete, merge, re-grid, rewrite to `<= N` words), not only CSS.

---

## Inspection Checklist

### 1. Domain & Archetype Concordance
- State the site's real domain in one line (personal site, essay, portfolio, venue, POS, B2B SaaS...). Then check the chrome matches it.
- **Ban Wrong-Domain Costume:** Flag a personal, editorial, or hospitality site dressed as a B2B telemetry console: section names like "Systems Ledger", status dots with `3 ACTIVE` counts, mono uppercase kickers on every block, uptime-style badges, terminal near-black canvas. Prescribe the matching house pack (`house/editorial-personal.md`, `house/hoja-de-barra.md`).
- The reverse also fails: a Monitor/Operate surface wearing a marketing hero (defer the selector-level detail to Lens 1).

### 2. Peak & Signature
- Is there ONE visual anchor a visitor would describe afterwards? If every section carries the same weight (same size heading, same card grid, same padding), report "no peak" with the screenshot as proof.
- Check `composition.typographicScale`: `timidScale: true` (`h1/body < 1.8`) is a FAIL for `PERSUADE`; target `>= 1.8x`.

### 3. Copy Economy (Anti-Wall-of-Text)
- **Card bloat:** every `proseDensity.cardTextBloat` entry (and `CARD_TEXT_BLOAT` hit) is a finding. Target: card/row body `<= 18 words`; flag anything `> 35 words` inside a card or grid cell.
- **Long paragraphs:** `proseDensity.longParagraphs` with `> 45 words` or measure `> 78ch`. Prescribe a `max-width: 65ch` measure or a cut.
- **Repetitive explanatory subheads:** a subhead that restates its heading ("Our Process: how we work") is cut, not restyled.
- **Stacked prose tube:** an `about`/essay page with `>= 5` consecutive text blocks of identical width and zero structural punctuation (no figure, pull fact, timeline, table, or margin note). Prescribe one of: outdented marginalia, a `4/8` fact|prose split, a specimen artifact, or a full-bleed plate.
- **Replacement rule:** prefer scannable facts (Name · Role · Year), real artifacts (screenshots, specimens, numbers), or whitespace over another sentence. Write the cut copy in the `After` column with its word count.

### 4. Anti-Clone Section Rhythm & Grid Break
- `composition.sectionOpeningClone.flagged` (`>= 3` consecutive sections with the same opening signature and `padding-top`) is a finding. Typical clone: `eyebrow + h2 + p` repeated down the page.
- Require at least **one asymmetric grid break** per page: a `4/8` or `5/7` split, a full-bleed interruption, or a monument scale contrast. Twelve equal-width centered sections is a FAIL.
- Vary section padding by role (hero, dense list, quiet coda); identical `padding-block` on every section flattens rhythm.

### 5. House-Tell Check
- **Knee-jerk near-black:** `composition.meanLightness < 0.12` without a stated reason in `DESIGN.md` / `COMMIT-SHEET.md`. Ask "why is this dark?"; if the answer is "it looks technical", prescribe the domain-appropriate canvas.
- **Decorative numbering:** `NUMBERED_SCAFFOLDING` (`01 ·`, `02 /`, `03 ·` as section prefixes when order carries no meaning).
- **Eyebrow spam:** `composition.eyebrowSpam` / `EYEBROW_SPAM` (`> 3` tiny uppercase tracked labels). Keep at most 1 per page.
- **Monochrome card stacks:** grids of identical cards with identical icon, heading, and paragraph shape. Prescribe an index list, a table, or one featured item with the rest demoted.
- **Light/dark parity:** when the site supports both schemes, compare `--scheme light` and `--scheme dark` runs; a peak that only exists in one scheme is a finding.

---

## Output Contract

Emit every finding as a row in the master table (same contract as Lenses 1 and 2):

| Route / Selector | Before (Measured Proof) | After (Structure / Copy / CSS) | Why |
| --- | --- | --- | --- |
| `/about` `main > section` x5 | `sectionOpeningClone.maxConsecutive: 5` (`span+h2` at `96px` padding); `cardTextBloat` 4 items avg `52 words` | Merge sections 3-4 into a `4/8` timeline split; cut card bodies to `<= 18 words`; delete 4 of 5 eyebrows | Five identical openings and paragraph cards bury the one idea the page exists to land |

**Strict Proof Filter:** drop any claim without a measured `Before`. Taste without a metric is not a finding.
