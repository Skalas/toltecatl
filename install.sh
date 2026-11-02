#!/usr/bin/env bash
# Installer for the `toltecatl` UI/UX & Design Engineering skill.
#
#   ./install.sh --user              install at user level for Claude, Codex/Grok, Cursor, Hermes
#                                    (~/.claude/skills, ~/.agents/skills, ~/.cursor/skills,
#                                    ~/.hermes/skills/creative)
#   ./install.sh --project [PATH]    install into a project's skill roots
#                                    (.claude/skills, .agents/skills, .cursor/skills)
#   ./install.sh --link [--user|--project [PATH]]
#                                    symlink the checkout instead of copying so edits
#                                    in the repo take effect immediately
#   ./install.sh --update [...]      refresh an installed copy to this version
#   ./install.sh --retire-legacy     archive overlapping legacy design skills
#                                    (impeccable, design-taste, taste-skill, emil-design-eng)
#                                    into ~/.toltecatl/archived-skills/ so they do not
#                                    auto-trigger during normal metate coding sprints
#   ./install.sh --help              show this help message and exit 0
#
# Default scope is --user.
set -euo pipefail

REPO_URL="${TOLTECATL_REPO:-https://github.com/Skalas/toltecatl.git}"
REPO_REF="${TOLTECATL_REF:-main}"
SCOPE="user"
PROJECT="$PWD"
UPDATE=0
LINK=0
RETIRE_LEGACY=0

SELF="${BASH_SOURCE[0]:-$0}"
SELF_DIR="$(cd "$(dirname "$SELF")" 2>/dev/null && pwd || true)"
SRC=""
LOCAL_CHECKOUT=0
case "$SELF" in
  bash|dash|sh|-|*stdin*|*fd/*) ;;
  *)
    if [ -f "$SELF" ] && [ -r "$SELF" ] && [ "$(basename "$SELF")" = "install.sh" ] \
        && [ -n "${SELF_DIR:-}" ] && [ -d "$SELF_DIR/skills/toltecatl" ]; then
      LOCAL_CHECKOUT=1
    fi
    ;;
esac
[ "$LOCAL_CHECKOUT" -eq 1 ] && SRC="$SELF_DIR/skills"

while [ $# -gt 0 ]; do
  case "$1" in
    --user)           SCOPE="user"; shift ;;
    --project)        SCOPE="project"; shift; [ $# -gt 0 ] && [[ "$1" != --* ]] && { PROJECT="$1"; shift; } ;;
    --update)         UPDATE=1; shift ;;
    --link)           LINK=1; shift ;;
    --retire-legacy)  RETIRE_LEGACY=1; shift ;;
    -h|--help)
      if [ -r "$SELF" ]; then
        sed -n '2,19p' "$SELF"
      else
        echo "usage: install.sh [--user | --project [PATH]] [--link] [--update] [--retire-legacy]"
      fi
      exit 0
      ;;
    *) echo "unknown arg: $1" >&2; exit 1 ;;
  esac
done

if [ -z "$SRC" ]; then
  [ "$LINK" -eq 1 ] && { echo "--link requires a local checkout (nothing to link to)" >&2; exit 1; }
  command -v git >/dev/null 2>&1 || { echo "git is required to install from GitHub" >&2; exit 1; }
  echo "▸ fetching toltecatl ($REPO_REF) from $REPO_URL"
  TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
  git clone --depth 1 --branch "$REPO_REF" "$REPO_URL" "$TMP/toltecatl" >/dev/null 2>&1 \
    || { echo "clone failed: $REPO_URL ($REPO_REF)" >&2; exit 1; }
  SRC="$TMP/toltecatl/skills"
fi

install_skill_into() { # $1 = destination parent directory
  local root="$1"
  mkdir -p "$root"
  local dir="$SRC/toltecatl"
  local dest="$root/toltecatl"
  rm -rf "$dest"
  if [ "$LINK" -eq 1 ]; then
    ln -s "$dir" "$dest"
    echo "  ✓ toltecatl → $dest (symlink → $dir)"
  else
    cp -R "$dir" "$dest"
    chmod +x "$dest/scripts/"*.mjs 2>/dev/null || true
    echo "  ✓ toltecatl → $dest"
  fi
}

retire_legacy_skills() {
  local archive_root="$HOME/.toltecatl/archived-skills"
  local legacy_names=("impeccable" "design-taste" "taste-skill" "emil-design-eng")
  local search_roots=(
    "$HOME/.claude/skills"
    "$HOME/.agents/skills"
    "$HOME/.hermes/skills/creative"
  )
  mkdir -p "$archive_root"
  echo "▸ retiring overlapping auto-triggering design skills into $archive_root"
  local moved=0
  for sroot in "${search_roots[@]}"; do
    [ -d "$sroot" ] || continue
    local surface_label
    surface_label="$( echo "$sroot" | sed "s|$HOME/||;s|/|_|g" )"
    for skill in "${legacy_names[@]}"; do
      local candidate="$sroot/$skill"
      if [ -e "$candidate" ] || [ -L "$candidate" ]; then
        local target_dir="$archive_root/${surface_label}__${skill}"
        rm -rf "$target_dir"
        mv "$candidate" "$target_dir"
        echo "  ✓ archived $candidate → $target_dir"
        moved=$((moved + 1))
      fi
    done
  done
  if [ "$moved" -eq 0 ]; then
    echo "  – no active legacy skills found to archive"
  fi
}

VERB="installing"
[ "$UPDATE" -eq 1 ] && VERB="updating"
[ "$LINK" -eq 1 ] && VERB="linking"

if [ "$SCOPE" = "user" ]; then
  echo "▸ $VERB toltecatl at USER level"
  install_skill_into "$HOME/.claude/skills"
  install_skill_into "$HOME/.agents/skills"
  if [ -d "$HOME/.cursor" ]; then
    install_skill_into "$HOME/.cursor/skills"
  fi
  if [ -d "$HOME/.hermes/skills" ]; then
    install_skill_into "$HOME/.hermes/skills/creative"
  fi
else
  echo "▸ $VERB toltecatl into PROJECT: $PROJECT"
  install_skill_into "$PROJECT/.claude/skills"
  install_skill_into "$PROJECT/.agents/skills"
  if [ -d "$PROJECT/.cursor" ]; then
    install_skill_into "$PROJECT/.cursor/skills"
  fi
fi

if [ "$RETIRE_LEGACY" -eq 1 ]; then
  retire_legacy_skills
fi

echo ""
echo "Toltecatl ready. Invoke explicitly with /toltecatl (audit | explore | handoff)."
