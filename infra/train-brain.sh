#!/usr/bin/env bash
# Batch brain-training: run every idea in brain-training-ideas.tsv through a tournament + build, so
# the brain (diary, exemplars, metrics, SkillOpt skills) fills up. Evolves skills every N builds and
# snapshots the brain to git at the end. RESUMABLE — re-run anytime; it skips already-done ideas.
#
#   SVC=$PUGLIT_SERVICE_TOKEN BRAIN_REPO=/workspace/puglit-brain nohup bash infra/train-brain.sh > /tmp/train.log 2>&1 &
#   tail -f /tmp/train.log
set -uo pipefail
B="${BASE:-http://localhost:3000}"
SVC="${SVC:?set SVC=\$PUGLIT_SERVICE_TOKEN}"
HERE="$(cd "$(dirname "$0")" && pwd)"
IDEAS="${IDEAS:-$HERE/brain-training-ideas.tsv}"
DONE="${DONE:-/workspace/brain-train-done.txt}"; touch "$DONE"
EVOLVE_EVERY="${EVOLVE_EVERY:-20}"
n=0; ok=0
START=$(date +%s)

while IFS=$'\t' read -r name what mode monet; do
  [ -z "${name:-}" ] && continue
  case "$name" in \#*) continue ;; esac
  if grep -qxF "$name" "$DONE"; then echo "· skip (hecho): $name"; continue; fi
  n=$((n+1))
  echo ""; echo "[$n] ▶ $name  ($mode · $monet)"

  # mode: train = ligero (sin repair del adverse, 1 ronda QA) · full = el torneo completo
  if [ "$mode" = "train" ]; then export PUGLIT_TRAINING_MODE=1 PUGLIT_QA_ROUNDS=1
  else unset PUGLIT_TRAINING_MODE; export PUGLIT_QA_ROUNDS=2; fi

  JID=$(curl -s -X POST "$B/api/genetic/tournament" -H 'content-type: application/json' \
    -d "{\"name\":\"$name\",\"what\":\"$what\",\"audience\":\"usuarios\",\"monetization\":\"${monet:-free}\"}" | jq -r '.jobId // empty')
  if [ -z "$JID" ]; then echo "  ✗ el torneo no arranco (server?)"; continue; fi

  # esperar el torneo (hasta ~25 min)
  st="?"
  for i in $(seq 1 300); do
    st=$(curl -s "$B/api/genetic/tournament?status=$JID" | jq -r '.status // "?"')
    { [ "$st" = "done" ] || [ "$st" = "error" ]; } && break
    sleep 5
  done
  BJ=$(curl -s "$B/api/genetic/tournament?status=$JID" | jq -r '.result.buildJobId // empty')

  # esperar el build del ganador (donde el cerebro aprende: exemplars/QA/adverse/metrics) ~30 min
  bs="?"
  if [ -n "$BJ" ]; then
    for i in $(seq 1 400); do
      bs=$(curl -s -H "x-puglit-service: $SVC" "$B/api/job/$BJ" | jq -r '.status // "?"')
      { [ "$bs" = "done" ] || [ "$bs" = "error" ]; } && break
      sleep 5
    done
  fi

  echo "$name" >> "$DONE"
  [ "$bs" = "done" ] && ok=$((ok+1))
  echo "  ✓ $name — torneo[$st] $JID · build[$bs] ${BJ:-—}  (acumulado: $ok/$n ok)"

  # evolucion periodica de skills (SkillOpt) cada EVOLVE_EVERY builds
  if [ $((n % EVOLVE_EVERY)) -eq 0 ]; then
    echo "  🧠 SkillOpt: evolucionando skills…"
    curl -s -X POST -H "x-puglit-service: $SVC" "$B/api/admin/evolve-skills" | jq -c '{accepted}' || true
  fi
done < "$IDEAS"

echo ""; echo "→ evolucion final de skills + snapshot del cerebro a git…"
curl -s -X POST -H "x-puglit-service: $SVC" "$B/api/admin/evolve-skills" | jq -c '{accepted}' || true
BRAIN_REPO="${BRAIN_REPO:-}" SVC="$SVC" BASE="$B" bash "$HERE/brain-snapshot.sh" || true

MIN=$(( ($(date +%s) - START) / 60 ))
echo ""; echo "✅ entrenamiento completo: $ok/$n builds OK en ${MIN} min. Cerebro snapshotteado."
