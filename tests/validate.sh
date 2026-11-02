#!/usr/bin/env bash
# Contract & budget validation suite for toltecatl.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKILL_DIR="$ROOT/skills/toltecatl"
SCRIPTS_DIR="$SKILL_DIR/scripts"

pass() { echo "  ✓ $1"; }
fail() { echo "  ✗ $1" >&2; exit 1; }

echo "▸ [1/6] Validating SKILL.md router metadata & budget..."
SKILL_MD="$SKILL_DIR/SKILL.md"
[ -f "$SKILL_MD" ] || fail "Missing $SKILL_MD"
grep -qE '^name:[[:space:]]*toltecatl[[:space:]]*$' "$SKILL_MD" || fail "SKILL.md missing 'name: toltecatl'"
grep -qE '^description:' "$SKILL_MD" || fail "SKILL.md missing 'description:'"

skill_lines="$(wc -l < "$SKILL_MD" | tr -d ' ')"
skill_bytes="$(wc -c < "$SKILL_MD" | tr -d ' ')"
[ "$skill_lines" -le 150 ] || fail "SKILL.md exceeds 150 lines ($skill_lines lines)"
[ "$skill_bytes" -lt 6500 ] || fail "SKILL.md exceeds 6500 bytes ($skill_bytes bytes)"
pass "SKILL.md exists, valid frontmatter, ${skill_lines} lines (${skill_bytes} bytes)"

echo "▸ [2/6] Validating ceremonies, lenses, house packs, and templates..."
REQUIRED_DOCS=(
  "ceremonies/audit.md"
  "ceremonies/explore.md"
  "ceremonies/handoff.md"
  "lenses/composition-and-copy.md"
  "lenses/hierarchy-states.md"
  "lenses/physics-tactility.md"
  "house/anti-rgb-and-svg-geometry.md"
  "house/editorial-personal.md"
  "house/hoja-de-barra.md"
  "house/instrument-b2b.md"
  "templates/COMMIT-SHEET.md"
)
for rel in "${REQUIRED_DOCS[@]}"; do
  f="$SKILL_DIR/$rel"
  [ -f "$f" ] || fail "Missing $rel"
  lines="$(wc -l < "$f" | tr -d ' ')"
  [ "$lines" -le 200 ] || fail "$rel exceeds 200 lines ($lines lines)"
  pass "$rel (${lines} lines <= 200)"
done

echo "▸ [3/6] Validating ui-gate.mjs against clean & dirty fixtures..."
UI_GATE="$SCRIPTS_DIR/ui-gate.mjs"
CLEAN_HTML="$ROOT/tests/fixtures/clean.html"
DIRTY_HTML="$ROOT/tests/fixtures/dirty.html"

node "$UI_GATE" --strict-house "$CLEAN_HTML" >/dev/null
pass "ui-gate.mjs --strict-house exited 0 on clean.html"

set +e
dirty_out="$(node "$UI_GATE" --strict-house "$DIRTY_HTML" 2>&1)"
dirty_status=$?
set -e
[ "$dirty_status" -eq 1 ] || fail "Expected ui-gate.mjs to exit 1 on dirty.html, got $dirty_status"

EXPECTED_RULES=(
  "EM_DASH"
  "TRANSITION_ALL"
  "EASE_IN_UI"
  "SCALE_ZERO_ENTRY"
  "OFF_BRAND_CREAM_HEX"
  "EMOJI_OR_DINGBAT"
  "SLOP_BUZZWORDS"
  "SIDE_STRIPE_BORDER"
  "OUTLINE_NONE_UNSAFE"
  "EYEBROW_SPAM"
  "CARD_TEXT_BLOAT"
  "NUMBERED_SCAFFOLDING"
)
for rule in "${EXPECTED_RULES[@]}"; do
  echo "$dirty_out" | grep -q "$rule" || fail "dirty.html output missing expected rule ID: $rule"
done
pass "ui-gate.mjs --strict-house exited 1 on dirty.html and caught: ${EXPECTED_RULES[*]}"

set +e
node "$UI_GATE" /nonexistent/path >/dev/null 2>&1
missing_status=$?
set -e
[ "$missing_status" -eq 2 ] || fail "Expected ui-gate.mjs to exit 2 on a non-existent path, got $missing_status"
pass "ui-gate.mjs exited 2 on a non-existent path"

set +e
node "$UI_GATE" "$CLEAN_HTML" /nonexistent/path >/dev/null 2>&1
mixed_status=$?
set -e
[ "$mixed_status" -eq 2 ] || fail "Expected ui-gate.mjs to exit 2 when any target is missing, got $mixed_status"
pass "ui-gate.mjs exited 2 on a valid + missing path mix"

TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/toltecatl-validate.XXXXXX")"
trap 'rm -rf "$TMP_DIR"' EXIT
SUPPRESS_CSS="$TMP_DIR/suppress.css"
{
  for i in $(seq 1 16); do echo ".filler-$i { color: #111111; }"; done
  echo "/* toltecatl-allow: OFF_BRAND_CREAM_HEX -- deliberate editorial paper canvas */"
  echo ".paper { background: #faf8f5; }"
  echo ".gap { color: #111111; }"
  echo ".drift { background: #f4f1ea; }"
} > "$SUPPRESS_CSS"
supp_json="$(node "$UI_GATE" --json --strict-house "$SUPPRESS_CSS" || true)"
supp_counts="$(printf '%s' "$supp_json" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const r=JSON.parse(s);console.log(r.summary.suppressed+":"+r.summary.fails)})')"
[ "$supp_counts" = "1:1" ] || fail "Expected line-scoped suppression to skip 1 and fail 1 cream hex, got suppressed:fails=$supp_counts"
pass "ui-gate.mjs line-scoped toltecatl-allow suppresses the next line only"

echo "▸ [4/6] Validating ref-dealer.mjs commands and < 3000 byte budgets..."
REF_DEALER="$SCRIPTS_DIR/ref-dealer.mjs"

check_dealer_cmd() {
  local label="$1"
  shift
  local out
  out="$(node "$REF_DEALER" "$@")"
  local bytes
  bytes="$(printf '%s' "$out" | wc -c | tr -d ' ')"
  [ "$bytes" -gt 20 ] || fail "ref-dealer.mjs $label produced empty/tiny output ($bytes bytes)"
  [ "$bytes" -lt 3000 ] || fail "ref-dealer.mjs $label exceeded 3000 bytes ($bytes bytes)"
  pass "ref-dealer.mjs $label succeeded (${bytes} bytes < 3000)"
}

check_dealer_cmd "--list-brands" --list-brands
check_dealer_cmd "--brand linear.app" --brand linear.app
check_dealer_cmd "--list-directions" --list-directions
check_dealer_cmd "--deal 3" --deal 3
check_dealer_cmd "--direction quiet-instrument" --direction quiet-instrument
check_dealer_cmd "--list-palettes" --list-palettes
check_dealer_cmd "--palette white-link-blue" --palette white-link-blue
check_dealer_cmd "--list-types" --list-types
check_dealer_cmd "--type switzer-semibold" --type switzer-semibold
check_dealer_cmd "--deal-system --sector fintech" --deal-system --sector fintech
check_dealer_cmd "--deal 5 (capped at 3)" --deal 5

set +e
node "$REF_DEALER" --deal abc >/dev/null 2>&1
deal_status=$?
set -e
[ "$deal_status" -eq 2 ] || fail "Expected ref-dealer.mjs --deal abc to exit 2, got $deal_status"
pass "ref-dealer.mjs --deal abc exited 2"

echo "▸ [5/6] Validating dom-probe.mjs against the real clean.html fixture..."
node "$SCRIPTS_DIR/dom-probe.mjs" --help >/dev/null
pass "dom-probe.mjs --help exited 0"

TMP_PROBE_DIR="$TMP_DIR/probe"
node "$SCRIPTS_DIR/dom-probe.mjs" "$CLEAN_HTML" --strict --out "$TMP_PROBE_DIR" >/dev/null \
  || fail "dom-probe.mjs --strict failed on clean.html (requires Playwright or a local Chrome/Chromium; set CHROME_PATH)"
PROBE_JSON="$TMP_PROBE_DIR/computed-tree.json"
[ -s "$PROBE_JSON" ] || fail "dom-probe.mjs did not write computed-tree.json"
for shot in 375px.png 768px.png 1440px.png; do
  [ -s "$TMP_PROBE_DIR/$shot" ] || fail "dom-probe.mjs did not write a non-empty $shot"
done
probe_check="$(node -e '
const r = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
const problems = [];
if (!["playwright", "cdp"].includes(r.engine)) problems.push("engine=" + r.engine);
if (r.viewports.length !== 3) problems.push("viewports=" + r.viewports.length);
for (const v of r.viewports) {
  if (!v.horizontalOverflow || v.horizontalOverflow.overflows !== false) problems.push(v.name + " overflows");
  if (!v.proseDensity || typeof v.proseDensity.totalWords !== "number") problems.push(v.name + " missing proseDensity");
  if (!v.composition || typeof v.composition.meanLightness !== "number") problems.push(v.name + " missing composition");
  else if (v.composition.typographicScale.timidScale) problems.push(v.name + " timidScale h1/body=" + v.composition.typographicScale.h1ToBodyRatio);
}
console.log(problems.length ? problems.join("; ") : "ok:" + r.engine);
' "$PROBE_JSON")"
case "$probe_check" in
  ok:*) pass "dom-probe.mjs engine=${probe_check#ok:}, 3 non-empty screenshots, no overflow, proseDensity + composition present" ;;
  *) fail "dom-probe.mjs report invalid: $probe_check" ;;
esac

set +e
node "$SCRIPTS_DIR/dom-probe.mjs" http://127.0.0.1:59999/ --out "$TMP_DIR/unreachable" >/dev/null 2>&1
unreachable_status=$?
set -e
[ "$unreachable_status" -ne 0 ] || fail "dom-probe.mjs exited 0 on an unreachable URL (measured an error page)"
[ ! -e "$TMP_DIR/unreachable/computed-tree.json" ] || fail "dom-probe.mjs wrote computed-tree.json for an unreachable URL"
pass "dom-probe.mjs refused an unreachable URL (exit $unreachable_status, no report)"

echo "▸ [6/6] Validating install.sh --help..."

help_out="$(bash "$ROOT/install.sh" --help)"
echo "$help_out" | grep -q "install.sh" || fail "install.sh --help missing usage text"
pass "install.sh --help exited 0"

echo ""
echo "All toltecatl contract checks passed."
