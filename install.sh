#!/usr/bin/env bash
# Installs scrumboard-cli: clones the repo, installs dependencies and the
# Chromium build Playwright needs, then links the `scrumboard` command onto
# your PATH.
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/ethanelliot/scrumboard-cli/main/install.sh | bash
#
# Re-running this script later updates an existing install in place.

set -euo pipefail

REPO_URL="https://github.com/ethanelliot/scrumboard-cli.git"
INSTALL_DIR="${SCRUMBOARD_INSTALL_DIR:-$HOME/.scrumboard-cli/src}"

info() { printf '\033[1;34m==>\033[0m %s\n' "$1"; }
error() { printf '\033[1;31mError:\033[0m %s\n' "$1" >&2; }

require() {
  if ! command -v "$1" >/dev/null 2>&1; then
    error "\`$1\` is required but wasn't found on your PATH."
    exit 1
  fi
}

require git
require node
require npm

node_major="$(node -e 'console.log(process.versions.node.split(".")[0])')"
if [ "$node_major" -lt 18 ]; then
  error "Node.js >= 18 is required (found $(node -v))."
  exit 1
fi

if [ -d "$INSTALL_DIR/.git" ]; then
  info "Updating existing install in $INSTALL_DIR"
  git -C "$INSTALL_DIR" pull --ff-only
else
  info "Cloning scrumboard-cli into $INSTALL_DIR"
  mkdir -p "$(dirname "$INSTALL_DIR")"
  git clone "$REPO_URL" "$INSTALL_DIR"
fi

cd "$INSTALL_DIR"

info "Installing dependencies"
npm install

info "Installing Chromium for Playwright"
npm run install-browser

info "Linking the scrumboard command"
if npm link 2>/dev/null; then
  :
else
  info "npm link needs elevated permissions, retrying with sudo"
  sudo npm link
fi

echo
info "Done! Try: scrumboard login"
