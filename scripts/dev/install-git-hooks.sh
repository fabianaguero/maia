#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

chmod +x .githooks/pre-commit .githooks/pre-push
git config core.hooksPath .githooks

echo "[maia] installed git hooks at .githooks"
echo "[maia] pre-commit -> make quality-pre-commit"
echo "[maia] pre-push   -> make quality-pre-push"
