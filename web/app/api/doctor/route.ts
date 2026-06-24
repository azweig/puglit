/**
 * GET /api/doctor — verify the LLM setup, like a CLI `doctor`.
 *   /api/doctor        → which provider/models/capabilities are configured (no secrets)
 *   /api/doctor?ping=1 → also do ONE live call to confirm the premium provider is reachable
 * Use it after pointing Puglit at Ollama/Gemma, OpenAI, Gemini, Anthropic, or a custom URL.
 */
import { NextRequest, NextResponse } from "next/server"
import { readFileSync } from "fs"
import { join } from "path"
import { providerInfo, pingProvider } from "@/lib/openai"

// the git commit this server was BUILT from (written by infra/rebuild.sh) → verify the rebuild took
// effect instead of guessing about stale code: curl /api/doctor | jq .build  vs  git log --oneline -1
function buildStamp(): string {
  try { return readFileSync(join(process.cwd(), ".build-stamp"), "utf8").trim() } catch { return "unknown" }
}

export async function GET(request: NextRequest) {
  const info = { ...providerInfo(), build: buildStamp() }
  if (request.nextUrl.searchParams.get("ping") === "1") {
    const ping = await pingProvider()
    return NextResponse.json({ ...info, ping })
  }
  return NextResponse.json(info)
}
