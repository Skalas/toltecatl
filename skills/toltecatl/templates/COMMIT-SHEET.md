# COMMIT-SHEET: `<project>` / `<surface>` (`sketches/NNN-<stance>/`)

Mandatory pre-code commitment for `explore` and any structural redesign. Fill all 7 fields **before writing a single line of HTML**. One sheet per variant; variants must differ on at least fields 1, 2, and 5. An empty, hedged ("maybe", "either"), or averaged field blocks the build.

---

## 1. Surface Mode & Archetype
- **Mode:** `OPERATE` | `PERSUADE` (pick one)
- **Archetype:** Monitor | Operate | Compare | Configure | Decide/Learn | Explore | Command/Inspect (pick one, never average two)
- **Domain check:** What is this site, really? (personal essay, venue, POS, SaaS...) and why the archetype fits that domain, not the last project's.

## 2. Peak / Signature
- **The ONE anchor a visitor remembers:** `<e.g. 18vw wordmark cropped by the right edge>`
- **Where weight drops:** name the 2+ sections that are deliberately quiet so the peak reads. Uniform weight everywhere is a failed sheet.

## 3. Color & Target Lightness (L)
- **OKLCH tier:** Restrained | Committed | Full-Palette | Drenched
- **Target canvas L (`0.08..0.98`):** `<number>` (verify with `dom-probe.mjs` `composition.meanLightness`)
- **Palette source:** `ref-dealer.mjs --palette <id>` (or brand slug)
- **Why this is not the reflex:** state the category default (e.g. fintech navy, dev-tool near-black console, café cream) and why you are not using it. `L < 0.12` needs an explicit reason.

## 4. Typography Contrast Axis & Scale
- **Pairing:** `ref-dealer.mjs --type <id>` (Display: `<family/weight>` / Text: `<family/weight>`)
- **Contrast axis:** size | weight | width | serif-vs-sans | case (name the primary one)
- **Scale:** `h1/body >= 1.8x` (target: `<ratio>`; `dom-probe` flags `timidScale` below `1.8x`)

## 5. Grid Break & Section Rhythm
- **Structural asymmetry:** `<e.g. 4/8 split facts|prose; full-bleed plate after section 2>`
- **Section opening map:** list each section's opening pattern; no two adjacent sections may share one (e.g. `eyebrow + h2 + p` three times in a row fails, `sectionOpeningClone`).

| # | Section | Opening pattern | Width / grid |
| --- | --- | --- | --- |
| 1 | Hero | `<pattern>` | `<grid>` |
| 2 | `<name>` | `<pattern>` | `<grid>` |
| 3 | `<name>` | `<pattern>` | `<grid>` |

## 6. Copy Density Budget
| Slot | Ceiling | Planned |
| --- | --- | --- |
| Hero lead | `<= 22 words` | `<n>` |
| Card / row body | `<= 18 words` | `<n>` |
| Eyebrow kickers per page | `<= 1` | `<n>` |
| Paragraph inside any card | `<= 240 chars` (`CARD_TEXT_BLOAT`) | `<n>` |

Let layout and artifacts (specimens, tables, photographs, real numbers) carry meaning instead of paragraphs. If a slot exceeds its ceiling, cut copy before adding layout.

## 7. Reflex & House Tells Broken (min 2)
- **1st-order cliché (category default):** `<e.g. SaaS hero + 3 feature cards>` -> replaced by `<...>`
- **2nd-order anti-cliché (the trendy escape):** `<e.g. brutalist mono everything>` -> replaced by `<...>`
- **Toltecatl House Tells rejected (tick at least 2):**
  - [ ] No default near-black console canvas (`L < 0.12`) without a stated reason
  - [ ] No `01 ·` / `01 /` mono eyebrow on every section (`NUMBERED_SCAFFOLDING`, `EYEBROW_SPAM`)
  - [ ] No 48px hero stat box / monument metric row
  - [ ] No industrial POS chrome (status dots, `3 ACTIVE`, "Systems Ledger") on editorial or personal sites
  - [ ] No monochrome stack of identical cards
  - [ ] Other: `<...>`

---

**Gate:** after the build, `ui-gate.mjs --strict-house` exits `0` and `dom-probe.mjs` reports `eyebrowSpam: false`, `timidScale: false`, `sectionOpeningClone.flagged: false`, and `cardTextBloat: []`, with `meanLightness` within `±0.05` of field 3.
