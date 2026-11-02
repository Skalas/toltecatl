# toltecatl

*Toltecatl* (Nahuatl: *"the master artisan of form and proportion"*) is the standalone UI/UX and Design Engineering engine in the Mesoamerican agentic tool family:

| Tool | Domain | Responsibility |
| :--- | :--- | :--- |
| **`metate`** | Code & Sprints | Spec-driven implementation, multi-model code review, `dod.sh` receipts, and CI gates |
| **`tlahcuilo`** | Prose & Voice | Multi-model writing debate and personal voice register overlays |
| **`mictlan`** | Memory | Nightly consolidation and long-term architectural recall |
| **`toltecatl`** | **Form & UI/UX** | **Computed DOM audits, throwaway HTML explorations, mathematical SVG geometry, `DESIGN.md` token contracts, and surgical `metate` handoffs** |

---

## Why `toltecatl` Never Edits Production App Code Directly

In production applications with business logic, state stores, and test suites (such as `CNTRL` / `Orbis`), mixing visual experimentation directly into `apps/`, `src/`, or `packages/` causes context bloat and unverified regressions.

`toltecatl` enforces a strict architectural boundary:
1. **In `explore` mode**, it builds self-contained interactive HTML variants (`sketches/NNN-<stance>/index.html`), extracts mathematical `<svg>` brand geometry (`design/assets/`), captures 2x Retina multi-viewport screenshots, and locks a formal `DESIGN.md` / `COMMIT-SHEET.md`.
2. **In `audit` mode**, it probes the live rendered DOM across `375px`, `768px`, and `1440px` viewports first (`computed-tree.json` + screenshots), then dispatches three focused subagent lenses (`composition-and-copy`, `hierarchy-states`, and `physics-tactility`) to produce a measured `| Route / Selector | Before (Measured Proof) | After (Target CSS/Token) | Why |` report.
3. **In `handoff` mode**, it packages approved visual work into **surgical GitHub Issues or a partitioned GitHub Milestone** pre-populated with `retires` and `requiredTouches` contracts for `metate` to execute under full test coverage (or applies directly *only* when the target repository is a standalone static HTML/marketing artifact gated by `ui-gate.mjs`).

---

## The Three Ceremonies

```text
/toltecatl audit   [url-or-route]   → Computed DOM probe + 3-lens visual audit + Before/After/Why/Proof table
/toltecatl explore [brief]          → 2–3 divergent HTML variants in sketches/ + SVG geometry + DESIGN.md
/toltecatl handoff [report/winner]  → GitHub Issue(s) or Milestone with retires/requiredTouches for metate
```

### Progressive Disclosure Architecture

`SKILL.md` is a strict `< 150`-line router (`< 6.5 KB`). At runtime, the agent loads **only one** ceremony (`ceremonies/*.md`), dispatches **only the required** lens (`lenses/*.md`), and loads **only matching** house packs (`house/*.md`):
- `house/anti-rgb-and-svg-geometry.md` — RGB trap prevention, Display P3 pixel sampling, and 100% mathematical `<svg>` glyph extraction.
- `house/hoja-de-barra.md` — 3-voice print typography, double/partial rules, and Mexican Spanish specialty coffee copy precision.
- `house/instrument-b2b.md` — Interactive B2B workbench/chronometer and Swiss split-flap aesthetics over generic SaaS card grids.
- `house/editorial-personal.md` — Paper-first posture, extreme scale contrast, artifact-over-explanation indexes for personal and editorial sites.
- `templates/COMMIT-SHEET.md` — 7-field pre-code commitment sheet required before any `explore` HTML.

---

## Deterministic CLI Scripts (`skills/toltecatl/scripts/`)

Agents never load raw JSON catalogs into context or guess CSS metrics from static source files. Instead, they invoke three zero-dependency Node.js (v20+ ESM) tools:

### 1. `ui-gate.mjs` — Static Anti-Slop & House-Rule Gate
```bash
node skills/toltecatl/scripts/ui-gate.mjs [--json] [--strict-house] <file-or-dir> [...]
```
Fails (`exit 1`) on deterministic violations:
- `EM_DASH`: U+2014 (`—`) in prose, strings, or templates.
- `TRANSITION_ALL`: `transition: all` or `transition-property: all`.
- `EASE_IN_UI`: `ease-in` on UI transitions/animations.
- `SCALE_ZERO_ENTRY`: `scale(0)` entry animations (must start `>= scale(0.95)`).
- `SCROLL_LISTENER`: Raw `addEventListener('scroll', ...)`.
- `GRADIENT_TEXT`: `background-clip: text` with gradient fills.
- `SIDE_STRIPE_BORDER`: `border-left` / `border-right >= 2px solid` on cards/callouts.
- `SLOP_BUZZWORDS`: AI marketing buzzwords (`revolutionize`, `unleash`, `supercharge`, `game-changer`, `seamlessly`, `elevate your`).
- `EMOJI_OR_DINGBAT`, `OFF_BRAND_CREAM_HEX`, `EYEBROW_SPAM`, `CARD_TEXT_BLOAT`: Promoted from `WARN` to `FAIL` under `--strict-house`.
- `NUMBERED_SCAFFOLDING`, `Z_INDEX_MAGIC`, `OUTLINE_NONE_UNSAFE`: `WARN`.
- Scans style, markup, `.js`/`.ts`/`.mjs`, and `.json` (copy rules only); exits `2` when nothing scannable is found.
- Inline suppression with rationale: `/* toltecatl-allow: <RULE_ID> -- <reason> */` covers its line and the next; in the first 15 lines it is file-wide.

### 2. `dom-probe.mjs` — Computed DOM & Multi-Viewport Inspector
```bash
node skills/toltecatl/scripts/dom-probe.mjs <url-or-file.html> [--out .toltecatl/audit/run-01] [--scheme light|dark] [--strict] [--allow-degraded]
```
Drives Playwright when installed, otherwise local Chrome through a zero-dependency DevTools Protocol driver (Node 22+), emulating true device metrics at `375x812`, `768x1024`, and `1440x900` (2x). Measures horizontal overflow, missing `tabular-nums`, row control baseline drift (`> 1.5px`), `< 44px` touch targets, `proseDensity` (long paragraphs, card text bloat), and `composition` (eyebrow count, `h1/body` scale, section-opening clones, canvas lightness). Saves `computed-tree.json` plus `375px.png`, `768px.png`, `1440px.png`. Exits `3` when no browser is available (unless `--allow-degraded`), `1` under `--strict` on overflow/targets/drift.

### 3. `ref-dealer.mjs` — Zero-Bloat Brand & Direction Dealer
```bash
node skills/toltecatl/scripts/ref-dealer.mjs --list-brands
node skills/toltecatl/scripts/ref-dealer.mjs --brand linear.app
node skills/toltecatl/scripts/ref-dealer.mjs --list-directions
node skills/toltecatl/scripts/ref-dealer.mjs --deal 3 --sector saas
node skills/toltecatl/scripts/ref-dealer.mjs --list-palettes [--tag light-neutral]
node skills/toltecatl/scripts/ref-dealer.mjs --palette white-link-blue
node skills/toltecatl/scripts/ref-dealer.mjs --list-types [--class serif-display]
node skills/toltecatl/scripts/ref-dealer.mjs --type switzer-semibold
node skills/toltecatl/scripts/ref-dealer.mjs --deal-system --sector finance --tone quiet
```
Slices `< 3 KB` cards from 54 real-world design systems (`data/brands.json`), 20 researched art directions (`data/directions.json`), 56 palettes (`data/palettes.json`), and 44 type pairings (`data/type.json`).

---

## Installation

```bash
# Install globally (or symlink with --link) and archive overlapping auto-triggering skills
./install.sh --link --user --retire-legacy

# Run full verification gate (bash -n, node --check, fixtures, and line/byte budgets)
make verify
```
