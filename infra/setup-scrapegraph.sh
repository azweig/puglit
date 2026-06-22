#!/usr/bin/env bash
# Set up the ScrapeGraphAI sidecar on the GPU box (uses the LOCAL Ollama — free, no API key).
set -euo pipefail

echo "→ installing scrapegraphai + flask + playwright (chromium)…"
pip install --quiet scrapegraphai flask playwright
playwright install --with-deps chromium

# pull the models the sidecar uses (skip if already present)
ollama pull "${OLLAMA_MODEL:-qwen2.5-coder:32b}" || true
ollama pull "${EMBED_MODEL:-nomic-embed-text}" || true

echo "→ launching sidecar on :${PORT:-5055} …"
PORT="${PORT:-5055}" nohup python3 "$(dirname "$0")/scrapegraph-sidecar.py" > /tmp/scrapegraph.log 2>&1 &
sleep 4
curl -s "http://localhost:${PORT:-5055}/health" && echo "  ✓ sidecar up"

echo ""
echo "Now point the web app at it (in web/.env.local or the build env):"
echo "  PUGLIT_SCRAPEGRAPH_URL=http://localhost:${PORT:-5055}"
echo "Then founder reference URLs get grounded in real structure during the research phase,"
echo "and generated apps that need scraping get a working lib/scrape.ts."
