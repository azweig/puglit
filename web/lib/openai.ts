/**
 * Puglit web — openai.ts
 * Thin OpenAI chat client (same provider/model family as TodoAstros: gpt-4o-mini).
 * JSON mode so the interview always returns a parseable structured step.
 */
export interface ChatMessage { role: "system" | "user" | "assistant"; content: unknown }

export function aiConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY
}

export async function chatJSON(messages: ChatMessage[], opts?: { model?: string; temperature?: number }): Promise<unknown> {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error("ai_not_configured")
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: opts?.model || "gpt-4o-mini",
      temperature: opts?.temperature ?? 0.5,
      response_format: { type: "json_object" },
      messages,
    }),
  })
  if (!res.ok) {
    throw new Error(`openai_${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`)
  }
  const data = await res.json()
  const content = data?.choices?.[0]?.message?.content
  if (!content) throw new Error("openai_empty")
  return JSON.parse(content)
}
