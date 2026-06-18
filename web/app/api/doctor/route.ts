/**
 * GET /api/doctor — verify the LLM setup, like a CLI `doctor`.
 *   /api/doctor        → which provider/models/capabilities are configured (no secrets)
 *   /api/doctor?ping=1 → also do ONE live call to confirm the premium provider is reachable
 * Use it after pointing Puglit at Ollama/Gemma, OpenAI, Gemini, Anthropic, or a custom URL.
 */
import { NextRequest, NextResponse } from "next/server"
import { providerInfo, pingProvider } from "@/lib/openai"

export async function GET(request: NextRequest) {
  const info = providerInfo()
  if (request.nextUrl.searchParams.get("ping") === "1") {
    const ping = await pingProvider()
    return NextResponse.json({ ...info, ping })
  }
  return NextResponse.json(info)
}
