#!/usr/bin/env bash
# Quick end-to-end test from the terminal: launch a tournament, follow its phases live,
# then print the winner + each team's score + the auto-build job.
#
#   bash infra/test-tournament.sh                          # default: scientific calculator
#   bash infra/test-tournament.sh "MiApp" "qué es / hace"  # your own idea
B="${BASE:-http://localhost:3000}"
NAME="${1:-SciCalc}"
WHAT="${2:-calculadora cientifica online: operaciones sin/cos/tan/log/ln/raiz/potencia, historial de calculos, memoria M+/M-/MR, modo grados/radianes}"

echo "→ lanzando torneo: $NAME"
JID="$(curl -s -X POST "$B/api/genetic/tournament" -H 'content-type: application/json' -d "{\"name\":\"$NAME\",\"what\":\"$WHAT\"}" | jq -r '.jobId // empty')"
if [ -z "$JID" ]; then echo "✗ no arrancó (¿server arriba? probá: curl -s $B/api/doctor)"; exit 1; fi
echo "  jobId: $JID — 3 equipos diseñan + 3 jueces votan (~5-8 min). Seguí las fases:"

while true; do
  S="$(curl -s "$B/api/genetic/tournament?status=$JID")"
  st="$(echo "$S" | jq -r '.status // "?"')"; ph="$(echo "$S" | jq -r '.phase // ""')"
  echo "  [$st] $ph"
  [ "$st" = "done" ] && break
  [ "$st" = "error" ] && { echo "✗ error: $(echo "$S" | jq -r '.error')"; exit 1; }
  sleep 5
done

echo ""
echo "=== RESULTADO ==="
curl -s "$B/api/genetic/tournament?status=$JID" | jq '.result | {
  ganador: .winner,
  subieron_nivel: (.leveledUp | length),
  build_del_ganador: .buildJobId,
  equipos: [ .designs[] | { equipo: .team, modelo: .model, overall: .areas.overall, critica: .areas.critique } ]
}'
echo ""
BJ="$(curl -s "$B/api/genetic/tournament?status=$JID" | jq -r '.result.buildJobId // empty')"
[ -n "$BJ" ] && echo "→ El ganador se está CONSTRUYENDO solo. Seguilo en:  $B/build/$BJ   (o en /projects logueado)"
