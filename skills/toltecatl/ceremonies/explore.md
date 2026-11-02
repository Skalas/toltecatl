# Ceremony: `explore` — Divergent HTML Sketches, SVG Geometry & `DESIGN.md`

Use this ceremony when the user wants to explore a new screen, redesign a surface, compare 2–3 visual directions, build a brand palette / Live Color Lab, craft mathematical `<svg>` logos/wordmarks, or lock a `DESIGN.md` specification.

```
context inventory → intake → deal references → load house pack(s) → COMMIT-SHEET per variant → build 2–3 HTML variants + index switcher → ui-gate + dom-probe QA → head-to-head → lock DESIGN.md
```

---

## Step 0: Context Inventory (Before Any Question or Token)

Read what already exists before proposing anything new:
1. `DESIGN.md` (and any `docs/DESIGN*.md`, `docs/PHOTO-ASSETS.md`): locked tokens, fonts, and stated bans.
2. Root CSS (`:root` custom properties in `styles.css`, `global.css`, `tailwind.config.*`): the current canvas, ink, accent, type stack, and spacing scale.
3. Existing `sketches/` sets and their `COMMIT-SHEET.md` files: retired directions are not re-proposed.
4. The live surface, if any: run `node <skill>/scripts/dom-probe.mjs <url> --out .toltecatl/explore/<run>/baseline/` and note `composition.meanLightness`, `typographicScale`, and `proseDensity` as the baseline to beat.

State in 2-3 lines what is locked (keep), what is drifting (fix), and what is open (explore).

---

## Step 1: Focused Intake (Skip If Already Answered)

If the brief is underspecified, ask at most three concise questions (skip any already stated in the prompt or repo context):
1. **Feel & Posture:** What should this feel like? (e.g., *"precision Swiss instrument"*, *"printed physical bar sheet"*, *"calm editorial"*).
2. **References:** Which real products, venues, or artifacts set the bar?
3. **Core Action:** What is the single primary action a user performs on this surface in the first 10 seconds?

Declare the **Surface Mode** (`OPERATE` vs `PERSUADE`) and **Surface Archetype** (Monitor, Operate, Compare, Configure, Decide/Learn, Explore, Command/Inspect) in one line before touching tokens.

---

## Step 2: Deal References Without Context Bloat (`ref-dealer.mjs`)

Never read `data/brands.json` or `data/directions.json` directly into context. Query `ref-dealer.mjs` (< 1.5 KB stdout) to ground your variants in real production design systems and researched art directions:

```bash
# List or pull 1-3 real brand token systems (Linear, Stripe, Vercel, Wise, Raycast, etc.)
node <skill>/scripts/ref-dealer.mjs --list-brands
node <skill>/scripts/ref-dealer.mjs --brand linear.app

# List or deal researched art directions matching the sector/posture
node <skill>/scripts/ref-dealer.mjs --list-directions
node <skill>/scripts/ref-dealer.mjs --deal 3 --sector personal-portfolio
node <skill>/scripts/ref-dealer.mjs --direction <id>        # full untruncated brief

# Palettes and type pairings (feed COMMIT-SHEET fields 3 and 4)
node <skill>/scripts/ref-dealer.mjs --list-palettes --tag light-neutral
node <skill>/scripts/ref-dealer.mjs --palette <id>
node <skill>/scripts/ref-dealer.mjs --list-types --class serif-display
node <skill>/scripts/ref-dealer.mjs --type <id>

# One cohesive starting kit: direction + matching palette + matching type
node <skill>/scripts/ref-dealer.mjs --deal-system --sector finance --tone quiet
```

---

## Step 3: Load Matching `house/` Pack(s)

- **Always load** `house/anti-rgb-and-svg-geometry.md` whenever selecting colors, building a Live Color Lab, or creating `<svg>` logos, wordmarks, and icons.
- Load `house/hoja-de-barra.md` if the target is a café, restaurant, bakery, hospitality brand, or physical venue.
- Load `house/instrument-b2b.md` if the target is a B2B SaaS, POS, ERP, fintech, or devtools landing/showcase.
- Load `house/editorial-personal.md` if the target is a personal site, essay, portfolio, CV, or editorial publication.

**Brand & Logo Isolation Rule:** When defining brand identity and logos first, keep the comparison sheet strictly focused on **80/20 bicolor brand lockups** (wordmark + mathematical `<svg>` mark on dark and light surfaces, `64×64` app icon squircle, and `16×16` 1-bit favicon) under `design/assets/` before cluttering the canvas with full website layouts.

---

## Step 4: Fill `templates/COMMIT-SHEET.md` Per Variant (Hard Gate)

Copy `templates/COMMIT-SHEET.md` to `sketches/NNN-<stance>/COMMIT-SHEET.md` and fill all 7 fields **before writing any HTML**. No sheet, no build. The sheets are where divergence is proven: variants must differ on Archetype or Peak (fields 1-2) **and** on Grid Break & Section Rhythm (field 5).

**Copy Density Budget (enforced in every variant):** hero lead `<= 22 words`, card/row body `<= 18 words`, max `1` eyebrow kicker per page, no card paragraph `> 240` chars. Cut copy before adding layout.

---

## Step 5: Build 2–3 Divergent Self-Contained HTML Variants (`sketches/`)

Produce **2–3 variants** (never 1) in `sketches/NNN-<stance-name>/index.html` + `README.md` + `COMMIT-SHEET.md`. When creating a new sketch set, also write a parent `sketches/index.html` switcher (plain links or tabs to each variant, with its stance name and one-line peak) so the user can flip between them:
```
sketches/
├── index.html                 (variant switcher)
├── 001-chronometer-workbench/
│   ├── index.html
│   └── README.md
├── 001-swiss-split-flap/
│   ├── index.html
│   └── README.md
└── 001-editorial-ledger/
    ├── index.html
    └── README.md
```

### Variant Divergence & Fidelity Rules
- **Structural Wireframe Divergence First:** Before styling, sketch each variant's section map (the field 5 table). If two variants share the same section order and grid with different colors or fonts, they are one variant; redo one.
- **Diverge on Compositional Axes, Never Mere Color Swaps:** Pull variants apart along **Density** (compact vs airy), **Emphasis** (content-first vs action-first vs instrument-first), **Layout** (2-column workbench vs Swiss timetable vs single-sheet ledger), or **Canvas Posture** (crisp optical white `#FFFFFF`, cool mineral silver `#F0EFF0`, or achromatic graphite `#141416`).
- **Self-Contained & Interactive:** Single HTML file with inline `<style>` and `<script>`. Download any third-party `.woff2` fonts to local disk first and reference via `url('file:///absolute/path/font.woff2')` so headless Chromium never fails CORS on `file://`.
- **Real Domain Copy & State Transitions:** Zero *"Lorem ipsum"*, zero fake monument stats, zero emojis/dingbats, zero `em-dash` (`—`). Every variant must support:
  1. Clicking the primary action with visible state feedback (`:active { transform: scale(0.97) }`).
  2. At least one real state transition (time-ruler scrubber switching console state, filter/tab toggle, drawer/modal inspection).
  3. Optional unobtrusive `Tweaks` pill (`localStorage`-persisted) when exploring live palette or density presets.

---

## Step 6: Deterministic Gate & 2x Retina Visual Verification

1. **Run `ui-gate.mjs` on all sketches:**
   ```bash
   node <skill>/scripts/ui-gate.mjs --strict-house sketches/
   ```
   Repair every `FAIL` or `WARN` before taking screenshots.
2. **Probe Each Variant & Capture 2x Screenshots:**
   `node <skill>/scripts/dom-probe.mjs sketches/NNN-<stance>/index.html --strict --out sketches/NNN-<stance>/proof/` (true 375/768/1440 device metrics via Playwright or CDP). Check against the variant's COMMIT-SHEET: `meanLightness` within `±0.05` of field 3, `timidScale: false`, `eyebrowSpam: false`, `sectionOpeningClone.flagged: false`, `cardTextBloat: []`.
3. **Inspect Every Screenshot with `vision_analyze`:**
   Verify typography loaded, zero text overlap, crisp SVG geometry at `16×16` and `64×64`, and clean mobile reflow. Fix any visual bug before presenting to the user.

---

## Step 7: Opinionated Head-to-Head & Locking `DESIGN.md`

1. Deliver the `1440px` and `375px` screenshots inline via `MEDIA:`.
2. Present an **opinionated Head-to-Head Markdown table** comparing the 2–3 variants across Surface Fit, Density, Primary Action Clarity, Tactility, and Trade-offs, followed by **My Recommendation** (name the strongest variant and why, or specify the exact hybrid).
3. Once the user selects a winner (or approves your recommendation), lock the decisions into:
   - `DESIGN.md` — Authoritative token contract (`--bg-canvas`, `--bg-surface`, `--fg-default`, `--action-fill`, `--line-hairline`, `@font-face` weights, spacing, motion curves, and component anatomy).
   - The winner's `COMMIT-SHEET.md` — Marked `LOCKED`, with the winning variant path, retired explorations, and readiness for `ceremonies/handoff.md`.
