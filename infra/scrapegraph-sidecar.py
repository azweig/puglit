#!/usr/bin/env python3
"""
scrapegraph-sidecar.py — a tiny ScrapeGraphAI service for Puglit, running on the LOCAL Ollama (free,
self-hosted, headless — no API key, no ToS like NotebookLM). Two uses:

  1) Reference grounding (the `researcher`/`reference-studier` agent): POST /extract a competitor URL
     → the real product's entities + surfaces, so the architect designs from reality, not memory.
  2) The generated apps' `scrape` module: extract structured info / leads / clients from any page.

Endpoints:
  GET  /health                     -> {"ok": true}
  POST /extract {url, prompt, schema?} -> {"result": <structured JSON the prompt asked for>}

Run:  PORT=5055 OLLAMA_MODEL=qwen2.5-coder:32b python3 infra/scrapegraph-sidecar.py
Env:  PORT, OLLAMA_BASE_URL (default http://localhost:11434), OLLAMA_MODEL, EMBED_MODEL (nomic-embed-text)
Then point the web app at it:  PUGLIT_SCRAPEGRAPH_URL=http://localhost:5055
"""
import os, json
from flask import Flask, request, jsonify

OLLAMA_BASE = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "qwen2.5-coder:32b")
EMBED_MODEL = os.environ.get("EMBED_MODEL", "nomic-embed-text")
PORT = int(os.environ.get("PORT", "5055"))

app = Flask(__name__)


def graph_config():
    # ScrapeGraphAI talks to Ollama via the "ollama/<model>" provider id — 100% local, no key.
    return {
        "llm": {"model": f"ollama/{OLLAMA_MODEL}", "base_url": OLLAMA_BASE, "temperature": 0.1, "format": "json"},
        "embeddings": {"model": f"ollama/{EMBED_MODEL}", "base_url": OLLAMA_BASE},
        "verbose": False,
        "headless": True,
    }


@app.get("/health")
def health():
    return jsonify(ok=True, model=OLLAMA_MODEL)


@app.post("/extract")
def extract():
    """SmartScraperGraph: prompt + source URL -> structured JSON the prompt describes."""
    body = request.get_json(force=True, silent=True) or {}
    url = (body.get("url") or "").strip()
    prompt = (body.get("prompt") or "Extract the main structured content of this page.").strip()
    if not url:
        return jsonify(error="url required"), 400
    try:
        from scrapegraphai.graphs import SmartScraperGraph
        graph = SmartScraperGraph(prompt=prompt, source=url, config=graph_config())
        result = graph.run()
        # ScrapeGraphAI returns a dict (or a JSON string) — normalize to a dict.
        if isinstance(result, str):
            try:
                result = json.loads(result)
            except Exception:
                result = {"text": result}
        return jsonify(result=result)
    except Exception as e:  # never 500 the swarm — return the error so the caller can no-op
        return jsonify(error=str(e)[:400], result=None), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT)
