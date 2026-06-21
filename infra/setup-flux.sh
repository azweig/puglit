#!/usr/bin/env bash
# Install + run FLUX.1-schnell as a LOCAL OpenAI-compatible image server (the open-source
# "Midjourney") for Puglit logos. Run on the pod (A40 + CUDA). One time:
#
#   bash infra/setup-flux.sh
#   # then add to web/.env.local:  PUGLIT_IMAGE_URL=http://localhost:8080/v1
#   # and rebuild. The art-director now generates real logos.
#
# Model cache + the 24GB download live on the persistent volume (HF_HOME) so a pod restart
# doesn't re-download. Coexists with Ollama via cpu-offload (a logo takes ~10-30s).
set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${FLUX_PORT:-8080}"
export HF_HOME="${HF_HOME:-/workspace/.hf}"
mkdir -p "$HF_HOME"

echo "→ 1/3 deps (torch cu12, diffusers, fastapi)… (un rato la 1ra vez)"
pip install -q --upgrade pip
pip install -q torch --index-url https://download.pytorch.org/whl/cu124 2>/dev/null || pip install -q torch
pip install -q diffusers transformers accelerate sentencepiece protobuf pillow fastapi "uvicorn[standard]"

echo "→ 2/3 arrancando FLUX server en :$PORT (la 1ra vez baja ~24GB de FLUX.1-schnell)…"
pkill -f flux-server.py 2>/dev/null || true
HF_HOME="$HF_HOME" FLUX_PORT="$PORT" nohup python3 "$ROOT/infra/flux-server.py" > /tmp/flux.log 2>&1 &

echo "→ 3/3 esperando a que cargue (mirá el progreso con: tail -f /tmp/flux.log)…"
for i in $(seq 1 120); do
  curl -s "http://localhost:$PORT/v1/models" 2>/dev/null | grep -q flux && { echo "✓ FLUX listo en :$PORT"; break; }
  sleep 5
done
echo ""
echo "Ahora: en web/.env.local agregá   PUGLIT_IMAGE_URL=http://localhost:$PORT/v1"
echo "y corré el rebuild. Probá un logo:  curl -s -X POST localhost:3000/api/genetic/logo -H 'content-type: application/json' -d '{\"name\":\"parky\",\"what\":\"parking app\"}' | jq .provider"
