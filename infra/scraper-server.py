#!/usr/bin/env python3
"""
Scraping gateway: Scrapling (stealth fetch — bypasses Cloudflare/anti-bot, renders JS) +
ScrapeGraph-ai (LLM extraction). Runs as a separate service so the generated apps stay thin
(no chromium in-app). env: SCRAPER_PORT, OLLAMA_URL, SCRAPER_LLM.

⚠️ Pass session cookies for authenticated/paywalled targets (LinkedIn li_at, etc.). Gray-area:
respect rate limits, rotate proxies, persist tokens — risk of bans (see the OSS research).
"""
import os
from typing import Optional
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()


class FetchReq(BaseModel):
    url: str
    stealth: bool = True
    cookies: Optional[str] = None


@app.post("/fetch")
def fetch(r: FetchReq):
    try:
        from scrapling.fetchers import StealthyFetcher, Fetcher
        if r.stealth:
            page = StealthyFetcher.fetch(r.url, headless=True, network_idle=True)
        else:
            page = Fetcher.get(r.url, stealthy_headers=True)
        html = getattr(page, "html_content", "") or ""
        try:
            text = page.get_all_text()
        except Exception:
            text = ""
        return {"status": getattr(page, "status", 200), "html": html[:500000], "text": (text or "")[:200000]}
    except Exception as e:
        return {"status": 0, "html": "", "text": "", "error": str(e)}


class ExtractReq(BaseModel):
    url: str
    prompt: str
    cookies: Optional[str] = None


@app.post("/extract")
def extract(r: ExtractReq):
    try:
        from scrapegraphai.graphs import SmartScraperGraph
        cfg = {
            "llm": {"model": os.environ.get("SCRAPER_LLM", "ollama/qwen2.5-coder:32b"), "base_url": os.environ.get("OLLAMA_URL", "http://localhost:11434"), "temperature": 0},
            "verbose": False, "headless": True,
        }
        return {"data": SmartScraperGraph(prompt=r.prompt, source=r.url, config=cfg).run()}
    except Exception as e:
        return {"error": str(e)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("SCRAPER_PORT", "8200")))
