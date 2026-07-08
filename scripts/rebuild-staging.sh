#!/usr/bin/env bash
#
# rebuild-staging.sh
#
# 1. Backs up /home/solidos to /home/solidos.bak
# 2. Removes /home/solidos
# 3. Clones the `staging` branch of every package listed in solid-panes'
#    `solidosDependencies` (except rdflib), plus mashlib, from github.com/solidos
# 4. Builds each package in dependency order, npm-linking the local checkouts
#    of its own `solidosDependencies` (except rdflib) before building.
#
# Exits immediately on the first failure (set -e). Every step's output is
# both printed live AND saved to a per-package log file, and a single
# timestamped status.log records progress so you can see exactly how far
# the run got and where/why it failed:
#
#   tail -f /home/solidos/logs/status.log     # live progress, in another shell
#   cat /home/solidos/logs/<package>.log      # full output of one package
#
# On failure, a colored summary table plus the last lines of the failing
# package's log are printed automatically.

set -euo pipefail

SOLIDOS_HOME="/home/solidos"
SOLIDOS_BACKUP="/home/solidos.bak"
ORG_URL="https://github.com/solidos"
BRANCH="staging"
LOG_DIR="$SOLIDOS_HOME/logs"
STATUS_FILE="$LOG_DIR/status.log"

# ntfy.sh notifications - set NTFY_TOPIC (e.g. in the environment, or edit the
# default below) to a long/random topic name, since public ntfy.sh topics are
# unauthenticated: anyone who knows the name can read or publish to it.
NTFY_TOPIC="${NTFY_TOPIC:-solidos-staging-CHANGE-ME}"
NTFY_URL="https://ntfy.sh/$NTFY_TOPIC"

# notify <title> <priority> <message> -- best-effort, never fails the script
notify() {
  curl -fsS -H "Title: $1" -H "Priority: $2" -d "$3" "$NTFY_URL" >/dev/null 2>&1 || true
}

# notify_attach <file-path> <display-name> -- best-effort, never fails the script
notify_attach() {
  [ -f "$1" ] || return 0
  curl -fsS -T "$1" -H "Filename: $2" "$NTFY_URL" >/dev/null 2>&1 || true
}

RED=$'\033[0;31m'
GREEN=$'\033[0;32m'
YELLOW=$'\033[0;33m'
NC=$'\033[0m'

# All packages to clone: solid-panes' solidosDependencies (minus rdflib) + mashlib
PACKAGES=(
  solid-logic
  pane-registry
  solid-ui
  activitystreams-pane
  chat-pane
  contacts-pane
  folder-pane
  issue-pane
  meeting-pane
  source-pane
  profile-pane
  solid-panes
  mashlib
)

# Build order, respecting the dependency graph:
#   solid-logic -> pane-registry -> solid-ui
#     -> individual panes that depend on solid-ui (chat-pane before profile-pane,
#        since profile-pane depends on chat-pane)
#     -> solid-panes (aggregates all panes)
#     -> mashlib (bundles solid-panes + solid-ui)
BUILD_ORDER=(
  solid-logic
  pane-registry
  solid-ui
  activitystreams-pane
  chat-pane
  contacts-pane
  folder-pane
  issue-pane
  meeting-pane
  source-pane
  profile-pane
  solid-panes
  mashlib
)

declare -A STATUS
for pkg in "${BUILD_ORDER[@]}"; do STATUS[$pkg]="pending"; done

CURRENT_PKG=""
CURRENT_STEP=""

log_status() {
  # log_status <pkg> <message>  -- appended to status.log, and echoed live
  local line
  line="$(date '+%H:%M:%S') [$1] $2"
  mkdir -p "$LOG_DIR"
  echo "$line" >> "$STATUS_FILE"
  echo "$line"
}

print_summary() {
  echo
  echo "================= BUILD SUMMARY ==================="
  for pkg in "${BUILD_ORDER[@]}"; do
    local st="${STATUS[$pkg]}"
    case "$st" in
      ok)      printf "  %s✔ %-20s OK%s\n" "$GREEN" "$pkg" "$NC" ;;
      pending) printf "  %s… %-20s pending%s\n" "$YELLOW" "$pkg" "$NC" ;;
      *)       printf "  %s✘ %-20s %s%s\n" "$RED" "$pkg" "$st" "$NC" ;;
    esac
  done
  echo "====================================================="
  echo "Full per-package logs: $LOG_DIR/<package>.log"
  echo "Progress timeline:     $STATUS_FILE"
}

on_error() {
  local line="$1"
  STATUS[$CURRENT_PKG]="FAILED (${CURRENT_STEP:-unknown}, line $line)"
  log_status "$CURRENT_PKG" "FAILED during ${CURRENT_STEP:-unknown} step (line $line)" >&2
  local log="$LOG_DIR/$CURRENT_PKG.log"
  if [ -f "$log" ]; then
    echo >&2
    echo "----- last 40 lines of $log -----" >&2
    tail -n 40 "$log" >&2
    echo "----------------------------------------------------" >&2
  fi
  print_summary | tee -a "$STATUS_FILE" >&2
  if [ -f "$log" ]; then
    {
      echo
      echo "----- full log of failing package: $CURRENT_PKG -----"
      cat "$log"
      echo "----------------------------------------------------"
    } >> "$STATUS_FILE"
  fi
  notify "SolidOS staging rebuild FAILED" "high" "Failed on $CURRENT_PKG during ${CURRENT_STEP:-unknown} step (line $line)"
  notify_attach "$STATUS_FILE" "status.log"
  exit 1
}
trap 'on_error $LINENO' ERR

# --- Step 1 & 2: backup and remove existing /home/solidos ---------------
echo "==> Backing up $SOLIDOS_HOME to $SOLIDOS_BACKUP"
if [ -d "$SOLIDOS_HOME" ]; then
  rm -rf "$SOLIDOS_BACKUP"
  mv "$SOLIDOS_HOME" "$SOLIDOS_BACKUP"
fi
rm -rf "$SOLIDOS_HOME"
mkdir -p "$SOLIDOS_HOME" "$LOG_DIR"
: > "$STATUS_FILE"

# --- Step 3: clone staging branch of every package -----------------------
echo "==> Cloning '$BRANCH' branch for ${#PACKAGES[@]} packages"
for pkg in "${PACKAGES[@]}"; do
  CURRENT_PKG="$pkg"
  CURRENT_STEP="clone"
  log="$LOG_DIR/$pkg.log"
  : > "$log"
  log_status "$pkg" "cloning ($BRANCH)"
  { git clone --branch "$BRANCH" --single-branch "$ORG_URL/$pkg.git" "$SOLIDOS_HOME/$pkg"; } 2>&1 | tee -a "$log"
  log_status "$pkg" "cloned"
done

# Reads a package's own solidosDependencies (minus rdflib) as a space-separated list
get_link_deps() {
  local pkg_dir="$1"
  node -e "
    const pkg = require('$pkg_dir/package.json');
    const deps = pkg.solidosDependencies || [];
    console.log(deps.filter((d) => d !== 'rdflib').join(' '));
  "
}

# True (exit 0) if a package's own solidosDependencies lists rdflib
depends_on_rdflib() {
  local pkg_dir="$1"
  node -e "
    const pkg = require('$pkg_dir/package.json');
    const deps = pkg.solidosDependencies || [];
    process.exit(deps.includes('rdflib') ? 0 : 1);
  "
}

# The actual npm package name (may differ from the checkout folder name)
get_pkg_name() {
  node -p "require('$1/package.json').name"
}

# NOTE on symlinking: `npm link` internally runs a full Arborist reify, which
# crashes ("Cannot read properties of null (reading 'package'/'edgesOut')")
# on packages like solid-panes/mashlib that use self-referencing overrides
# (e.g. "solid-ui": "$solid-ui"). Avoid `npm link` entirely and manage the
# global-link symlinks by hand instead - same net effect, no Arborist involved.
NPM_GLOBAL_ROOT="$(npm root -g)"
mkdir -p "$NPM_GLOBAL_ROOT"

# NOTE on shared third-party deps: packages like solid-ui depend on
# @awesome.me/webawesome, which self-registers custom elements (e.g.
# wa-popup) at import time. Panes that list solid-ui only as a
# devDependency (contacts-pane, etc.) still get their own real, hoisted
# copy of webawesome installed by `npm install` before the solidosDependencies
# symlink step overwrites their node_modules/solid-ui - and that leftover
# copy is never cleaned up. The result is two physically distinct copies of
# webawesome on disk (one under solid-ui/node_modules, one under the pane's
# own node_modules), which webpack bundles as two separate chunks in mashlib,
# each re-registering the same custom element and crashing at runtime.
# Fix: force every other package's copy of these shared deps to be a symlink
# to solid-ui's single canonical copy.
CANONICAL_DEDUPE_PKG="solid-ui"
SHARED_DEDUPE_DEPS=("@awesome.me/webawesome")

dedupe_shared_deps() {
  local pkg_dir="$1"
  local canonical_dir="$SOLIDOS_HOME/$CANONICAL_DEDUPE_PKG"
  local dep dep_path canonical_path
  for dep in "${SHARED_DEDUPE_DEPS[@]}"; do
    canonical_path="$canonical_dir/node_modules/$dep"
    [ -e "$canonical_path" ] || continue
    dep_path="$pkg_dir/node_modules/$dep"
    [ -e "$dep_path" ] || continue
    if [ -L "$dep_path" ] && [ "$(readlink -f "$dep_path")" = "$(readlink -f "$canonical_path")" ]; then
      continue
    fi
    echo "deduping $dep -> $canonical_path"
    rm -rf "$dep_path"
    mkdir -p "$(dirname "$dep_path")"
    ln -sfn "$canonical_path" "$dep_path"
  done
}

# --- Step 4: link + build in dependency order -----------------------------
echo "==> Building packages in dependency order"
for pkg in "${BUILD_ORDER[@]}"; do
  CURRENT_PKG="$pkg"
  pkg_dir="$SOLIDOS_HOME/$pkg"
  log="$LOG_DIR/$pkg.log"
  cd "$pkg_dir"

  CURRENT_STEP="install"
  log_status "$pkg" "npm install"
  { npm install; } 2>&1 | tee -a "$log"

  if depends_on_rdflib "$pkg_dir"; then
    CURRENT_STEP="update-rdflib"
    log_status "$pkg" "npm install rdflib@latest"
    { npm install rdflib@latest --save-exact; } 2>&1 | tee -a "$log"
  fi

  if [ "$pkg" != "$CANONICAL_DEDUPE_PKG" ]; then
    CURRENT_STEP="dedupe-shared-deps"
    log_status "$pkg" "deduping shared deps against $CANONICAL_DEDUPE_PKG"
    { dedupe_shared_deps "$pkg_dir"; } 2>&1 | tee -a "$log"
  fi

  link_deps="$(get_link_deps "$pkg_dir")"
  if [ -n "$link_deps" ]; then
    CURRENT_STEP="link"
    log_status "$pkg" "linking local packages: $link_deps"
    {
      mkdir -p "$pkg_dir/node_modules"
      for dep in $link_deps; do
        echo "linking $dep -> $NPM_GLOBAL_ROOT/$dep"
        rm -rf "$pkg_dir/node_modules/$dep"
        ln -sfn "$NPM_GLOBAL_ROOT/$dep" "$pkg_dir/node_modules/$dep"
      done
    } 2>&1 | tee -a "$log"
  fi

  CURRENT_STEP="build"
  log_status "$pkg" "npm run build"
  { npm run build; } 2>&1 | tee -a "$log"

  CURRENT_STEP="self-link"
  pkg_name="$(get_pkg_name "$pkg_dir")"
  log_status "$pkg" "registering $pkg_name globally"
  {
    echo "linking $NPM_GLOBAL_ROOT/$pkg_name -> $pkg_dir"
    ln -sfn "$pkg_dir" "$NPM_GLOBAL_ROOT/$pkg_name"
  } 2>&1 | tee -a "$log"

  STATUS[$pkg]="ok"
  log_status "$pkg" "OK"
done

print_summary | tee -a "$STATUS_FILE"
echo
echo "==> All packages cloned and built successfully"
notify "SolidOS staging rebuild OK" "default" "All ${#BUILD_ORDER[@]} packages built successfully."
notify_attach "$STATUS_FILE" "status.log"
