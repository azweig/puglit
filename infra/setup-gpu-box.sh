#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Puglit — one-shot setup for a fresh GPU box (Paperspace A6000 / Ubuntu 22.04).
#
# Moves the WHOLE local stack off an 8GB laptop onto a real GPU so the agents
# run a capable code model (qwen2.5-coder:32B) instead of the 7B that oscillates.
# Installs Ollama + models, Postgres, Node, the repo deps, the schema + 75-agent
# roster, and leaves Ollama + the dev server running. Idempotent: safe to re-run.
#
# USAGE (on the box, after `git clone` + `cd puglit`):
#   bash infra/setup-gpu-box.sh
#
# Override models/ports up top via env if you want, e.g.:
#   MODEL_CODE=qwen2.5-coder:32b MODEL_AUX=gemma2:9b bash infra/setup-gpu-box.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Tunables ────────────────────────────────────────────────────────────────
MODEL_CODE="${MODEL_CODE:-qwen2.5-coder:32b}"   # code + premium + judge lane (~20GB VRAM @ Q4)
MODEL_AUX="${MODEL_AUX:-gemma2:9b}"             # balanced + cheap lane (extraction, MoA diversity)
MODEL_VISION="${MODEL_VISION:-}"               # optional, e.g. qwen2.5vl:7b — enables image references
PG_DB="${PG_DB:-puglit}"
PG_USER="${PG_USER:-postgres}"
PG_PASS="${PG_PASS:-postgres}"
PG_PORT="${PG_PORT:-5432}"
DEV_PORT="${DEV_PORT:-3000}"

# locate the repo root from this script's location
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB="$ROOT/web"
say(){ echo -e "\n\033[1;35m▶ $*\033[0m"; }

# ── 1. System deps ──────────────────────────────────────────────────────────
say "1/7 System packages (git, curl, postgres, build tools)"
sudo apt-get update -y
sudo apt-get install -y curl git build-essential postgresql postgresql-contrib jq rsync

# Node 20 (skip if already present)
if ! command -v node >/dev/null || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt 20 ]; then
  say "Installing Node 20"
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
echo "node $(node -v) · npm $(npm -v)"

# ── 2. Ollama ───────────────────────────────────────────────────────────────
say "2/7 Ollama"
if ! command -v ollama >/dev/null; then curl -fsSL https://ollama.com/install.sh | sh; fi
# start the server (systemd if available, else nohup)
sudo systemctl enable --now ollama 2>/dev/null || (pgrep -f "ollama serve" >/dev/null || (OLLAMA_FLASH_ATTENTION=1 nohup ollama serve >/tmp/ollama.log 2>&1 &))
# wait until it answers
for i in $(seq 1 30); do curl -sf http://localhost:11434/api/tags >/dev/null 2>&1 && break; sleep 2; done
echo "ollama up ✓"

# ── 3. Pull models (the slow part — big downloads) ──────────────────────────
say "3/7 Pulling models (code=$MODEL_CODE aux=$MODEL_AUX ${MODEL_VISION:+vision=$MODEL_VISION})"
ollama pull "$MODEL_CODE"
ollama pull "$MODEL_AUX"
[ -n "$MODEL_VISION" ] && ollama pull "$MODEL_VISION" || true
ollama list

# ── 4. Postgres: db + user ──────────────────────────────────────────────────
say "4/7 Postgres ($PG_DB on :$PG_PORT)"
sudo systemctl enable --now postgresql
sudo -u postgres psql -p "$PG_PORT" -c "ALTER USER $PG_USER PASSWORD '$PG_PASS';" >/dev/null
sudo -u postgres psql -p "$PG_PORT" -tc "SELECT 1 FROM pg_database WHERE datname='$PG_DB'" | grep -q 1 \
  || sudo -u postgres createdb -p "$PG_PORT" "$PG_DB"
echo "postgres ready ✓"

# ── 5. Repo deps + env ──────────────────────────────────────────────────────
say "5/7 Installing web deps + writing .env.local"
cd "$WEB"
npm ci || npm install
cat > "$WEB/.env.local" <<EOF
# GPU box — Ollama (qwen-coder 32B + gemma aux), local Postgres. No paid keys.
PUGLIT_PROVIDER=ollama
PUGLIT_MODEL_PREMIUM=$MODEL_CODE
PUGLIT_MODEL_CODE=$MODEL_CODE
PUGLIT_MODEL_BALANCED=$MODEL_AUX
PUGLIT_MODEL_CHEAP=$MODEL_AUX
PUGLIT_VISION=$([ -n "$MODEL_VISION" ] && echo always || echo never)
PUGLIT_VERIFY=1
POSTGRES_HOST=localhost
POSTGRES_PORT=$PG_PORT
POSTGRES_DB=$PG_DB
POSTGRES_USER=$PG_USER
POSTGRES_PASSWORD=$PG_PASS
POSTGRES_SSL=disable
EOF
echo ".env.local written ✓"

# ── 6. Schema (app tables + genetic tables) ─────────────────────────────────
say "6/7 Loading schema"
export PGPASSWORD="$PG_PASS"
PSQL="psql -h localhost -p $PG_PORT -U $PG_USER -d $PG_DB -v ON_ERROR_STOP=0"
[ -f "$WEB/sql/puglit.sql" ]  && $PSQL -f "$WEB/sql/puglit.sql"  >/dev/null 2>&1 || true
[ -f "$WEB/sql/genetic.sql" ] && $PSQL -f "$WEB/sql/genetic.sql" >/dev/null 2>&1 || true
echo "schema loaded ✓"

# ── 7. Start dev server + seed the 75-agent roster ──────────────────────────
say "7/7 Starting dev server (:$DEV_PORT) + seeding roster"
pkill -f "next dev" 2>/dev/null || true
nohup npm run dev -- -p "$DEV_PORT" >/tmp/puglit-dev.log 2>&1 &
for i in $(seq 1 40); do curl -sf "http://localhost:$DEV_PORT/api/doctor" >/dev/null 2>&1 && break; sleep 2; done
curl -s -X POST "http://localhost:$DEV_PORT/api/genetic/seed" | jq . 2>/dev/null || true

say "DONE ✓"
cat <<EOF

  Stack listo en la caja:
    • Ollama    → http://localhost:11434   (code=$MODEL_CODE, aux=$MODEL_AUX)
    • Postgres  → localhost:$PG_PORT/$PG_DB
    • Next dev  → http://localhost:$DEV_PORT   (logs: /tmp/puglit-dev.log)

  Verificá el cableado de modelos:
    curl -s http://localhost:$DEV_PORT/api/doctor | jq .

  Correr un build completo (genera → repara → sirve):
    cd $WEB && node scripts/build-local.mjs

  Ver el roster / torneo:
    http://localhost:$DEV_PORT/roster
    http://localhost:$DEV_PORT/tournament

  Para verlo desde tu Mac sin abrir puertos, hacé un túnel SSH:
    ssh -L $DEV_PORT:localhost:$DEV_PORT  paperspace@<IP-de-la-caja>
    # luego abrí http://localhost:$DEV_PORT en tu navegador

  Cuando termines: APAGÁ la máquina en la consola de Paperspace
  (pagás compute solo encendida; apagada = solo storage).
EOF
