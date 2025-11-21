#!/bin/bash
# Script to install git hooks from the hooks/ directory to .git/hooks/

HOOKS=(commit-msg pre-push)
REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
GIT_DIR="$REPO_ROOT/.git"

for hook in "${HOOKS[@]}"; do
  src="$REPO_ROOT/hooks/$hook"
  dest="$GIT_DIR/hooks/$hook"
  if [ -f "$src" ]; then
    cp "$src" "$dest"
    chmod +x "$dest"
    echo "Installed $hook hook."
  fi
done
