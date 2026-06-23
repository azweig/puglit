#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  Puglit — Intelligent Setup Wizard                                         ║
# ║  One command: detects your hardware, picks an AI profile, installs Ollama  ║
# ║  + models, writes .env, prepares Postgres, and health-checks everything.   ║
# ║                                                                            ║
# ║    git clone … && cd puglit && ./setup.sh                                  ║
# ╚══════════════════════════════════════════════════════════════════════════╝
set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB="$ROOT/web"
ENV_FILE="$WEB/.env.local"

# ── pretty ───────────────────────────────────────────────────────────────────
ok(){ printf "  \033[1;32m✓\033[0m %s\n" "$1"; }
warn(){ printf "  \033[1;33m!\033[0m %s\n" "$1"; }
err(){ printf "  \033[1;31m✗\033[0m %s\n" "$1"; }
say(){ printf "\n\033[1;35m▶ %s\033[0m\n" "$1"; }
ask(){ local p="$1" d="${2:-}" a; read -r -p "  $p${d:+ [$d]}: " a; echo "${a:-$d}"; }
yn(){ local a; read -r -p "  $1 (y/n) [${2:-n}]: " a; a="${a:-${2:-n}}"; [[ "$a" =~ ^[Yy] ]]; }
rand(){ openssl rand -hex 24 2>/dev/null || head -c 24 /dev/urandom | od -An -tx1 | tr -d ' \n'; }

clear 2>/dev/null || true
printf "\033[1;35m"; cat <<'ART'
   ___              _ _ _
  | _ \_  _ __ _ __| (_) |_
  |  _/ || / _` / _` | |  _|
  |_|  \_,_\__, \__,_|_|\__|   Intelligent Setup
           |___/
ART
printf "\033[0m\n"

# ── 1. Hardware detection ──────────────────────────────────────────────────────
say "1/7  Detecting your hardware…"
OS="$(uname -s)"; ARCH="$(uname -m)"
SUDO=""; [ "$(id -u)" -ne 0 ] && SUDO="sudo"
if [ "$OS" = "Darwin" ]; then
  CORES="$(sysctl -n hw.ncpu 2>/dev/null || echo '?')"
  RAM_GB="$(( $(sysctl -n hw.memsize 2>/dev/null || echo 0) / 1024 / 1024 / 1024 ))"
  if [ "$ARCH" = "arm64" ]; then GPU="Apple Silicon (unified memory)"; VRAM_GB="$RAM_GB"; else GPU="$(system_profiler SPDisplaysDataType 2>/dev/null | grep -m1 'Chipset Model' | cut -d: -f2 | xargs)"; VRAM_GB=0; fi
else
  CORES="$(nproc 2>/dev/null || echo '?')"
  RAM_GB="$(free -g 2>/dev/null | awk '/Mem:/{print $2}')"; RAM_GB="${RAM_GB:-0}"
  if command -v nvidia-smi >/dev/null 2>&1; then
    GPU="$(nvidia-smi --query-gpu=name --format=csv,noheader 2>/dev/null | head -1)"
    VRAM_GB="$(( $(nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits 2>/dev/null | head -1) / 1024 ))"
  else GPU="none (CPU)"; VRAM_GB=0; fi
fi
DISK_GB="$(df -Pg "$ROOT" 2>/dev/null | awk 'NR==2{print $4}' || df -P "$ROOT" | awk 'NR==2{print int($4/1048576)}')"
HAS_DOCKER=no; command -v docker >/dev/null 2>&1 && HAS_DOCKER=yes
HAS_OLLAMA=no; command -v ollama >/dev/null 2>&1 && HAS_OLLAMA=yes
HAS_PSQL=no; command -v psql >/dev/null 2>&1 && HAS_PSQL=yes
HAS_NODE=no; command -v node >/dev/null 2>&1 && [ "$(node -v 2>/dev/null | cut -d. -f1 | tr -d v)" -ge 18 ] 2>/dev/null && HAS_NODE=yes

ok "OS: $OS ($ARCH)"; ok "CPU: $CORES cores"; ok "RAM: ${RAM_GB} GB"; ok "GPU: $GPU${VRAM_GB:+ · ${VRAM_GB} GB}"
ok "Free disk: ${DISK_GB} GB"; ok "Docker: $HAS_DOCKER · Ollama: $HAS_OLLAMA · Postgres: $HAS_PSQL · Node 18+: $HAS_NODE"

TIER=LOW
if [ "${VRAM_GB:-0}" -ge 40 ] || { [ "$ARCH" = "arm64" ] && [ "${RAM_GB:-0}" -ge 48 ]; }; then TIER=HIGH
elif [ "${VRAM_GB:-0}" -ge 16 ] || [ "${RAM_GB:-0}" -ge 32 ]; then TIER=MID; fi
printf "\n  System classified as: \033[1;36m%s-END\033[0m\n" "$TIER"

# ── Linux prerequisites (so Ollama/Postgres installs don't fail mid-way) ───────
if [ "$OS" = "Linux" ] && command -v apt-get >/dev/null 2>&1; then
  say "Installing base prerequisites (zstd, curl, jq, build tools)…"
  $SUDO apt-get update -y >/dev/null 2>&1
  $SUDO apt-get install -y zstd curl ca-certificates jq build-essential lsof rsync >/dev/null 2>&1 && ok "prerequisites ready"
fi

# ── 2. AI profile ──────────────────────────────────────────────────────────────
say "2/7  Pick an AI profile"
case "$TIER" in HIGH) REC=1;; MID) REC=2;; *) REC=3;; esac
echo "  1) Full Local   — max local power (64GB+ / strong GPU)   [~60GB download]"
echo "  2) Balanced     — best local quality/perf (mid GPU)      [~25GB download]"
echo "  3) API-Only     — no GPU / small VPS → use provider APIs [0GB]"
echo "  4) Hybrid       — local for code/cheap + API for premium"
echo "     (recommended for your hardware: $REC)"
PROFILE="$(ask 'Profile' "$REC")"

PROVIDER=ollama; PULL=(); M_PREMIUM=""; M_BALANCED=""; M_CHEAP=""; M_CODE=""; M_EMBED="nomic-embed-text"
case "$PROFILE" in
  1) M_CODE="qwen2.5-coder:32b"; M_PREMIUM="qwen2.5:32b"; M_BALANCED="gemma2:9b"; M_CHEAP="gemma2:2b"
     PULL=(qwen2.5-coder:32b qwen2.5:32b deepseek-coder-v2:16b gemma2:9b gemma2:2b "$M_EMBED") ;;
  2) M_CODE="qwen2.5-coder:7b"; M_PREMIUM="qwen2.5:14b"; M_BALANCED="gemma2:9b"; M_CHEAP="gemma2:2b"
     PULL=(qwen2.5-coder:7b qwen2.5:14b gemma2:9b gemma2:2b "$M_EMBED") ;;
  3) PROVIDER=api; PULL=() ;;
  4) M_CODE="qwen2.5-coder:7b"; M_CHEAP="gemma2:2b"; PROVIDER=hybrid; PULL=(qwen2.5-coder:7b gemma2:2b "$M_EMBED") ;;
  *) err "invalid profile"; exit 1 ;;
esac
ok "Profile $PROFILE selected"

# ── 3. Ollama + models ─────────────────────────────────────────────────────────
if [ "${#PULL[@]}" -gt 0 ]; then
  say "3/7  Ollama + models"
  if [ "$HAS_OLLAMA" = no ]; then
    if yn "Ollama is not installed. Install it now?" y; then
      curl -fsSL https://ollama.com/install.sh | sh && HAS_OLLAMA=yes
    else warn "Skipped — install Ollama and re-run, or choose API-Only."; fi
  fi
  if [ "$HAS_OLLAMA" = yes ]; then
    (command -v systemctl >/dev/null 2>&1 && $SUDO systemctl start ollama 2>/dev/null) || (nohup ollama serve >/tmp/ollama.log 2>&1 & sleep 3) || true
    warn "Downloading ${#PULL[@]} models (this can take a while — they run in the background):"
    for m in "${PULL[@]}"; do printf "    · %s … " "$m"; ollama pull "$m" >/dev/null 2>&1 && echo "ok" || echo "✗ (retry: ollama pull $m)"; done
  fi
else say "3/7  API-Only profile → no models downloaded"; fi

# ── 4. Credentials (optional, only what the profile needs) ─────────────────────
say "4/7  Credentials (optional · stored only in .env.local, never logged or sent anywhere)"
declare -A KEYS
if [ "$PROVIDER" = "api" ] || [ "$PROFILE" = "4" ]; then
  for p in OpenAI:OPENAI_API_KEY Anthropic:ANTHROPIC_API_KEY Gemini:GEMINI_API_KEY OpenRouter:OPENROUTER_API_KEY; do
    name="${p%%:*}"; var="${p##*:}"
    if yn "Configure $name?" n; then read -r -s -p "    API key: " k; echo; [ -n "$k" ] && KEYS[$var]="$k"; fi
  done
fi

# ── 5. Generate .env.local ─────────────────────────────────────────────────────
say "5/7  Generating $ENV_FILE"
mkdir -p "$WEB"
if [ -f "$ENV_FILE" ] && ! yn ".env.local already exists. Overwrite?" n; then warn "Keeping the existing one"; else
  {
    echo "# Puglit — generated by setup.sh ($(date -u +%FT%TZ))"
    echo "POSTGRES_HOST=localhost"; echo "POSTGRES_PORT=5432"; echo "POSTGRES_DB=puglit"
    echo "POSTGRES_USER=postgres"; echo "POSTGRES_PASSWORD=postgres"; echo "POSTGRES_SSL=disable"
    echo "PUGLIT_SERVICE_TOKEN=$(rand)"; echo "CRON_SECRET=$(rand)"; echo "PUGLIT_SESSION_SECRET=$(rand)"
    echo "EMBED_MODEL=${M_EMBED}"
    if [ "$PROVIDER" = "api" ]; then
      echo "PUGLIT_PROVIDER=openai"
    else
      echo "PUGLIT_PROVIDER=ollama"; echo "OLLAMA_BASE_URL=http://localhost:11434"
      [ -n "$M_PREMIUM" ]  && echo "PUGLIT_MODEL_PREMIUM=$M_PREMIUM"
      [ -n "$M_BALANCED" ] && echo "PUGLIT_MODEL_BALANCED=$M_BALANCED"
      [ -n "$M_CHEAP" ]    && echo "PUGLIT_MODEL_CHEAP=$M_CHEAP"
      [ -n "$M_CODE" ]     && echo "PUGLIT_MODEL_CODE=$M_CODE"
    fi
    for v in "${!KEYS[@]}"; do echo "$v=${KEYS[$v]}"; done
  } > "$ENV_FILE"
  chmod 600 "$ENV_FILE"; ok ".env.local written (mode 600)"
fi

# ── 6. Postgres + schema + deps ────────────────────────────────────────────────
say "6/7  Database + dependencies"
# Linux bootstrap: install Node 20 + Postgres if missing (a bare Ubuntu pod has neither).
if [ "$OS" = "Linux" ] && command -v apt-get >/dev/null 2>&1; then
  if [ "$HAS_NODE" = no ]; then warn "Installing Node 20…"; curl -fsSL https://deb.nodesource.com/setup_20.x | $SUDO bash - >/dev/null 2>&1; $SUDO apt-get install -y nodejs >/dev/null 2>&1; command -v node >/dev/null 2>&1 && HAS_NODE=yes && ok "node $(node -v)"; fi
  if [ "$HAS_PSQL" = no ] && [ "$HAS_DOCKER" = no ]; then
    warn "Installing Postgres…"; $SUDO apt-get install -y postgresql postgresql-contrib >/dev/null 2>&1
    ($SUDO service postgresql start || $SUDO pg_ctlcluster "$(ls /etc/postgresql 2>/dev/null | sort -n | tail -1)" main start) >/dev/null 2>&1
    $SUDO -u postgres psql -tc "ALTER USER postgres PASSWORD 'postgres';" >/dev/null 2>&1
    command -v psql >/dev/null 2>&1 && HAS_PSQL=yes && ok "postgres installed"
  fi
fi
if [ "$HAS_PSQL" = yes ]; then
  PGPASSWORD=postgres psql -h localhost -U postgres -tc "SELECT 1 FROM pg_database WHERE datname='puglit'" 2>/dev/null | grep -q 1 \
    || PGPASSWORD=postgres createdb -h localhost -U postgres puglit 2>/dev/null || warn "couldn't create the 'puglit' DB (create it manually)"
  PGPASSWORD=postgres psql -h localhost -U postgres -d puglit -f "$WEB/sql/genetic.sql" >/dev/null 2>&1 && ok "schema loaded (genetic.sql)" || warn "run: psql -d puglit -f web/sql/genetic.sql"
elif [ "$HAS_DOCKER" = yes ]; then
  if yn "No local Postgres. Start one with Docker (pgvector)?" y; then
    docker run -d --name puglit-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=puglit -p 5432:5432 pgvector/pgvector:pg16 >/dev/null 2>&1 && ok "Postgres+pgvector in Docker (:5432)" && sleep 4 \
      && (docker exec -i puglit-pg psql -U postgres -d puglit < "$WEB/sql/genetic.sql" >/dev/null 2>&1 && ok "schema loaded") || warn "check the puglit-pg container"
  fi
else warn "No Postgres or Docker → install Postgres 14+ and run web/sql/genetic.sql"; fi

if [ "$HAS_NODE" = yes ]; then
  ( cd "$WEB" && npm install --no-audit --no-fund >/dev/null 2>&1 ) && ok "web dependencies installed"
  [ -d "$ROOT/spine" ] && ( cd "$ROOT/spine" && npm install --no-audit --no-fund >/dev/null 2>&1 ) && ok "spine dependencies installed"
else err "Node 18+ not found — install it (nodejs.org) and re-run"; fi

# ── 7. Gateways (optional) + health check ──────────────────────────────────────
say "7/7  Optional gateways + verification"
if [ "$HAS_DOCKER" = yes ] && [ -f "$ROOT/infra/setup-gateways.sh" ] && yn "Enable optional gateways (MinIO/Meilisearch/scraper/…)?" n; then
  bash "$ROOT/infra/setup-gateways.sh" || warn "gateways: check infra/setup-gateways.sh"
fi

echo; printf "\033[1;36m──────── Diagnostics ────────\033[0m\n"
[ "$PROVIDER" = "api" ] || { ollama list >/dev/null 2>&1 && ok "Ollama responding" || err "Ollama not responding"; }
PGPASSWORD=postgres psql -h localhost -U postgres -d puglit -tc "SELECT 1" >/dev/null 2>&1 && ok "Database OK" || err "Database not responding"
[ -f "$ENV_FILE" ] && ok ".env.local present" || err ".env.local missing"

echo
printf "\033[1;32m✅ Puglit is ready.\033[0m  Start the server:\n\n"
echo "   cd web && npm run dev          # development (http://localhost:3000)"
echo "   # or, on a GPU box:  bash infra/rebuild.sh   # build + serve + watchdog + seed"
echo
echo "   Then open  http://localhost:3000/generate  and build your first SaaS."
echo "   Brain dashboard:  http://localhost:3000/brain"
echo
