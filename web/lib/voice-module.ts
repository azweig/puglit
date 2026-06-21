/**
 * voice-module.ts — the "voice first" capability (STT listen + TTS speak), provider-agnostic.
 * A voice note → text (the agent acts on it); a reply → audio. Three ways, same interface:
 *   - ElevenLabs (BYOK, best quality): ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID
 *   - OpenAI / Groq (BYOK): VOICE_BASE_URL, VOICE_API_KEY
 *   - LOCAL & FREE: point VOICE_BASE_URL at an OpenAI-compatible server wrapping an open model —
 *     STT: Whisper (faster-whisper/whisper.cpp), Voxtral, NVIDIA Parakeet;
 *     TTS: Voxtral (Mistral), Piper, XTTS/Coqui (voice clone), OmniVoice Studio.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"

type AppFile = { path: string; content: string }

const VOICE = `// Voice — speech-to-text (transcribe) + text-to-speech (speak). Provider-agnostic.
const provider = () => process.env.VOICE_PROVIDER || (process.env.ELEVENLABS_API_KEY ? "elevenlabs" : "openai")

/** Speech → text. Pass the raw audio bytes (ogg/mp3/wav). */
export async function transcribe(audio: Buffer | Uint8Array, filename = "audio.ogg"): Promise<string> {
  try {
    if (provider() === "elevenlabs") {
      const fd = new FormData()
      fd.append("file", new Blob([audio as any]), filename)
      fd.append("model_id", "scribe_v1")
      const r = await fetch("https://api.elevenlabs.io/v1/speech-to-text", { method: "POST", headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY || "" }, body: fd }).then((x) => x.json())
      return r.text || ""
    }
    // OpenAI-compatible (OpenAI / Groq whisper-large-v3 / local Whisper-Voxtral server)
    const base = (process.env.VOICE_BASE_URL || "https://api.openai.com/v1").replace(/\\/$/, "")
    const fd = new FormData()
    fd.append("file", new Blob([audio as any]), filename)
    fd.append("model", process.env.STT_MODEL || "whisper-1")
    const r = await fetch(\`\${base}/audio/transcriptions\`, { method: "POST", headers: process.env.VOICE_API_KEY ? { Authorization: "Bearer " + process.env.VOICE_API_KEY } : {}, body: fd }).then((x) => x.json())
    return r.text || ""
  } catch (e) { console.error("[voice] stt", (e as Error).message); return "" }
}

/** Text → speech. Returns audio bytes (mp3). */
export async function speak(text: string): Promise<Buffer | null> {
  try {
    if (provider() === "elevenlabs") {
      const voice = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM"
      const r = await fetch(\`https://api.elevenlabs.io/v1/text-to-speech/\${voice}\`, { method: "POST", headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY || "", "Content-Type": "application/json" }, body: JSON.stringify({ text, model_id: "eleven_multilingual_v2" }) })
      return Buffer.from(await r.arrayBuffer())
    }
    // OpenAI-compatible (OpenAI tts-1 / local Voxtral-Piper-XTTS server)
    const base = (process.env.VOICE_BASE_URL || "https://api.openai.com/v1").replace(/\\/$/, "")
    const r = await fetch(\`\${base}/audio/speech\`, { method: "POST", headers: { "Content-Type": "application/json", ...(process.env.VOICE_API_KEY ? { Authorization: "Bearer " + process.env.VOICE_API_KEY } : {}) }, body: JSON.stringify({ model: process.env.TTS_MODEL || "tts-1", voice: process.env.TTS_VOICE || "alloy", input: text }) })
    return Buffer.from(await r.arrayBuffer())
  } catch (e) { console.error("[voice] tts", (e as Error).message); return null }
}
`

// A ready API route so the frontend can speak text (GET ?text=…) or transcribe an upload (POST).
const VOICE_ROUTE = `import { NextRequest, NextResponse } from "next/server"
import { speak, transcribe } from "@/lib/voice"
export async function GET(req: NextRequest) {
  const text = req.nextUrl.searchParams.get("text") || ""
  const audio = await speak(text)
  if (!audio) return NextResponse.json({ error: "tts failed" }, { status: 500 })
  return new NextResponse(audio as any, { headers: { "Content-Type": "audio/mpeg" } })
}
export async function POST(req: NextRequest) {
  const fd = await req.formData()
  const f = fd.get("file") as File | null
  if (!f) return NextResponse.json({ error: "no file" }, { status: 400 })
  const text = await transcribe(Buffer.from(await f.arrayBuffer()), f.name)
  return NextResponse.json({ text })
}
`

/** Inject the voice module when the product needs listening/speaking. */
export function deterministicVoice(config: DomainConfig, bp: Blueprint): { files: AppFile[] } | null {
  const tagline = typeof config.identity.tagline === "string" ? config.identity.tagline : ""
  const hay = `${config.identity.name} ${tagline} ${bp.summary}`.toLowerCase()
  const wants = /\bvoz\b|\bvoice\b|audio|dictado|dictation|transcrib|podcast|hablar|escuchar|speech|tts|stt|voice note|nota de voz|asistente|assistant|jarvis|chief of staff/.test(hay)
  if (!wants) return null
  return { files: [{ path: "lib/voice.ts", content: VOICE }, { path: "app/api/voice/route.ts", content: VOICE_ROUTE }] }
}
