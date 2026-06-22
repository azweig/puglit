#!/usr/bin/env bash
# Snapshot the agents' brain → a durable backup (git repo or bucket). Run on a cron / after each run.
# The LIVE authoritative store is the cloud Postgres; this is the belt-and-suspenders backup.
#   env: SVC (PUGLIT_SERVICE_TOKEN), BASE (default localhost:3000), BRAIN_REPO (a git checkout dir)
set -euo pipefail
SVC="${SVC:?set SVC=\$PUGLIT_SERVICE_TOKEN}"
BASE="${BASE:-http://localhost:3000}"
TS="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="/tmp/brain-${TS}.json"

echo "→ exporting brain snapshot…"
curl -s -H "x-puglit-service: $SVC" "$BASE/api/admin/brain" -o "$OUT"
SIZE=$(wc -c < "$OUT"); echo "  ${SIZE} bytes → $OUT"

if [ -n "${BRAIN_REPO:-}" ] && [ -d "$BRAIN_REPO/.git" ]; then
  cp "$OUT" "$BRAIN_REPO/latest.json"; cp "$OUT" "$BRAIN_REPO/snapshots/brain-${TS}.json" 2>/dev/null || { mkdir -p "$BRAIN_REPO/snapshots"; cp "$OUT" "$BRAIN_REPO/snapshots/brain-${TS}.json"; }
  ( cd "$BRAIN_REPO" && git add -A && git commit -q -m "brain snapshot ${TS}" && git push -q ) && echo "  ✓ pushed to $BRAIN_REPO"
else
  # no git repo configured → upload to a temp bucket so you at least have an off-pod copy
  URL=$(curl -s -F "file=@${OUT}" https://tmpfiles.org/api/v1/upload | sed -E 's/.*"url":"([^"]+)".*/\1/')
  echo "  ✓ uploaded → ${URL}  (set BRAIN_REPO=/path/to/puglit-brain for a durable git backup)"
fi
