/**
 * POST /api/references
 * Optional FIRST step of the flow: the founder can hand Puglit references —
 * URLs / web pages, pasted text or documentation, and images (logos, screenshots,
 * mockups, diagrams). We fetch + read each, describe images with the vision model,
 * and synthesize ONE "reference digest" + concrete suggestions that then inform the
 * interview, the spec diagnosis and the build (data interpretation + suggestions).
 */
import { NextRequest, NextResponse } from "next/server"
import { chatJSON, aiConfigured, MODELS, supportsVision } from "@/lib/openai"

interface RefItem { type: "url" | "text" | "image"; value: string; name?: string }

/** Strip a fetched HTML page down to readable text. */
function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/\s+/g, " ").trim()
}

async function fetchUrl(url: string): Promise<string> {
  try {
    const u = /^https?:\/\//i.test(url) ? url : `https://${url}`
    const res = await fetch(u, { headers: { "User-Agent": "Mozilla/5.0 (compatible; PuglitBot/1.0)" }, signal: AbortSignal.timeout(12000) })
    if (!res.ok) return `(no se pudo leer ${url}: HTTP ${res.status})`
    const ct = res.headers.get("content-type") || ""
    const body = await res.text()
    const title = (body.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || "").trim()
    const text = ct.includes("html") || /^\s*</.test(body) ? htmlToText(body) : body
    return `URL ${u}${title ? ` — "${title}"` : ""}:\n${text.slice(0, 6000)}`
  } catch (e) {
    return `(no se pudo leer ${url}: ${(e as Error).message.slice(0, 60)})`
  }
}

/** Describe an image (data URL) with the vision model — for building, not captioning. */
async function describeImage(dataUrl: string, name?: string): Promise<string> {
  try {
    const out = (await chatJSON([
      { role: "system", content: `You analyze a reference image a founder gave for a product they want built. Describe ONLY what's useful for BUILDING it: if a UI/screenshot → layout, sections, components, color palette (guess hexes), typography vibe; if a logo → style, colors, monogram; if a diagram/spreadsheet/data → the entities/fields/relationships it implies; if a photo/mood → the aesthetic to match. Be concrete and buildable.
Return ONLY JSON {"kind":"ui|logo|diagram|data|mood|other","description":"...","palette":["#RRGGBB"],"entities":["..."]}.` },
      { role: "user", content: [
        { type: "text", text: `Reference image${name ? ` (${name})` : ""}. Analyze it for building the product.` },
        { type: "image_url", image_url: { url: dataUrl } },
      ] },
    ], { model: MODELS.premium, temperature: 0.2 })) as { kind?: string; description?: string; palette?: string[]; entities?: string[] }
    const pal = Array.isArray(out.palette) && out.palette.length ? ` · paleta: ${out.palette.join(", ")}` : ""
    const ent = Array.isArray(out.entities) && out.entities.length ? ` · entidades: ${out.entities.join(", ")}` : ""
    return `IMAGEN${name ? ` ${name}` : ""} [${out.kind || "other"}]: ${out.description || ""}${pal}${ent}`
  } catch {
    return `(no se pudo analizar la imagen${name ? ` ${name}` : ""})`
  }
}

export async function POST(request: NextRequest) {
  if (!aiConfigured()) return NextResponse.json({ error: "ai_not_configured" }, { status: 503 })
  try {
    const { items, productName } = await request.json()
    const list: RefItem[] = Array.isArray(items) ? items.slice(0, 12) : []
    if (!list.length) return NextResponse.json({ ok: true, digest: "", suggestions: [], detected: {} })

    // If the active model can't see (e.g. text-only local Gemma), degrade gracefully instead
    // of failing — analyze URLs/text normally and note the skipped images.
    const canSee = supportsVision()
    const parts = await Promise.all(list.map(async (it) => {
      if (it.type === "url") return await fetchUrl(String(it.value))
      if (it.type === "image") return canSee
        ? await describeImage(String(it.value), it.name)
        : `IMAGEN${it.name ? ` ${it.name}` : ""}: (no analizada — el modelo activo no soporta visión; configurá un modelo con visión o seteá PUGLIT_VISION=always)`
      return `TEXTO${it.name ? ` ${it.name}` : ""}:\n${String(it.value).slice(0, 6000)}`
    }))
    const raw = parts.join("\n\n---\n\n").slice(0, 24000)

    // Synthesize ONE buildable brief + concrete suggestions from everything.
    const out = (await chatJSON([
      { role: "system", content: `You are a product analyst. The founder gave references (web pages, docs, images) for a product${productName ? ` called "${productName}"` : ""} they want built. From the raw extracts, synthesize what MATTERS for building it: what the product seems to be, the visual/brand cues (colors, tone), the data structures/entities implied, the signature features to emulate, and any external data sources. Then give concrete SUGGESTIONS (what to reuse, what to clarify, what to improve). Write prose in the founder's likely language (Spanish if the references are in Spanish).
Return ONLY JSON: {"digest":"a tight markdown brief the interviewer and the builder will read","suggestions":["..."],"detected":{"productKind":"...","brandCues":"...","entities":["..."],"dataSources":["..."]}}.` },
      { role: "user", content: `Product: "${productName || "(sin nombre aún)"}".\n\nRAW REFERENCES:\n${raw}` },
    ], { model: MODELS.premium, temperature: 0.3 })) as { digest?: string; suggestions?: string[]; detected?: Record<string, unknown> }

    return NextResponse.json({
      ok: true,
      digest: String(out.digest || "").slice(0, 8000),
      suggestions: Array.isArray(out.suggestions) ? out.suggestions.slice(0, 8).map(String) : [],
      detected: out.detected || {},
    })
  } catch (e) {
    console.error("[references]", (e as Error).message)
    return NextResponse.json({ error: "references_failed" }, { status: 500 })
  }
}
