#!/usr/bin/env bash
#
# Push this repo to GitHub and print the Pages URL.
#
# Usage:  ./setup-github.sh [repo-name]
#
# Requires the GitHub CLI (`gh`) to be installed and authenticated:
#   https://cli.github.com/  then  gh auth login
#
set -euo pipefail

GITHUB_USER="ngcodingtn-create"
REPO_NAME="${1:-smart-food-scale}"
BRANCH="main"

say() { printf '\033[1;36m==>\033[0m %s\n' "$*"; }
die() { printf '\033[1;31mERROR:\033[0m %s\n' "$*" >&2; exit 1; }

command -v git >/dev/null || die "git is not installed."
command -v gh  >/dev/null || die "GitHub CLI (gh) is not installed — see https://cli.github.com/"

gh auth status >/dev/null 2>&1 || die "gh is not authenticated. Run: gh auth login"

# ---- Refuse to push secrets -------------------------------------------------
say "Checking that no secrets are staged..."
if git ls-files --cached --others --exclude-standard | grep -E '(^|/)secrets\.h$|(^|/)\.env$' ; then
  die "A secrets file is tracked or untracked-but-unignored. Fix .gitignore before pushing."
fi

# ---- Repo init --------------------------------------------------------------
if [ ! -d .git ]; then
  say "Initialising git repository..."
  git init -b "$BRANCH"
fi

if ! git rev-parse --verify HEAD >/dev/null 2>&1; then
  die "No commits yet. Commit your work before running this script."
fi

# ---- Create the remote if it isn't there ------------------------------------
if git remote get-url origin >/dev/null 2>&1; then
  say "Remote 'origin' already configured: $(git remote get-url origin)"
else
  say "Creating https://github.com/$GITHUB_USER/$REPO_NAME ..."
  # Public, deliberately: GitHub Pages does not publish from a private repo on a
  # free plan, and the docs site is a deliverable. See docs/decisions.md D6.
  gh repo create "$GITHUB_USER/$REPO_NAME" \
    --public \
    --source=. \
    --remote=origin \
    --description="IoT kitchen scale that weighs a meal and returns its macros — ESP32 + FastAPI + React Native"
fi

# ---- Push -------------------------------------------------------------------
say "Pushing $BRANCH..."
git push -u origin "$BRANCH"

# ---- Enable Pages from the repo root ----------------------------------------
say "Enabling GitHub Pages (branch $BRANCH, path /)..."
gh api -X POST "repos/$GITHUB_USER/$REPO_NAME/pages" \
  -f "source[branch]=$BRANCH" \
  -f "source[path]=/" >/dev/null 2>&1 \
  || say "Pages already enabled, or the repo is private on a plan without Pages — check Settings → Pages."

echo
say "Done."
echo "  Repository : https://github.com/$GITHUB_USER/$REPO_NAME"
echo "  Pages site : https://$GITHUB_USER.github.io/$REPO_NAME/"
echo
echo "Pages can take a minute or two to build on the first push."
