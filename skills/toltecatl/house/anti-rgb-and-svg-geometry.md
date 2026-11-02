# House Pack: Anti-RGB Color Discipline & Mathematical SVG Geometry

Load this pack whenever choosing brand colors, building a Live Color Lab, auditing palette contrast, or constructing logos, wordmarks, and icons.

---

## 1. The 3 Brand & LLM Color Traps (Check RGB Channels Explicitly)

Before proposing or locking any hex code, inspect its `(R, G, B)` channel balance and reject these three failure modes:

1. **Trap 1 — The "Anti-Purple" RGB Primary Cliché:**
   When avoiding default AI indigo (`#6366F1`), **never** swing to 100%-saturated International Orange (`#FF4800`), Tailwind Emerald (`#10B981`), or Electric Klein Blue (`#0047FF`).
2. **Trap 2 — The Claude / Anthropic Warm-Brown & Cream Signature (`R > B`):**
   - Never pair warm brownish-charcoal darks (`#262624`, `#2A2726` where `R > B`) with warm cream/stone canvases (`#F2EDE4`, `#EFECE6`, `#FAF8F5`, `#FAFAF9`) and terracotta/ochre. That exact RGB signature reads immediately as Claude Desktop's default theme.
   - **Cream Canvas Rule (scoped by Surface Mode):** `OFF_BRAND_CREAM_HEX` bans **accidental** warm-cream drift (`#F4F1EA`, `#F7F4EE`, `#FAF8F5`, `#F2EDE4`, `#EFECE6`, `#FDF8F3`) on cool/neutral `OPERATE` and B2B surfaces, where a stray cream panel signals token drift. On `PERSUADE` hospitality (`hoja-de-barra.md`) and editorial/personal (`editorial-personal.md`) surfaces, warm paper or cotton is a **deliberate** choice: declare it once as a root token with a reasoned suppression on the line above, and keep ink achromatic or cool (`R <= B`) so it never forms the warm-brown pair above:
     ```css
     /* toltecatl-allow: OFF_BRAND_CREAM_HEX -- deliberate editorial/hospitality paper canvas */
     --paper: #faf8f5;
     ```
     Suppressions apply to their own line and the next (file-wide only in the first 15 lines), so every stray cream literal elsewhere still fails `--strict-house`.
   - **Callout Surface Rule on Cool Canvases:** When a brand pairs a warm bronze/amber accent (`#A47146`) with a cool mineral/silver canvas (`#F0EFF0`, `#EEF2F2`), **never** tint callouts, warning boxes, or highlighted inputs with warm cream/peach backgrounds (`#FDF8F3`, `#FFF8F1`, `#FFFDF9`, `#F4F1EA` where `R > G > B`). Keep the neutral canvas or pure `#FFFFFF` surface so secondary views never drift into a warm-cream signature.
3. **Trap 3 — Mass-Retail & Crypto Archetype Collisions:**
   - Mid-tone royal blue + bright yellow (`#0060A9` + `#FFCB1A`) collides with IKEA / Walmart. Fix by darkening the blue >= 20% into deep Prussian (`#0D233A`).
   - Cold navy + neon mint (`#15283B` + `#23E29A`) reads as Supabase / crypto exchange — too cold for hospitality/physical commerce and steals the semantic positive-margin green channel.

### Preferred Neutral & Mineral Balances
- **Light Canvases:** Vary across crisp optical white (`#FFFFFF`) and cool mineral silver (`#F0EFF0`, `#ECEEF1` where `B >= R`).
- **Dark Anchors:** Use achromatic graphite (`R = G = B`, `#141416`), cool titanium (`#181A1C`), or balanced mineral spruce/teal (`G == B`, e.g., `#1B3D3D` paired with saddle bronze `#A47146` and mineral sage `#66AB8E`).

---

## 2. Deterministic Color Workflows & Display P3 Pixel Sampling

- **No Static Invented Hex Sheets:** Either deal proven brand systems via `node <skill>/scripts/ref-dealer.mjs --brand <slug>` into an interactive in-page **Tweaks / Live Color Lab**, or pair with perceptual constraint tools:
  - **Huemint** (`huemint.com/bootstrap-plus/` or `2 color brand`) for contrast-matrix combinations.
  - **Realtime Colors** (`realtimecolors.com`) for live locking/cycling.
  - **Radix Custom Colors** (`radix-ui.com/colors/custom`) for 12-step OKLCH/APCA scales.
- **macOS Display P3 Screenshot Sampling Rule:**
  When extracting hex values from a user's macOS screenshot (e.g., Huemint), sample pixels via Swift `NSBitmapImageRep` (`rep.colorAt(x:y:)`) **without** converting via `.usingColorSpace(.sRGB)`. Converting a Display P3 screenshot to `.sRGB` distorts the raw channel bytes and shifts the exact HEX values displayed in the browser.

---

## 3. 100% Mathematical `<svg>` Geometry & Font Binary Extraction

Never use diffusion image models for logos, wordmarks, or app icons. Construct all marks in `design/assets/` on an exact integer coordinate grid (`24×24` or `36×36`) that stays razor-sharp at `16×16px` 1-bit favicon and `512×512px` squircle sizes.

### Extract Real Glyph `<path>` Data from `.ttf`/`.woff2` Binaries
- **Never hand-type SVG letter coordinates:** Hand-coded Bézier approximations lose a typeface's true stroke weight, optical bowl compensation, ink traps, and kerning, making wordmarks look thin and loose.
- **Binary Extraction Pipeline (`fontkitten` / `opentype.js`):**
  1. Parse the local `.ttf` or `.woff2` binary directly.
  2. Extract exact glyph outlines (`glyph.path.toSVG()`) and `advanceWidth` metrics.
  3. Flip the Y-axis (`transform="translate(0, ascent) scale(1, -1)"`), apply tight tracking offsets, and surgically edit only the specific terminal vertices (e.g., cutting a 45° bevel on `t` and `l` terminals to match the icon angle).
- **Test Lowercase Silhouettes for Consonant-Heavy Names:**
  All-consonant names (e.g., 5 consonants, 0 vowels like `cntrl`) form a rigid rectangular brick in all-caps. Test lowercase in high x-height geometric/Swiss grotesks where ascenders (`t`, `l`) and arches (`c`, `n`, `r`) create a distinctive word silhouette.
- **Download `.woff2` Files Locally for `file://` Rendering:**
  Remote font CDNs frequently fail CORS or block headless Chromium on `file://` origins. Download `.woff2` files to local disk and load via `url('file:///absolute/path/font.woff2')`.

### OFL Open-Source Font Preference
Start from a SIL Open Font License (OFL) geometric grotesk or mono (`Plus Jakarta Sans`, `Outfit`, `Space Grotesk`, `Inter`, `JetBrains Mono`) and customize its extracted SVG glyph terminals for the logo. This achieves proprietary brand exclusivity and **100% license-free typographic unity** across Web, Capacitor/iOS, Figma, Canva, and pitch decks without commercial seat limits or compliance crawlers.

---

## 4. Dual Wordmark System & Geometric Collision Checks

- **Isolate 80/20 Bicolor Brand Sheet First:** Lock the 2-color mark (dark & light lockups, `64×64` squircle, `16×16` favicon) before designing full web pages.
- **No Double Focal Accents (Dual Wordmark System):**
  When the brand icon already carries the primary accent shape/color (e.g., a 45° rotated diamond core or corner LED), **never** repeat that accent as a period at the end of the adjacent wordmark (`[Icon♦] wordmark♦` makes the eye bounce between two competing focal points) and never wrap the icon perimeter in a colored border.
  - **Icon + Wordmark Lockup:** `[Icon♦] wordmark` (clean wordmark, single focal point inside the icon).
  - **Standalone Text-Only Lockup:** `wordmark♦` (accented terminal period reserved strictly for receipt headers, compact topbars, or signatures where the icon is absent).
- **Confine Bespoke Display/Logo Fonts to the Mark:** Never apply a decorative logo font (e.g., `Bristol` / `Brixtol`) to page headings (`h1`–`h3`), nav links, or buttons. Pair the mark with the primary geometric/editorial sans (`-0.03em` tracking) for UI hierarchy.
- **Audit Geometric Primitives Against Brand & ISO Collisions:**
  - Split bicolor chevron (`^`) → collides with **BBVA** ascending 'A' and **NordVPN**.
  - Centered caret over equal-width bar (`^_`) → reads as ISO **Eject (`⏏`)** or Caps Lock (`⇪`). Fix by offsetting the bar right as an asymmetric terminal prompt.
  - Caret roof over an unrotated square → reads as a **Home / house icon**. Fix by rotating the inner core `45°` into a diamond parallel to the caret arms.
- **Zero Emojis or Unicode Dingbats (`EMOJI_OR_DINGBAT`):** Never use emojis or decorative Unicode symbols (`🔒`, `★`, `✓`, `✦`, `●`) in HTML templates, locale strings, or CSS `::before { content: '●' }`. Use plain typographic labels and pure CSS geometry (`width: 6px; height: 6px; border-radius: 50%; background: currentColor`).
