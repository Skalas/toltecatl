# House Pack: "La Hoja de Barra" — Hospitality, Cafés & Physical Venues

Load this pack whenever designing, sketching, or auditing websites and menus for independent cafés, specialty coffee bars, bakeries, restaurants, or physical hospitality venues.

---

## 1. Break the SaaS Template Reflex: Treat the Page as a Physical Printed Sheet

Never dress a SaaS landing skeleton (kicker + centered headline + twin CTA buttons, 3-column equal-padded cards, rounded pill badges, dashboard filter tabs, and cropped horizontal photo banners) in a venue's colors.

Design the page as **"La Hoja de Barra"** — a tactile, physical printed sheet resting on the espresso bar or counter:
- **Single Paper Surface:** Replace boxed cards, drop shadows, and pill badges with one continuous paper surface (`#F2ECE0` warm cotton or `#F4F5F6` crisp architectural stock).
- **Print Rules & Registration Offsets:**
  - Use **double section rules** (`border-top: 3px double currentColor`) to separate major chapters (Barra de Espresso, Panadería, Horarios).
  - Use **partial rules** (`width: 40%`) to punctuate subsections instead of spanning every divider edge-to-edge.
  - Connect every menu item name to its right-aligned tabular price with **leader dots** (`····` via flex `border-bottom: 1px dotted` or repeating radial-gradient).
  - Anchor physical counter callouts with real material colors and a `2px` print-registration offset shadow (e.g., a yellow counter slab with a `2px 2px 0` cobalt registration offset).

---

## 2. The 3-Voice Print Typographic Hierarchy & Optical Weight Thickening

Never set an entire venue sheet in a single heavy sans weight (which shouts everywhere) or declare intermediate CSS `font-weight` values (`400`, `500`, `600`) when the repository's font files do not ship them (causing ugly browser faux-bold/synthesis).

### The 3 Print Voices
1. **Voice 1 — Board Sans (`800` Heavy):** Strictly for short category headers, signboards, and section titles (`letter-spacing: -0.03em`). Never use a bespoke logo display font (e.g., `Bristol` / `Brixtol`) for headings or body UI.
2. **Voice 2 — Human Editorial Serif (`Italic` / `Regular`):** For origin stories, tasting notes, and emotional bar lines (or locked brand body font if specified in `docs/PHOTO-ASSETS.md` / `DESIGN.md`).
3. **Voice 3 — Tabular Mono (`font-variant-numeric: tabular-nums`):** Strictly for prices (`$65`), operating hours (`08:00 – 20:00`), altitude (`2,240 m s.n.m.`), extraction temperature (`93 °C`), and figure captions (`Fig. 01 · Barra principal`).

### Optical Thickening When Commercial Font Only Ships `300` & `800`
When a locked brand typeface in the repo only bundles extreme demo weights (ExtraLight `300` and Heavy `800`, with no `400` Regular/Book file):
- **Never** substitute an unrelated external serif/sans fallback for body or mobile menu text.
- Keep the locked brand font on `font-weight: 300` and optically thicken it to a crisp Book weight (~`400`–`450`) using:
  ```css
  body {
    font-family: var(--font-brand);
    font-weight: 300;
    -webkit-text-stroke: 0.30px currentColor; /* 0.35px on mobile < 768px */
  }
  b, strong, .weight-heavy {
    font-weight: 800;
    -webkit-text-stroke: 0; /* Mandatory reset so 800 spans never over-thicken */
  }
  ```

---

## 3. Native Photo Aspect Ratios & Live POS / Social DB Anchoring

- **Respect Native `2:3` / `3:4` Vertical Photography:**
  Never amputate vertical portrait photography (`2:3` or `3:4`) into thin horizontal `object-fit: cover` strips or slap Canva-style rounded pill badges on top of photos. Frame photographs at their native vertical aspect ratio as full-bleed or inset gallery prints with a quiet `Fig. 01 · ...` tabular-mono caption underneath.
- **Anchor Every Fact in Live POS + Social DB Data:**
  Before writing menu rows, prices, or operating hours, query the venue's live POS and analytics tables (`core.products`, `core.transactions` day-of-week/hour percentiles, and `core.meta_media_insights` captions) instead of copying stale static HTML:
  - List every active product with its exact current price.
  - Reflect true operating days and opening/closing hours.
  - Ground headlines in physical truths of the bar (local altitude boiling point, espresso extraction temperature range, morning batch bake times vs made-to-order kitchen items).

---

## 4. Mexican Spanish (`es-MX`) ↔ English Specialty Coffee Precision & Schema Hygiene

### Culinary & Barista Terminology Bans
- **Mexican Spanish (`es-MX`):**
  - Never write literal anglicisms *"doble tiro"* or *"doble shot"* → always use **`espresso doble`** and **`espresso extra`**.
  - Never call specialty coffee *"café de primera"* or *"SOLO 1ª"* (which denotes commercial commodity grade in Mexico) → always use **`café de especialidad`**.
  - Separate morning batch baking from made-to-order kitchen prep: *"pan horneado cada mañana y cocina al momento"*.
  - Use natural local address phrasing: *"Visítanos en Revolución"* (never redundant *"en la colonia Revolución"* when the avenue/neighborhood is self-evident locally).
- **English (`en`) False-Friend Bans:**
  - Never translate *"alrededor de una mesa de café"* as *"around a coffee table"* (living-room furniture) → use **`gathered over coffee`** / **`when we gather over coffee`**.
  - Never translate *"pan dulce"* as *"sweet bread"* (collides with *sweetbreads* / offal) → use **`freshly baked pastries`**.
  - Never translate *"hogaza"* as *"sourdough"* unless masa madre is verified → use **`country-loaf bread`**.
  - Use **`On the bar today`** (never insider jargon *"On bar today"*).

### Unambiguous Menu Rows, Schema.org `MenuItem` & Zero `em-dash`
- **One Price Point Per Leader-Dot Row:** Never combine differently priced items on a single row (`Taro / Matcha ···· $70 / $65`). Split distinct price points onto separate rows so leader dots map 1-to-1 to a single tabular numeral.
- **Schema.org `JSON-LD` Hygiene:** Every `MenuItem` `offers` node must carry a single numeric `"price"` (no slashes or strings like `"70/65"`), real JSON booleans (`false`, never `"False"`), and a real `1200×630` photograph for `og:image`.
- **Zero `em-dash` (`—`) & Anti-AI Voice Gate:** Purge every `—` (U+2014) across prose, `Fig. 01 · ...` captions, `<title>`, `og:title`, `alt` attributes, and `llms-full.txt` (replace with `.`, `:`, or `·`). Split compound sentences `> 22` words and run a `tlahcuilo` 2-round debate (`Claude Opus ⇄ Grok`) before shipping final copy.
