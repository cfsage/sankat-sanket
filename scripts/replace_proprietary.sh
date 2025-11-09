#!/usr/bin/env bash
# scripts/replace_proprietary.sh
# Utility script to detect and (optionally) replace proprietary map APIs with open-source alternatives.
# NOTE: Run with caution; review changes before committing.
#
# Usage:
#   bash scripts/replace_proprietary.sh [--apply]
# If --apply is passed, automatic sed replacements will be executed.

set -euo pipefail

# Patterns to look for (case-insensitive)
declare -a PATTERNS=(
  "google\.maps"
  "maps\.googleapis\.com"
  "Mapbox"
  "mapbox\.com"
  "api\.mapbox\.com"
  "\.getMapbox.*"
  "StreetViewPanorama"
  "\.googleapis\.com/maps/api/geocode"
)

SEARCH_PATH="${1:-.}"
APPLY=false

if [[ "${1:-}" == "--apply" ]]; then
  APPLY=true
  echo "[INFO] Running in APPLY mode – replacements will be written."
  shift
fi

# Detect files
for pattern in "${PATTERNS[@]}"; do
  echo "\n[CHECK] Searching for pattern: $pattern"
  grep -RIn --exclude-dir={node_modules,.git,.next,out,.turbo} -e "$pattern" "$SEARCH_PATH" || true
done

echo "\n[INFO] Detection finished."

if $APPLY; then
  echo "\n[INFO] Applying safe sed replacements..."
  # Example: replace Mapbox tile URL with OSM
  find "$SEARCH_PATH" -type f -not -path "*/node_modules/*" -print0 | \
    xargs -0 sed -i 's#https://api\.mapbox\.com/styles/v1/[^"']\+#https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png#g'
  echo "[INFO] Replacements complete. Review git diff before committing."
fi