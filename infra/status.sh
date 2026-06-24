#!/usr/bin/env bash
# Is anything still running, or is it ALL done (GPU idle → safe to stop the pod and not burn GPU $)?
#   bash infra/status.sh         # one snapshot
#   bash infra/status.sh watch   # loop until truly idle, then tell you it's safe to stop
P(){ PGPASSWORD=postgres psql -h localhost -U postgres -d puglit -tAc "$1" 2>/dev/null; }

check(){
  GPU="$(nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader,nounits 2>/dev/null | head -1)"; GPU=${GPU:-0}
  MEM="$(nvidia-smi --query-gpu=memory.used --format=csv,noheader 2>/dev/null | head -1)"
  RUN="$(P "SELECT count(*) FROM puglit_jobs WHERE status IN ('running','queued')")"; RUN=${RUN:-0}
}
show(){
  echo "$(date +%H:%M:%S)  ·  GPU ${GPU}% (${MEM})  ·  builds en curso: ${RUN}"
  P "SELECT '   '||left(name,28)||'  ·  '||status||' '||completion||'%' FROM puglit_jobs ORDER BY created_at DESC LIMIT 4"
}

check; show
# the swarm work (tournament design + judging) shows as GPU>5%; builds show in RUN. Both covered.
if [ "${1:-}" != "watch" ]; then
  if [ "$GPU" -lt 5 ] && [ "$RUN" -eq 0 ]; then echo ""; echo "  🟢 nada computando + nada en cola → terminado. Si no lo vas a usar, PARÁ el pod (RunPod factura por hora)."
  else echo ""; echo "  🟡 algo está trabajando (GPU activa o builds en curso) → esperá."; fi
  exit 0
fi

# watch: declare DONE only after the GPU has been idle for 3 consecutive checks (~60s),
# so a brief idle BETWEEN model calls during a tournament doesn't falsely say "done".
idle=0
while [ "$idle" -lt 3 ]; do
  sleep 20; check
  if [ "$GPU" -lt 5 ] && [ "$RUN" -eq 0 ]; then idle=$((idle + 1)); printf "  idle %d/3  (GPU %s%%)\n" "$idle" "$GPU"
  else idle=0; show; fi
done
echo ""
echo "✅ TODO TERMINADO — GPU idle 60s, nada en cola."
echo "   Si no lo vas a seguir usando: en RunPod → STOP el pod (no solo cerrar la terminal) para dejar de facturar."
