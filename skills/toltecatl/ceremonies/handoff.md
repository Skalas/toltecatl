# Ceremony: `handoff` — Packaging Design Specs for `metate` or Static Apply

Use this ceremony after an `audit` report or an `explore` winning variant (`DESIGN.md` / `sketches/NNN-<winner>/`) is approved, to translate visual decisions into tracked engineering execution.

## Step 1: Classify the Target Repository

Check whether the target repository is an **Application Repo** (contains `apps/`, `src/`, `packages/`, business logic, state stores, or automated test suites) or a **Standalone Static Artifact** (pure static HTML/CSS/Astro marketing site with no application test suite).

- **Path A — Application Repo (`metate` Handoff):** `toltecatl` **never** modifies `apps/`, `src/`, or `packages/`. You package surgical GitHub Issue(s) or a partitioned GitHub Milestone for `metate-start`.
- **Path B — Standalone Static HTML / Marketing Artifact:** Apply the approved changes directly to the static HTML/CSS files and verify with `ui-gate.mjs` + multi-viewport Retina screenshots.

---

## Path A: Application Repo Handoff (`gh issue` / Milestone for `metate`)

### 1. Size the Blast Radius: Single Issue vs GitHub Milestone

| Blast Radius | Packaging Vehicle | Partitioning Strategy |
| --- | --- | --- |
| **<= 5 localized fixes** confined to 1–2 views/components within a single module, using existing root tokens | **Single GitHub Issue** (`gh issue create`) | All fixes in one surgical issue with a single `Before \| After \| Why` table |
| **> 5 fixes**, cross-route drift, root token additions (`styles.css` / `DESIGN.md`), 8-state matrix completion across multiple views, or full screen redesigns from `sketches/` | **GitHub Milestone (3–6 Issues)** (`gh api repos/:owner/:repo/milestones` + `gh issue create --milestone`) | Partition strictly by **disjoint file ownership** so `metate` workers never collide: e.g., Issue 1: Root Tokens & Primitives (`styles.css`, `DESIGN.md`), Issue 2: Primary Route/Workbench, Issue 3: Secondary Modals & 8-State Matrix |

### 2. Mandatory GitHub Issue Body Contract (`metate-start` Ready)

Every GitHub Issue created by `toltecatl` **must** contain these four sections so `metate-start` and `dod.sh receipt` can enforce 100% mechanical verification without ambiguity:

```markdown
## 1. Visual Authority & Reference
- **Source Ceremony:** `toltecatl` (`audit` run `.toltecatl/audit/<run>/` | `explore` winner `sketches/NNN-<stance>/index.html`)
- **Surface Mode & Archetype:** `OPERATE` — Operate / Configure
- **Locked Token Spec:** `DESIGN.md` (section / commit reference) + locked `sketches/NNN-<winner>/COMMIT-SHEET.md` (explore only)
- **Visual Proof:** `<path-to-before-or-sketch-screenshot.png>`

## 2. Surgical Specification (`Before | After | Why | Proof`)
| Route / Selector | Before (Measured) | After (Exact CSS / Token / DOM) | Why | Proof |
| --- | --- | --- | --- | --- |
| `apps/web/src/views/UsersView.vue` `.line-grid` | `align-items: stretch` (`4px` bottom-edge baseline delta when label wraps) | `align-items: end` + `font-variant-numeric: tabular-nums` on `.metric-cell` | Multi-line labels push adjacent inputs out of horizontal alignment | `computed-tree.json` row delta `4.0px -> 0.0px` |

## 3. Scope Completeness Contract (`retires` & `requiredTouches`)
```yaml
retires:
  - "#f4f1ea"
  - "#f7f4ee"
  - "transition: all"
  - ".legacy-card-grid"
requiredTouches:
  - "apps/web/src/styles.css"
  - "apps/web/src/views/UsersView.vue"
  - "apps/web/src/components/UserModal.vue"
```
- **`retires`:** Exact deprecated CSS classes, hardcoded off-brand hex literals, legacy props, or patterns that must reach **0 occurrences** across the target scope (`git grep` = 0).
- **`requiredTouches`:** Every sibling view, modal, or component that shares the updated token/pattern and must be modified in the same sprint so no route is left half-migrated.
- **Macro & copy rows (Lens 0):** structural changes (merge/delete sections, `4/8` re-grid) and copy cuts ship with the exact replacement text and its word count in the `After` column, so `metate` never has to invent copy.

## 4. Verification Gate Commands
- `node skills/toltecatl/scripts/ui-gate.mjs --strict-house <touched-files>` (exit `0`)
- `node skills/toltecatl/scripts/dom-probe.mjs <route-url> --strict --out .toltecatl/verify/` (exit `0`: `0` overflow, `0` baseline drift, `0` `<44px` mobile hit targets; repeat with `--scheme light` and `--scheme dark` when both are supported)
- Lens 0 targets from the spec hold in `computed-tree.json` (e.g. `cardTextBloat: []`, `sectionOpeningClone.flagged: false`, `h1ToBodyRatio >= 1.8`)
```

After creating the Issue(s) or Milestone via `gh`, report the exact issue URLs and milestone number so the user can launch `metate-start`.

---

## Path B: Standalone Static HTML / Marketing Artifact Apply

When the target is a standalone static HTML/CSS file or static venue/marketing site with no application test suite:

1. **Apply the Winning Spec or Audit Fixes:**
   Edit the HTML/CSS files directly, honoring all rules from `DESIGN.md` and the active `house/` packs (`anti-rgb-and-svg-geometry.md`, `hoja-de-barra.md`, `instrument-b2b.md`, or `editorial-personal.md`).
2. **Enforce Deterministic Static Gate (`ui-gate.mjs`):**
   ```bash
   node <skill>/scripts/ui-gate.mjs --strict-house <target-files>
   ```
   Must exit `0` with zero `FAIL` or `WARN` violations (zero `em-dash` `—`, zero emojis/dingbats, zero `transition: all`, zero `ease-in`, zero `scale(0)`).
3. **Multi-Viewport Computed & Visual QA (`375px` / `768px` / `1440px`):**
   Run `node <skill>/scripts/dom-probe.mjs <url-or-file> --strict --out .toltecatl/verify/` (true `375px` device metrics at `2x` via Playwright or CDP; `engine` must not be `degraded-fallback`).
4. **Inspect & Deliver Proof:**
   Verify all three viewport screenshots with `vision_analyze`, confirm zero console errors and zero layout regressions, and attach the final `375px`, `768px`, and `1440px` screenshots inline via `MEDIA:`.
