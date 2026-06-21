#!/usr/bin/env python3
"""
FLUX.1-schnell behind an OpenAI-compatible /v1/images/generations endpoint, so Puglit's
art-director (lib/image-gen.ts via PUGLIT_IMAGE_URL) generates REAL logos locally + free —
the open-source "Midjourney". VRAM-friendly (model_cpu_offload) so it coexists with the 32B
coder on one A40.

Run via infra/setup-flux.sh. Env: FLUX_MODEL, FLUX_PORT, HF_HOME (cache on the persistent vol).
"""
import base64, io, os
from typing import Optional
from fastapi import FastAPI
from pydantic import BaseModel
import torch
from diffusers import FluxPipeline

MODEL = os.environ.get("FLUX_MODEL", "black-forest-labs/FLUX.1-schnell")
app = FastAPI()
_pipe = None

def pipe():
    global _pipe
    if _pipe is None:
        _pipe = FluxPipeline.from_pretrained(MODEL, torch_dtype=torch.bfloat16)
        _pipe.enable_model_cpu_offload()  # keep VRAM low so Ollama's 32B can stay resident
    return _pipe

class Req(BaseModel):
    prompt: str
    model: Optional[str] = None
    size: Optional[str] = "1024x1024"
    n: Optional[int] = 1
    background: Optional[str] = None

@app.get("/v1/models")
def models():
    return {"data": [{"id": "flux.1-schnell", "object": "model"}]}

@app.post("/v1/images/generations")
def generate(r: Req):
    w, h = 1024, 1024
    try:
        if r.size and "x" in r.size:
            w, h = (int(x) for x in r.size.lower().split("x"))
    except Exception:
        pass
    w, h = min(w, 1024), min(h, 1024)
    image = pipe()(
        r.prompt, num_inference_steps=4, guidance_scale=0.0,
        width=w, height=h, max_sequence_length=256,
    ).images[0]
    buf = io.BytesIO(); image.save(buf, format="PNG")
    return {"data": [{"b64_json": base64.b64encode(buf.getvalue()).decode()}]}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("FLUX_PORT", "8080")))
