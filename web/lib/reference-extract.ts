/**
 * reference-extract.ts — ground the blueprint in REALITY via the ScrapeGraphAI sidecar.
 * When a reference URL is provided AND the sidecar is up (PUGLIT_SCRAPEGRAPH_URL), it extracts the
 * real product's entities + surfaces from the LIVE page (ScrapeGraphAI on local Ollama — free, self-
 * hosted) instead of the architect guessing from memory. No-op (returns "") if the sidecar isn't
 * configured, so builds keep working without it. See infra/scrapegraph-sidecar.py.
 */
const sidecar = () => (process.env.PUGLIT_SCRAPEGRAPH_URL || "").replace(/\/$/, "")
const urlsIn = (text: string) => Array.from(new Set((text.match(/https?:\/\/[^\s)"'<>]+/g) || []).map((u) => u.replace(/[.,)]+$/, "")))).slice(0, 2)

/** Extract the real product's entities + surfaces from a live URL (structured, for blueprint grounding). */
export async function extractStructure(url: string, productName: string): Promise<string> {
  const base = sidecar(); if (!base) return ""
  try {
    const r = await fetch(`${base}/extract`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, prompt: `We are cloning "${productName}". Extract this product's STRUCTURE: the distinct ENTITIES/data tables behind it and the main PAGES/surfaces with their key sections. Return {"entities":["..."],"surfaces":"markdown: page → features"}.` }),
      signal: AbortSignal.timeout(75000),
    }).then((x) => x.json())
    const ents: string[] = Array.isArray(r?.result?.entities) ? r.result.entities.filter(Boolean) : []
    const surf = String(r?.result?.surfaces || "").trim()
    if (!ents.length && !surf) return ""
    return [`REAL STRUCTURE extracted from ${url}:`, ents.length ? `Entities: ${ents.join(", ")}` : "", surf ? `Surfaces:\n${surf}` : ""].filter(Boolean).join("\n")
  } catch { return "" }
}

/** Ground any URLs found in a references blob (no-op without the sidecar / without URLs). */
export async function groundReferences(referencesText: string, productName: string): Promise<string> {
  if (!sidecar() || !referencesText) return ""
  const urls = urlsIn(referencesText); if (!urls.length) return ""
  const parts = await Promise.all(urls.map((u) => extractStructure(u, productName).catch(() => "")))
  return parts.filter(Boolean).join("\n\n")
}
