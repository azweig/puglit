#!/usr/bin/env bash
# Build + SERVE the genetic tournament's WINNING design as a LIVE app, on the pod.
# Run it AFTER a tournament has a winner (campus/tournament). One command:
#
#   bash infra/serve-winner.sh "DuelDeck" "juego de cartas estilo Yu-Gi-Oh: mazos, duelos…"
#
# It (1) asks /api/genetic/build for a job seeded with the WINNING blueprint, then
# (2) runs build-local.mjs to drive that job to done, repair (tsc), load the SQL into the
# pod's local Postgres, and `next dev` the app. Open it at the proxy on $PORT.
#
# NOTE: expose $PORT (default 4311) on the RunPod pod (Edit Pod → add HTTP port) so the
# proxy can reach it. Needs the pod's local Postgres (setup-gpu-box.sh installs it on 5432).
set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NAME="${1:-DuelDeck}"
WHAT="${2:-juego de cartas estilo Yu-Gi-Oh: mazos, duelos por turnos, cartas con ataque/defensa/atributo/tipo/nivel, torneos}"
BASE="${BASE:-http://localhost:3000}"
PORT="${PORT:-4311}"
PG_PORT="${PG_PORT:-5432}"
MODEL="${MODEL:-qwen2.5-coder:32b}"

echo "→ creando job de build con el blueprint GANADOR…"
RESP="$(curl -s -X POST "$BASE/api/genetic/build" -H 'content-type: application/json' -d "{\"name\":\"$NAME\",\"what\":\"$WHAT\"}")"
JOB_ID="$(echo "$RESP" | jq -r '.jobId // empty')"
if [ -z "$JOB_ID" ]; then echo "✗ no se creó el job (¿corriste un torneo primero?). resp: $RESP"; exit 1; fi
echo "→ job $JOB_ID · ganador: $(echo "$RESP" | jq -r '.builtFrom') · construyendo + sirviendo en :$PORT (paciencia: el build con el 32B tarda)"

# $PORT is a single reusable "preview slot": free whatever app was served there before, so
# every winner you build appears on the SAME stable URL (<podid>-$PORT.proxy.runpod.net).
# Expose $PORT on RunPod ONCE; never again.
lsof -ti:"$PORT" 2>/dev/null | xargs -r kill -9 2>/dev/null || true

JOB_ID="$JOB_ID" BASE="$BASE" PORT="$PORT" PG_PORT="$PG_PORT" MODEL="$MODEL" SLUG="winner-$JOB_ID" \
  node "$ROOT/web/scripts/build-local.mjs" "$ROOT"
