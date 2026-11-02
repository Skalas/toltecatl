---
name: toltecatl
description: "Use when the user explicitly asks for a UI/UX audit, visual critique, design exploration (2-3 HTML variants), brand/logo SVG geometry, or DESIGN.md system specification."
version: 1.0.0
license: MIT
---

# Toltecatl — UI/UX & Design Engineering Engine

`toltecatl` ("the master artisan of form and proportion") is the standalone UI/UX and design engineering engine in the Mesoamerican tool pantheon:

| Engine | Domain | Ownership |
| --- | --- | --- |
| `metate` | **Code** | Sprints, production implementation, tests, `dod.sh`, CI |
| `tlahcuilo` | **Prose** | Multi-model debate, anti-AI voice pass, voice fingerprint |
| `mictlan` | **Memory** | Nightly consolidation and archival |
| `toltecatl` | **Form & Proportion** | Visual direction, DOM-computed UI/UX audits, throwaway HTML prototypes (`sketches/`), mathematical `<svg>` brand assets (`design/assets/`), `DESIGN.md` token contracts, and surgical `Before | After | Why | Proof` specs handed off to `metate` |

## Critical Boundary Rule

For production applications with business logic and test suites (e.g., `CNTRL`, `Orbis`), **`toltecatl` NEVER edits production application code (`apps/`, `src/`, `packages/`) directly.**
- `toltecatl` probes, designs, prototypes in `sketches/` or `design/assets/`, authors `DESIGN.md`, and packages verified `Before | After | Why | Proof` contracts into **GitHub Issues or a GitHub Milestone** (with explicit `retires` and `requiredTouches`) for `metate` to implement.
- Direct HTML/CSS edits are permitted **only** on standalone static HTML/Astro/marketing artifacts that have no application test suite, and must pass `node <skill>/scripts/ui-gate.mjs --strict-house`.

## Step 0: Commit to Surface Mode & Archetype

Before loading a ceremony or touching tokens, declare two things in one line:

1. **Surface Mode:**
   - `OPERATE` — App screens, POS terminals, dashboards, admin consoles, tables, settings. Scanability, spatial memory, 0ms keyboard speed, and native expectations outrank expression.
   - `PERSUADE` — Landing pages, editorial sheets, hospitality venues, portfolios, showcases. Distinct point of view, tactile physical metaphors, and narrative rhythm lead.
2. **Surface Archetype (pick the primary one; never average two into mush):**
   - **Monitor** — Watching state change (dashboards, observability). Density and glanceable hierarchy; never add a marketing hero.
   - **Operate** — Taking action on queues/items (POS, consoles, inboxes). Action affordances, `:active` tactility, and selection state dominate.
   - **Compare** — Weighing options (pricing, spec matrices). Aligned columns, structural parity, one highlighted differentiator.
   - **Configure** — Setting up (forms, modals, wizards). `.modal form` grid rhythm, explicit `<select>`/`<input>` contrast, clear validation.
   - **Decide / Learn** — Convincing or teaching (landings, editorial, venue sheets). One idea lands per section; the only archetype where a hero belongs.
   - **Explore** — Browsing an open catalog (galleries, maps, filter grids).
   - **Command / Inspect** — Keyboard-driven execution or deep object inspection (command bars, detail drawers). 0ms open/close latency.

## Step 1: Route to Exactly ONE Ceremony

Never load all ceremonies at once. Load only the ceremony matching the user's request:

| Request Type | Ceremony to Read | Deliverable |
| --- | --- | --- |
| Live UI/UX critique, visual QA, responsive/alignment check, motion or contrast audit | `ceremonies/audit.md` | Computed DOM evidence (`.toltecatl/audit/<run>/`), 2x screenshots (`375px`/`768px`/`1440px`), 2-lens `Before \| After \| Why \| Proof` table, and Issue vs Milestone sizing |
| New screen/site exploration, 2–3 HTML mockups, brand palette lab, mathematical `<svg>` logo, or `DESIGN.md` creation | `ceremonies/explore.md` | 2–3 interactive HTML variants (`sketches/NNN-<stance>/index.html`), `<svg>` marks (`design/assets/`), 2x Retina screenshots via `MEDIA:`, Head-to-Head table, locked `DESIGN.md` / `COMMIT-SHEET.md` |
| Convert approved `audit` findings or `explore` winner into tracked engineering work (or apply to static HTML) | `ceremonies/handoff.md` | GitHub Issue(s) or partitioned GitHub Milestone with `retires` + `requiredTouches` for `metate-start`, OR verified static HTML edit gated by `ui-gate.mjs` |

## Step 2: Load Matching `house/` Packs (On-Demand Only)

Load a `house/` pack **only** when the assignment touches its domain:

- `house/anti-rgb-and-svg-geometry.md` — **Always load** when choosing colors/palettes, building a Live Color Lab, or crafting `<svg>` logos, wordmarks, and icons.
- `house/hoja-de-barra.md` — Load for cafés, restaurants, bakeries, hospitality, and physical venue sites.
- `house/instrument-b2b.md` — Load for B2B SaaS, POS, ERP, fintech, or devtools landing pages and interactive product showcases.

## Step 3: Deterministic CLI Scripts (Never Read `data/*.json` Directly)

Let `<skill>` be the directory containing this `SKILL.md`. Always invoke these Node.js scripts instead of loading raw JSON catalogs into context:

- **Static & House Rule Gate:**
  `node <skill>/scripts/ui-gate.mjs [--json] [--strict-house] <file-or-dir> [...]`
  Fails (exit `1`) on `EM_DASH` (`—`), `TRANSITION_ALL`, `EASE_IN_UI`, `SCALE_ZERO_ENTRY`, `SCROLL_LISTENER`, `GRADIENT_TEXT`, `SIDE_STRIPE_BORDER`, `SLOP_BUZZWORDS`, and (with `--strict-house`) `EMOJI_OR_DINGBAT` and `OFF_BRAND_CREAM_HEX`.
- **Computed DOM & Multi-Viewport Inspector:**
  `node <skill>/scripts/dom-probe.mjs <url-or-file> [--out <dir>]`
  Probes `375x812`, `768x1024`, and `1440x900` for horizontal overflow, missing `tabular-nums`, `.line-grid`/`.form-row` baseline drift (`> 1.5px`), `< 44px` mobile hit targets, and captures viewport screenshots.
- **Zero-Bloat Reference & Brand Dealer (< 1.5 KB stdout):**
  `node <skill>/scripts/ref-dealer.mjs --list-brands | --brand <slug> | --list-directions | --direction <id> | --deal <n>`
