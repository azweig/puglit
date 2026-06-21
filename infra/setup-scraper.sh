#!/usr/bin/env bash
# Install + run the scraping gateway (Scrapling stealth + ScrapeGraph-ai LLM extraction).
# Generated apps talk to it via lib/scraper.ts. One time on the pod:
#   nohup bash infra/setup-scraper.sh > /tmp/scraper-setup.log 2>&1 &
#   # then in web/.env.local:  SCRAPER_URL=http://localhost:8200
set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${SCRAPER_PORT:-8200}"

echo "→ deps (scrapling + chromium, scrapegraphai, fastapi)…"
pip install -q --upgrade pip
pip install -q "scrapling[fetchers]" scrapegraphai fastapi "uvicorn[standard]"
# Scrapling installs its stealth browser; fall back to a plain playwright chromium install.
scrapling install 2>/dev/null || python3 -m playwright install chromium 2>/dev/null || playwright install chromium 2>/dev/null || true

echo "→ arrancando gateway en :$PORT (extracción LLM usa el Ollama local)…"
pkill -f scraper-server.py 2>/dev/null || true
SCRAPER_PORT="$PORT" OLLAMA_URL="${OLLAMA_URL:-http://localhost:11434}" SCRAPER_LLM="${SCRAPER_LLM:-ollama/qwen2.5-coder:32b}" \
  nohup python3 "$ROOT/infra/scraper-server.py" > /tmp/scraper.log 2>&1 &

for i in $(seq 1 30); do curl -s -o /dev/null "http://localhost:$PORT/docs" 2>/dev/null && break; sleep 2; done
echo "✓ gateway de scraping en :$PORT (logs: tail -f /tmp/scraper.log)"
echo "  En web/.env.local:  SCRAPER_URL=http://localhost:$PORT"
echo "  Probar:  curl -s -X POST localhost:$PORT/fetch -H 'content-type: application/json' -d '{\"url\":\"https://example.com\"}' | head -c 200"
