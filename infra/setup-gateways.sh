#!/usr/bin/env bash
# setup-gateways.sh — levanta TODOS los servicios de soporte de los módulos de Puglit, de una.
# Idempotente. Corré en el pod/box:  bash infra/setup-gateways.sh
# Después poné las URLs resultantes en web/.env.local (las imprime al final).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NET="puglit-net"
docker network create "$NET" 2>/dev/null || true
say() { printf "\n\033[1;36m▸ %s\033[0m\n" "$1"; }

# ── 1. MinIO — storage (S3-compatible) ────────────────────────────────────────
say "MinIO (storage :9000, console :9001)"
docker rm -f puglit-minio 2>/dev/null || true
docker run -d --name puglit-minio --network "$NET" -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER=puglit -e MINIO_ROOT_PASSWORD=puglit-secret \
  -v puglit-minio:/data minio/minio server /data --console-address ":9001"

# ── 2. Meilisearch — search ───────────────────────────────────────────────────
say "Meilisearch (:7700)"
docker rm -f puglit-meili 2>/dev/null || true
docker run -d --name puglit-meili --network "$NET" -p 7700:7700 \
  -e MEILI_MASTER_KEY=puglit-meili -v puglit-meili:/meili_data getmeili/meilisearch:latest

# ── 3. apprise-api — notifications fan-out ────────────────────────────────────
say "apprise-api (:8000)"
docker rm -f puglit-apprise 2>/dev/null || true
docker run -d --name puglit-apprise --network "$NET" -p 8000:8000 caronc/apprise:latest

# ── 4. n8n — workflows ────────────────────────────────────────────────────────
say "n8n (:5678)"
docker rm -f puglit-n8n 2>/dev/null || true
docker run -d --name puglit-n8n --network "$NET" -p 5678:5678 \
  -e N8N_SECURE_COOKIE=false -v puglit-n8n:/home/node/.n8n n8nio/n8n:latest

# ── 5. Nango — OAuth proxy ────────────────────────────────────────────────────
say "Nango (:3003) — requiere su propio postgres; ver docs.nango.dev si lo usás a fondo"
docker rm -f puglit-nango 2>/dev/null || true
docker run -d --name puglit-nango --network "$NET" -p 3003:3003 \
  -e NANGO_DB_URL="${NANGO_DB_URL:-postgres://postgres:postgres@host.docker.internal:5432/nango}" \
  nangohq/nango-server:latest 2>/dev/null || echo "  (Nango: configurá NANGO_DB_URL y reintentá)"

# ── 6. freellmapi — 1.7B tokens LLM gratis/mes (SUPER IMPORTANTE) ─────────────
say "freellmapi (:3001) — fallback/boost de LLM gratis para el swarm"
if [ ! -d "$ROOT/.gateways/freellmapi" ]; then
  git clone --depth 1 https://github.com/tashfeenahmed/freellmapi "$ROOT/.gateways/freellmapi"
fi
( cd "$ROOT/.gateways/freellmapi"
  [ -f .env ] || printf "ENCRYPTION_KEY=%s\nPORT=3001\nHOST_BIND=0.0.0.0\n" "$(openssl rand -hex 32)" > .env
  docker compose up -d )
echo "  → cargá las free keys en el dashboard http://localhost:5173"

# ── 7. scraper-server — scrape + pdf + image + ocr + parse + docgen ───────────
say "scraper-server (:8200) — Scrapling/ScrapeGraph + Playwright + Pillow + Tesseract + markitdown + python-docx/openpyxl"
pip install -q --upgrade pip
pip install -q "scrapling[fetchers]" scrapegraphai fastapi "uvicorn[standard]" \
  pillow pytesseract markitdown python-docx openpyxl python-pptx 2>/dev/null || true
scrapling install 2>/dev/null || python3 -m playwright install chromium 2>/dev/null || true
pkill -f scraper-server.py 2>/dev/null || true
SCRAPER_PORT=8200 OLLAMA_URL="${OLLAMA_URL:-http://localhost:11434}" \
  nohup python3 "$ROOT/infra/scraper-server.py" > /tmp/scraper.log 2>&1 &

# ── 8. pgvector — extensión para el módulo rag ────────────────────────────────
say "pgvector (extensión en tu Postgres) para el módulo rag"
PGPASSWORD="${POSTGRES_PASSWORD:-postgres}" psql -h "${PGHOST:-localhost}" -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-puglit}" \
  -c "CREATE EXTENSION IF NOT EXISTS vector;" 2>/dev/null && echo "  pgvector OK" || echo "  (instalá pgvector: apt install postgresql-16-pgvector, luego re-corré)"

# ── 9. OpenWA (WhatsApp) + flux-server (image-gen): opcionales, pesados ───────
say "OpenWA (WhatsApp) y flux-server (imágenes): opcionales — ver setup-flux.sh / OpenWA docs"

cat <<EOF

\033[1;32m✓ Gateways arriba.\033[0m En web/.env.local:
  S3_ENDPOINT=http://localhost:9000   S3_BUCKET=puglit   S3_ACCESS_KEY=puglit   S3_SECRET_KEY=puglit-secret
  MEILI_URL=http://localhost:7700     MEILI_KEY=puglit-meili
  APPRISE_URL=http://localhost:8000
  N8N_URL=http://localhost:5678
  SCRAPER_URL=http://localhost:8200    (scrape/pdf/image/ocr/parse/docgen)
  # LLM boost gratis para el swarm (super importante):
  PUGLIT_CODE_BASE_URL=http://localhost:3001/v1   PUGLIT_CODE_API_KEY=freellmapi-...
  PUGLIT_PREMIUM_BASE_URL=http://localhost:3001/v1 PUGLIT_PREMIUM_API_KEY=freellmapi-...
  # (el judge mantenelo local + consistente; A40 como fallback confiable)
EOF
