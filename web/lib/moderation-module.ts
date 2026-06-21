/**
 * moderation-module.ts — content moderation: a fast wordlist/heuristic pass + an optional LLM
 * classifier (via the llm module) for nuanced cases. moderate(text) → { allowed, reason, score }.
 * Protect any UGC surface (comments, listings, chat, profiles) from spam/abuse/NSFW.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"

type AppFile = { path: string; content: string }

const MOD = `const BANNED = (process.env.MODERATION_WORDS || "").toLowerCase().split(",").map((w) => w.trim()).filter(Boolean)
const PII = /\\b(\\d{16}|\\d{3}-\\d{2}-\\d{4})\\b/ // naive card / SSN

/** Quick local check (free, instant). */
export function quickModerate(text: string): { allowed: boolean; reason?: string } {
  const t = text.toLowerCase()
  if (BANNED.some((w) => w && t.includes(w))) return { allowed: false, reason: "banned-term" }
  if (PII.test(text)) return { allowed: false, reason: "pii" }
  if ((text.match(/https?:\\/\\//g) || []).length > 4) return { allowed: false, reason: "spam-links" }
  return { allowed: true }
}

/** Deeper check via the LLM (toxicity/NSFW/spam) — needs the llm module configured. */
export async function moderate(text: string): Promise<{ allowed: boolean; reason?: string; score?: number }> {
  const quick = quickModerate(text)
  if (!quick.allowed) return quick
  try {
    const { extractJSON } = await import("@/lib/llm")
    const r = await extractJSON<{ toxic: boolean; category: string; score: number }>(\`Moderate this text for toxicity/hate/NSFW/spam. Text: """\${text.slice(0, 1000)}"""\`, '{ "toxic": boolean, "category": string, "score": number 0-1 }')
    if (r && (r.toxic || r.score > 0.7)) return { allowed: false, reason: r.category, score: r.score }
  } catch {}
  return { allowed: true }
}
`

export function deterministicModeration(config: DomainConfig, bp: Blueprint): { files: AppFile[] } | null {
  const hay = `${config.identity.name} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  const wants = /moderat|moderaci|ugc|user.generated|content|comment|chat|review|listing|post|community|comunidad|spam|abuse|nsfw|safety|profanity/.test(hay)
  if (!wants) return null
  return { files: [{ path: "lib/moderation.ts", content: MOD }] }
}
