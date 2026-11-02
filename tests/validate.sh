#!/usr/bin/env bash
# Contract & budget validation suite for toltecatl.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKILL_DIR="$ROOT/skills/toltecatl"
SCRIPTS_DIR="$SKILL_DIR/scripts"

pass() { echo "  ✓ $1"; }
fail() { echo "  ✗ $1" >&2; exit 1; }

echo "▸ [1/5] Validating SKILL.md router metadata & budget..."
SKILL_MD="$SKILL_DIR/SKILL.md"
[ -f "$SKILL_MD" ] || fail "Missing $SKILL_MD"
grep -qE '^name:[[:space:]]*toltecatl[[:space:]]*$' "$SKILL_MD" || fail "SKILL.md missing 'name: toltecatl'"
grep -qE '^description:' "$SKILL_MD" || fail "SKILL.md missing 'description:'"

skill_lines="$(wc -l < "$SKILL_MD" | tr -d ' ')"
skill_bytes="$(wc -c < "$SKILL_MD" | tr -d ' ')"
[ "$skill_lines" -le 150 ] || fail "SKILL.md exceeds 150 lines ($skill_lines lines)"
[ "$skill_bytes" -lt 6500 ] || fail "SKILL.md exceeds 6500 bytes ($skill_bytes bytes)"
pass "SKILL.md exists, valid frontmatter, ${skill_lines} lines (${skill_bytes} bytes)"

echo "▸ [2/5] Validating ceremonies, lenses, and house packs..."
REQUIRED_DOCS=(
  "ceremonies/audit.md"
  "ceremonies/explore.md"
  "ceremonies/handoff.md"
  "lenses/hierarchy-states.md"
  "lenses/physics-tactility.md"
  "house/anti-rgb-and-svg-geometry.md"
  "house/hoja-de-barra.md"
  "house/instrument-b2b.md"
)
for rel in "${REQUIRED_DOCS[@]}"; do
  f="$SKILL_DIR/$rel"
  [ -f "$f" ] || fail "Missing $rel"
  lines="$(wc -l < "$f" | tr -d ' ')"
  [ "$lines" -le 200 ] || fail "$rel exceeds 200 lines ($lines lines)"
  pass "$rel (${lines} lines <= 200)"
done

echo "▸ [3/5] Validating ui-gate.mjs against clean & dirty fixtures..."
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
)
for rule in "${EXPECTED_RULES[@]}"; do
  echo "$dirty_out" | grep -q "$rule" || fail "dirty.html output missing expected rule ID: $rule"
done
pass "ui-gate.mjs --strict-house exited 1 on dirty.html and caught: ${EXPECTED_RULES[*]}"

echo "▸ [4/5] Validating ref-dealer.mjs commands and < 3000 byte budgets..."
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

echo "▸ [5/5] Validating dom-probe.mjs --help and install.sh --help..."
node "$SCRIPTS_DIR/dom-probe.mjs" --help >/dev/null
pass "dom-probe.mjs --help exited 0"

help_out="$(bash "$ROOT/install.sh" --help)"
echo "$help_out" | grep -q "install.sh" || fail "install.sh --help missing usage text"
pass "install.sh --help exited 0"

echo ""
echo "All toltecatl contract checks passed."
