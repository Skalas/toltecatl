# Ceremony: `audit` — Computed-First Multi-Viewport UI/UX Audit

Use this ceremony when the user asks to audit, critique, review, or polish an existing live UI, route, component, or static page.

## Rule 1: Computed-First, Source-Second (Zero CSS Hallucination)

Never audit a user interface by reading raw `.css`, `.vue`, `.tsx`, or `.html` files in the dark. Cascade inheritance, flex/grid intrinsic sizing, font synthesis, and viewport clipping only exist in the rendered DOM. Every finding in an audit **must** cite a measured value from `dom-probe.mjs` / `computed-tree.json`, a deterministic `ui-gate.mjs` violation, or a visible defect in a captured multi-viewport screenshot.

For production applications with test suites (`apps/`, `src/`, `packages/`), **do not edit application source files during `audit`**. Your output is the verified `Before | After | Why | Proof` specification and sizing recommendation for `ceremonies/handoff.md`.

---

## Phase 1: Deterministic Evidence Collection

Create a run directory `.toltecatl/audit/<timestamp-or-slug>/` and execute both probes before dispatching any analysis:

### 1. Static Source & House Gate (`ui-gate.mjs`)
Run the zero-dependency static scanner against the target source paths:
```bash
node <skill>/scripts/ui-gate.mjs --strict-house --json <target-paths> > .toltecatl/audit/<run>/ui-gate.json
```
This deterministically catches:
- `EM_DASH`: U+2014 (`—`) in templates, copy, `alt`, or metadata.
- `EMOJI_OR_DINGBAT`: Decorative Unicode glyphs (`🔒`, `★`, `✦`, `●`, `🚀`, `✨`) in templates or CSS `content:`.
- `OFF_BRAND_CREAM_HEX`: Hardcoded warm cream/beige hexes (`#f4f1ea`, `#f7f4ee`, `#faf8f5`, `#f2ede4`, `#efece6`, `#fdf8f3`) drifting from cool/neutral root tokens (`var(--bg-canvas)`).
- `TRANSITION_ALL`, `EASE_IN_UI`, `SCALE_ZERO_ENTRY`, `SCROLL_LISTENER`, `GRADIENT_TEXT`, `SIDE_STRIPE_BORDER` (card/callout/alert/panel contexts only), `SLOP_BUZZWORDS`, `Z_INDEX_MAGIC`, and `OUTLINE_NONE_UNSAFE` (no matching `:focus-visible` rule for the same selector).
- Template macro rules: `EYEBROW_SPAM` (`>= 4` tiny uppercase tracked kickers), `CARD_TEXT_BLOAT` (`<p>` `> 240` chars inside `.card`/`article`/`li`), `NUMBERED_SCAFFOLDING` (`01 · 02 · 03 ·` decorative prefixes).
- Scans `.js`/`.ts`/`.mjs`/`.json` for copy, emoji, and scroll rules (locale catalogs included). Exit `2` means nothing was scanned: fix the path, never report it as clean.

### 2. Computed DOM & Multi-Viewport Capture (`dom-probe.mjs` + Browser CDP)
Run the computed DOM inspector against the live URL or local `file://` target:
```bash
node <skill>/scripts/dom-probe.mjs <url> --out .toltecatl/audit/<run>/
```
The probe drives Playwright when installed, otherwise local Chrome over the DevTools Protocol, and applies true device metrics per viewport (no macOS `500px` clipping). It exits `3` when no browser exists: install one or set `CHROME_PATH`; never fall back to source-reading and call it measured. `engine` in the report must be `playwright` or `cdp`.

**Scheme Parity:** when the site supports both color schemes (`prefers-color-scheme` rules or a theme toggle), run it twice into separate folders and audit both:
```bash
node <skill>/scripts/dom-probe.mjs <url> --scheme light --out .toltecatl/audit/<run>/light/
node <skill>/scripts/dom-probe.mjs <url> --scheme dark --out .toltecatl/audit/<run>/dark/
```

This captures `computed-tree.json` plus `375px.png` (`375×812`), `768px.png` (`768×1024`), and `1440px.png` (`1440×900`), measuring:
- Horizontal overflow (`document.documentElement.scrollWidth > window.innerWidth`).
- `.line-grid` and `.form-row` sibling bottom-edge baseline deltas (`> 1.5px` when labels wrap or heights mismatch).
- Missing `font-variant-numeric: tabular-nums` on prices, percentages, timers, and counters.
- Touch targets `< 44×44px` at `<= 480px` (inline prose links exempt).
- `proseDensity`: `totalWords`, `paragraphCount`, `longParagraphs` (`> 45` words or `> 78ch`), `cardTextBloat` (`> 38` words / `240` chars per card).
- `composition`: `eyebrowCount`/`eyebrowSpam`, `typographicScale` (`h1ToBodyRatio`, `timidScale < 1.8`), `sectionOpeningClone`, `meanLightness` (canvas OKLab `L`).
- Active animations (`document.getAnimations()`). Add `--strict` to exit `1` on overflow, undersized targets, or row drift.

**macOS Mobile Viewport Pitfall (only when driving `browser_exec` by hand):**
macOS headless Chrome CLI (`--window-size=375,...`) enforces a ~500px minimum window width, laying out at `500px` and cropping to `375px`. `dom-probe.mjs` already avoids this; by hand, set metrics via CDP:
```python
cdp('Emulation.setDeviceMetricsOverride', width=375, height=812, deviceScaleFactor=2, mobile=True)
```
Capture `375px` (mobile), `768px` (tablet), and `1440px` (desktop) at `2x` DPR, and inspect each screenshot with `vision_analyze`.

---

## Phase 2: Unbiased 3-Lens Subagent Dispatch (`delegate_task`)

Do not audit composition, hierarchy, and motion in a single muddled pass. Dispatch three parallel subagents (or three isolated sequential passes if `delegate_task` is unavailable), giving each subagent ONLY `.toltecatl/audit/<run>/computed-tree.json`, `.toltecatl/audit/<run>/ui-gate.json`, the screenshot paths, the target CSS/component files, and its assigned lens prompt:

0. **Lens 0 — Macro-Composition, Spatial Rhythm & Copy Economy:**
   Load and pass `lenses/composition-and-copy.md`.
   Focuses on domain/archetype concordance (no console costume on personal or venue sites), the page's peak, `proseDensity` copy cuts, section-opening clones and the required grid break, and house tells (near-black reflex, decorative numbering, eyebrow spam, light/dark parity).

1. **Lens 1 — Hierarchy, 8-State Matrix & Layout Precision:**
   Load and pass `lenses/hierarchy-states.md`.
   Focuses on Surface Archetype alignment, the 8 interactive states (`default`, `hover`, `:focus-visible`, `:active`, `disabled`, `loading`, `empty`, `error`), `.line-grid` row baseline alignment (`<= 1px` delta), `.modal form` grid gaps and explicit `<select>`/`<input>` contrast, `tabular-nums`, `>= 44px` hit targets, typographic scale contrast (`>= 1.25`), and cross-route token drift.

2. **Lens 2 — Emil Kowalski Physics, Frequency & Tactility:**
   Load and pass `lenses/physics-tactility.md`.
   Focuses on interaction frequency vs duration (100+/day keyboard/POS actions = `0ms`; tens/day = minimal; occasional modals/drawers = `180–280ms` with `--ease-drawer` or `--ease-out`), `:active { transform: scale(0.97) }` press feedback, trigger-anchored popover `transform-origin` (never `scale(0)`, start at `scale(0.95)`), zero `ease-in` or `transition: all`, and `@media (prefers-reduced-motion: reduce)`.

### Mandatory Output Contract for All Lenses
Every finding from Lens 0, Lens 1, and Lens 2 must be emitted as a row in this exact Markdown table:

| Route / Selector | Before (Measured Proof) | After (Target CSS / Token) | Why |
| --- | --- | --- | --- |
| `/admin/users` `.modal form` | `display: block` (`0px` vertical gap between `<label>` rows; `<select>` uses native gray chrome) | `.modal form { display: grid; gap: 16px; } .modal select { background: #fff; color: var(--fg-default); }` | Placing `display: grid` only on `<dialog>` leaves `<form>` children in block flow with zero spacing |

**Strict Proof Filter:** Drop any subagent claim that lacks a specific selector, a measured `Before` metric (from `computed-tree.json`, `ui-gate.json`, or a screenshot coordinate), or an exact `After` fix. For Lens 0, `After` may be a structural or copy change (merge/delete sections, re-grid to `4/8`, rewrite to `<= N` words with the new text) instead of CSS.

---

## Phase 3: Synthesis, Visual Delivery & Issue/Milestone Sizing

1. **Deliver Visual Proof Inline:**
   Attach the captured `375px`, `768px`, and `1440px` screenshots (both schemes when audited) in your response using `MEDIA:` paths so the user sees the exact state of the surface.
2. **Present the Deduplicated Master Table:**
   Merge Lens 0, Lens 1, Lens 2, and `ui-gate.mjs` findings into a single prioritized table ordered by severity. Macro-structural and copy-cut rows sit alongside CSS rows; tag each row `[macro]`, `[copy]`, or `[css]`:
   `| # | Route / Selector | Before (Measured) | After (Structure / Copy / CSS / Token) | Why | Proof (Metric / Screenshot) |`
3. **Recommend Handoff Sizing (ready for `ceremonies/handoff.md`):**
   - **Single GitHub Issue:** Choose when total findings are **<= 5 localized fixes** confined to 1–2 views/components with no root token schema changes.
   - **GitHub Milestone (3–6 Partitioned Issues):** Choose when findings span **multiple routes/modules**, require root token migrations (`styles.css` / `DESIGN.md`), complete missing 8-state matrix views across a portal, or split layout structures. State the proposed issue partitions by file ownership and list the `retires` and `requiredTouches` contracts so the user can approve immediate handoff via `ceremonies/handoff.md`.
