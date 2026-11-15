#!/data/data/com.termux/files/usr/bin/bash
# Nicominecith Poster: pushes this folder to a NEW GitHub repo from Termux.
# Usage: bash termux-upload.sh [repo-name]
set -e
REPO="${1:-nicominecith-poster}"
pkg install -y git gh >/dev/null 2>&1 || true
cd "$(dirname "$0")"
git config --global user.name "Nicominecith_clips"
git config --global user.email "${GIT_EMAIL:-nicominecith@users.noreply.github.com}"
gh auth status >/dev/null 2>&1 || gh auth login
[ -d .git ] || git init -b main
git add -A
git commit -m "Nicominecith Poster: auto covers, settings, mobile layout" || true
gh repo create "$REPO" --public --source=. --remote=origin --push
echo "Fertig: https://github.com/$(gh api user -q .login)/$REPO"
