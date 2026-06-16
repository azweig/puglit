/**
 * SplitSnap — /api/ocr
 * Receipt OCR via OpenAI vision (gpt-4o). Public, no auth.
 * POST { image: string (data URL) } → { items: {name,price}[], tax, total }
 */
import { NextRequest, NextResponse } from "next/server"

interface OcrItem { name: string; price: number }

/** Coerce an arbitrary value to a finite number (handles "$12.50", "12,50" etc.). */
function toNumber(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0
  if (typeof v === "string") {
    const cleaned = v.replace(/[^0-9.,-]/g, "").replace(/,(?=\d{3}\b)/g, "").replace(",", ".")
    const n = parseFloat(cleaned)
    return Number.isFinite(n) ? n : 0
  }
  return 0
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "ocr_not_configured" }, { status: 503 })
  }

  try {
    const { image } = await request.json()
    if (!image || typeof image !== "string") {
      return NextResponse.json({ error: "missing_image" }, { status: 400 })
    }

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract the line items (name, price as number), the tax amount, and the total from this receipt. Return JSON {items:[{name,price}], tax, total}. Prices as plain numbers.",
              },
              {
                type: "image_url",
                image_url: { url: image },
              },
            ],
          },
        ],
      }),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => "")
      console.error("OCR upstream error:", res.status, detail.slice(0, 500))
      return NextResponse.json({ error: "ocr_failed" }, { status: 502 })
    }

    const completion = await res.json()
    const content: unknown = completion?.choices?.[0]?.message?.content
    if (typeof content !== "string") {
      return NextResponse.json({ error: "ocr_failed" }, { status: 502 })
    }

    const parsed = JSON.parse(content)

    const items: OcrItem[] = Array.isArray(parsed?.items)
      ? parsed.items.map((it: any) => ({
          name: typeof it?.name === "string" ? it.name : String(it?.name ?? ""),
          price: toNumber(it?.price),
        }))
      : []

    const tax = toNumber(parsed?.tax)
    const total = toNumber(parsed?.total)

    return NextResponse.json({ items, tax, total })
  } catch (error) {
    console.error("OCR error:", error)
    return NextResponse.json({ error: "ocr_failed" }, { status: 502 })
  }
}
