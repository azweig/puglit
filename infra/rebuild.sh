#!/usr/bin/env bash
# Disconnect-proof rebuild → serve (prod) → ollama council, all backgrounded so it
# survives the web terminal dropping. Run it with ONE simple command:
#
#   cd /workspace/puglit && git pull && nohup bash infra/rebuild.sh > /tmp/rebuild.log 2>&1 &
#
# Then check progress any time:  tail -f /tmp/build.log   (build)
#                                tail -f /tmp/puglit-prod.log   (server)
#                                curl -s -o /dev/null -w '%{http_code}\n' localhost:3000/api/doctor
set -x
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT/web" || exit 1

# free EVERYTHING that could conflict (stale builds, multiple rebuilds, old servers)
pkill -9 -f "next" 2>/dev/null || true
pkill -9 -f "npm run" 2>/dev/null || true
pkill -9 -f "node .*\.next" 2>/dev/null || true
lsof -ti:3000 2>/dev/null | xargs -r kill -9 2>/dev/null || true
pkill -f "ollama serve" 2>/dev/null || true
# kill any OTHER running copy of this rebuild script (keep ourselves)
for p in $(pgrep -f "rebuild.sh" 2>/dev/null); do [ "$p" != "$$" ] && kill -9 "$p" 2>/dev/null; done
sleep 3

# clean production build (memory-safe: ollama is down so the model isn't in RAM)
rm -rf .next
npm run build > /tmp/build.log 2>&1
echo "BUILD_DONE rc=$?" >> /tmp/build.log

# serve prod (background) + ollama council with one-model-at-a-time (no OOM on swaps)
nohup npm run start -- -p 3000 -H 0.0.0.0 > /tmp/puglit-prod.log 2>&1 &
# #12 model residency: keep 2 models resident (A40 48GB fits a ~20GB 32B coder + a small model) so
# tier switches (premium↔code↔cheap) don't pay a cold-start reload every call. Set =1 if VRAM OOMs.
nohup env OLLAMA_MODELS="${OLLAMA_MODELS:-/workspace/.ollama}" OLLAMA_FLASH_ATTENTION=1 OLLAMA_MAX_LOADED_MODELS="${OLLAMA_MAX_LOADED_MODELS:-2}" ollama serve > /tmp/ollama.log 2>&1 &

# WATCHDOG: drive queued/running builds SERVER-SIDE every 45s, so a build keeps progressing
# even when nobody has the /build page open (a build can take hours → the user must be able
# to close the tab and come back). Without this, builds only advance while a browser polls.
pkill -f "puglit-sweep-loop" 2>/dev/null || true
# The server reads CRON_SECRET from .env.local and REQUIRES it on /api/cron/sweep. Load it
# here too (export → the loop's subshell inherits it) or the watchdog gets 401 and jobs stay
# queued forever.
export CRON_SECRET="$(grep -E '^CRON_SECRET=' .env.local 2>/dev/null | cut -d= -f2-)"
nohup bash -c 'while true; do curl -s -o /dev/null --max-time 280 "http://localhost:3000/api/cron/sweep${CRON_SECRET:+?key=$CRON_SECRET}" 2>/dev/null; sleep 45; done # puglit-sweep-loop' > /tmp/puglit-sweep.log 2>&1 &

# wait for the server to come up, then report
for i in $(seq 1 40); do
  code=$(curl -s -o /dev/null -w '%{http_code}' localhost:3000/api/doctor 2>/dev/null)
  [ "$code" = "200" ] && break
  sleep 3
done

# SEED: create any new tables/columns (auth, scoping, embedding) + (re)seed the 75 agents.
# Idempotent (preserves XP/level/diary). This makes "just rebuild" actually create the schema
# so login + per-user projects work without extra manual steps.
SEED=$(curl -s -X POST localhost:3000/api/genetic/seed 2>/dev/null | head -c 120)
echo "SERVE_READY http=$code · watchdog ON · seed: $SEED" | tee -a /tmp/rebuild.log
