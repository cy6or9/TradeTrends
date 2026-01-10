#!/bin/bash
# Netlify build ignore script
# Purpose: Only build on main branch, skip all other branches (including content)
#
# Exit codes:
#   0 = Skip build (Netlify will not deploy)
#   1 = Proceed with build

BRANCH="${BRANCH:-main}"

echo "────────────────────────────────────────"
echo "Netlify Build Ignore Check"
echo "────────────────────────────────────────"
echo "Branch: $BRANCH"

if [ "$BRANCH" != "main" ]; then
  echo "Status: SKIPPING build (only main branch triggers builds)"
  echo "Reason: Content edits in non-main branches don't need deployment"
  echo "────────────────────────────────────────"
  exit 0  # Skip build
fi

echo "Status: PROCEEDING with build (main branch)"
echo "────────────────────────────────────────"
exit 1  # Do not skip (proceed with build)
