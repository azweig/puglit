#!/usr/bin/env bash
# Bootstrap a fresh/offline pod's brain by MERGING the latest snapshot into the live DB.
# Safe to run anytime: it UNIONS additive learnings and arbitrates skills by validation score —
# it never clobbers a newer brain (run it on pod start, after psql genetic.sql).
#   env: SVC, BASE (default localhost:3000), SNAPSHOT (file path or URL; else BRAIN_REPO/latest.json)
set -euo pipefail
SVC="${SVC:?set SVC=\$PUGLIT_SERVICE_TOKEN}"
BASE="${BASE:-http://localhost:3000}"
SRC="${SNAPSHOT:-${BRAIN_REPO:-}/latest.json}"
TMP="/tmp/brain-restore.json"

echo "→ fetching snapshot from: $SRC"
case "$SRC" in
  http*) curl -s "$SRC" -o "$TMP" ;;
  *) cp "$SRC" "$TMP" ;;
esac
[ -s "$TMP" ] || { echo "  ✗ empty/missing snapshot"; exit 1; }

echo "→ merging into the live brain (union + objective arbitration)…"
curl -s -X POST -H "x-puglit-service: $SVC" -H "Content-Type: application/json" \
  --data-binary "@${TMP}" "$BASE/api/admin/brain" | python3 -m json.tool
echo "  ✓ merged (additive learnings unioned, active skills = best held-out score)"
