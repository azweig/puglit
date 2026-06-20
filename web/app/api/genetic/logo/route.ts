/**
 * /api/genetic/logo — quick art-director logo test.
 *   GET           → is an image provider configured? (provider/model)
 *   POST {name,what,color} → generate a REAL logo for that product → { dataUri, prompt }
 * Lets you verify image generation works before wiring it into a full build.
 */
import { NextRequest, NextResponse } from "next/server"
import { generateBrandLogo } from "@/lib/art-director"
import { imageGenAvailable, imageProviderInfo } from "@/lib/image-gen"
import type { DomainConfig } from "@/lib/domain-types"

export async function GET() {
  return NextResponse.json({ ok: true, available: imageGenAvailable(), ...imageProviderInfo() })
}

export async function POST(request: NextRequest) {
  try {
    if (!imageGenAvailable())
      return NextResponse.json({ ok: false, error: "sin proveedor de imágenes — seteá OPENAI_API_KEY (gpt-image-1) o PUGLIT_IMAGE_URL (FLUX/SDXL local OpenAI-compatible)", ...imageProviderInfo() }, { status: 400 })
    const a = (await request.json().catch(() => ({}))) as { name?: string; what?: string; color?: string }
    const config = {
      identity: { name: a.name || "Producto", tagline: a.what || "", domain: "", languages: ["es"], brandColor: a.color || "#7C3AED" },
    } as DomainConfig
    const logo = await generateBrandLogo(config)
    if (!logo) return NextResponse.json({ ok: false, error: "la generación devolvió vacío", ...imageProviderInfo() }, { status: 500 })
    return NextResponse.json({ ok: true, prompt: logo.prompt, dataUri: logo.dataUri, ...imageProviderInfo() })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}
