# House Pack: "Instrument B2B" — Tactile Workbenches for Operational SaaS

Load this pack whenever designing, sketching, or auditing landing pages, interactive product showcases, or marketing walkthroughs for operational B2B SaaS, POS, ERP, fintech, inventory, or developer tools.

---

## 1. Break the "AI SaaS Card Grid" Reflex

When showcasing a multi-module operational platform (POS, ERP, kitchen/floor operations, financial ledgers), **never** reach for the default LLM B2B layout:
- **Ban the Sidebar-Pills + 2×2 Card Grid Skeleton:** Never build a vertical sidebar list of rounded feature pills next to a square container holding a static 2×2 card grid.
- **Ban Speculative ROI / Leakage Calculators:** Drop naive sliders that multiply arbitrary percentage "leakage" guesses against gross revenue. Operational buyers distrust invented math; they trust seeing the actual instrument handle a real shift.
- **Replace Feature Grids with Tactile, Time- or Role-Driven Instruments:** Let the visitor scrub through a real operating day or inspect live state propagation across physical and digital surfaces.

---

## 2. Archetype A: Chronometer / Time-Dial Workbench

Use a full-bleed dark or high-contrast instrument stage driven by operating time:

### Anatomical Rules
1. **Watermark Clock & Live Cumulative Financial Ticker:**
   Anchor the stage with a giant low-opacity background watermark clock (`16:42` in `font-variant-numeric: tabular-nums`) and a live cumulative financial/shift ticker in the top bar that updates deterministically as the user scrubs through the day.
2. **Top Millimeter-Tick Time-Ruler Scrubber (Above the Fold):**
   Place the horizontal millimeter-tick time-ruler (`07:15 AM` → `10:30 PM` with discrete shift stops like `07:15 Recepción a Ciegas`, `13:20 Hora Pico`, `16:42 Lealtad en Caja`, `22:30 Corte Z`) **directly below the section header**. Never bury the time scrubber below the stage where it falls below the fold on `1440×900` viewports.
3. **Spacious 2-Column Reactive Stage (Never a Crowded 3-Column Static Layout):**
   Never crowd static module summary cards beside a static wallet pass in 3 columns. Use a strict **2-column workbench**:
   - **Left Column (Narrative + Physical 80mm Serrated Thermal Slip):** Displays the active hour's operational story above a tactile, 80mm serrated thermal paper receipt/slip (`clip-path` or radial-gradient serrated top/bottom teeth, tabular monospace lines, exact timestamps, and audit hash) that reprints for the selected hour.
   - **Right Column (100% Reactive Unified Console + 3 Automatic Ripple Effects):** Both the primary interactive surface **and** the 3 downstream system ripple indicators below it must **change 100% on every hour stop** — e.g., switching from a **Kitchen Blind Receiving (`Recepción a Ciegas`)** count sheet at `07:15` to a **Live Floor/Bar Waterfall** at `13:20`, to an interactive **Phone Digital Wallet Pass** at `16:42`, to an **Automated Z-Cut Reconciliation Ledger** at `22:30`.

---

## 3. Archetype B: Split-Flap / Swiss Timetable

When the brief calls for an architectural, brutalist, or high-density schedule posture on a light or mineral canvas:
- **2px Solid Ink Borders & Hard Offset Shadow:** Frame the primary schedule deck in `border: 2px solid var(--fg-default)` with a crisp structural offset shadow (`box-shadow: 12px 12px 0 var(--fg-default)` or dark ink token — zero blurry elevation).
- **Mechanical Split-Flap Clock Header:** Pair a tabular split-flap timestamp header with a horizontal shift matrix where clicking any row opens a **3-column live inspection deck** below (1: Physical Trigger, 2: State Mutation / Ledger Entry, 3: Operator Verification).

---

## 4. Embedded Product Walkthroughs & Source-Code Fidelity

When embedding an interactive product walkthrough inside an existing application repository (`apps/web`):
- **Self-Contained Bundle (Zero Store/API Bloat):** Keep landing showcase components self-contained (do not import live Pinia/Redux stores or authenticated API clients into the public landing bundle).
- **100% Token & Component Anatomy Mirroring:** Mirror the exact CSS custom properties, badge classes, domain terminology, and state colors of the real authenticated product views (e.g., `state-available` vs `state-occupied`, real waterfall stages, real station chips). Never replace real product anatomy with generic schematic boxes or invert semantic status colors.

---

## 5. Strict Copy, Glyph & Trademark Hygiene

- **Zero Emojis or Unicode Dingbats (`EMOJI_OR_DINGBAT`):**
  Never use emojis or decorative Unicode glyphs (`🔒`, `★`, `✓`, `✦`, `●`, `🚀`) in templates, locale JSON catalogs, or CSS `::before { content: '●' }`. Use plain typographic status labels (`Oculto`, `Confirmado`, `Cuadre Exacto`) and pure CSS geometric shapes (`width: 6px; height: 6px; border-radius: 50%; background: currentColor`) for status LEDs.
- **Trademark-Free Generic Hardware & Wallet Terminology:**
  Never use third-party hardware or OS trademarks (`Apple Wallet`, `Google Wallet`, `iPad`, `iPhone`, `Android`) in UI copy, marketing mockups, or architectural diagrams. Always use generic, platform-neutral terms:
  - **`billetera digital del celular`** / **`digital phone wallet`** (instead of Apple/Google Wallet).
  - **`tableta`** / **`tablet`** and **`celular`** / **`smartphone`** (instead of iPad/iPhone/Android).
- **Zero `em-dash` (`—`) & Zero Slop Buzzwords:**
  Purge all `—` (U+2014) characters and banned marketing buzzwords (`revolutionize`, `unleash`, `supercharge`, `game-changer`, `seamlessly`, `elevate your`). Lead every headline with concrete operational mechanics.
