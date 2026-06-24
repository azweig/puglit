/**
 * Complexity TRIAGE — runs BEFORE the 3 teams compete, so the swarm sizes the effort to the product:
 * a "tool" (calculator/converter, no accounts/payments, one screen) builds fast and lean; a "platform"
 * (marketplace/social/booking, many entities + payments) gets the deep pipeline. The agent decides from
 * the idea — not from brittle keywords — and the reasoning is shown to the user.
 */
import { chatJSON, MODELS } from "@/lib/openai"

export interface Triage {
  complexity: "tool" | "app" | "platform"
  needsAuth: boolean
  needsPayments: boolean
  needsExternalData: boolean
  estTables: number
  oneScreen: boolean
  reasoning: string
}

export async function triageComplexity(name: string, description: string): Promise<Triage> {
  const out = (await chatJSON([
    { role: "system", content: `You triage a software product idea BEFORE building, to size the effort. Classify HONESTLY and conservatively — do NOT inflate a simple tool into a SaaS.
- "tool": a single-purpose utility anyone uses with NO account — calculator, converter, timer, generator, a single interactive widget. Usually ONE screen, client-side, 0-1 tables, NO login, NO payments. (e.g. "USD↔PEN converter", "kWh break-even calculator", "pomodoro", "QR generator", "unit converter".)
- "app": a real multi-screen product with persistent user data — CRUD app, tracker, blog/CMS, dashboard. A handful of tables; MAY need accounts.
- "platform": a deep multi-entity system — marketplace, social network, booking/rental, ERP, anything with payments + roles + complex domain rules. Many tables.
Decide: needsAuth (does each user need their OWN private data behind login?), needsPayments (does it charge money?), needsExternalData (live external feeds — prices/scores/weather?), estTables (rough), oneScreen (can the WHOLE product be one self-contained page?).
DEFAULT TO THE SIMPLER TIER when uncertain:
- "platform" ONLY if it clearly has MULTIPLE user-generated entities with relationships (marketplace, social network, booking/rental, ERP) OR payments + roles.
- "app" ONLY if each user genuinely saves PRIVATE data across sessions behind a login (a personal tracker with accounts, a CRUD with user data).
- EVERYTHING ELSE is "tool": any single interactive screen, any stateless utility, any calculator/converter/generator/viewer/timer/scanner — even if it fetches a public API, has a few inputs, a chart, OR shows MANY outputs at once. Multiple OUTPUTS/columns/results are NOT multiple entities: a converter that turns one currency into 7 currencies simultaneously (ARS/PEN/USD/COP/MXN/CLP/BOB) is ONE "tool" with one screen — NOT a platform. A dashboard that just displays computed values is a tool. A tool can fetch public data and still be a "tool". Most ideas are tools.
Be conservative: do NOT inflate. If you can imagine the whole thing as one page anyone opens and uses immediately with no signup, it is a "tool".
Return ONLY JSON: {"complexity":"tool|app|platform","needsAuth":bool,"needsPayments":bool,"needsExternalData":bool,"estTables":int,"oneScreen":bool,"reasoning":"one short sentence in Spanish explaining the call"}` },
    { role: "user", content: `Name: ${name}\nWhat: ${description}` },
  ], { model: MODELS.premium, temperature: 0 }).catch(() => null)) as Partial<Triage> | null
  return {
    complexity: out?.complexity === "platform" ? "platform" : out?.complexity === "app" ? "app" : "tool",
    needsAuth: !!out?.needsAuth,
    needsPayments: !!out?.needsPayments,
    needsExternalData: !!out?.needsExternalData,
    estTables: Math.max(0, Math.min(40, Number(out?.estTables) || 0)),
    oneScreen: out?.oneScreen !== false,
    reasoning: typeof out?.reasoning === "string" ? out.reasoning.slice(0, 200) : "",
  }
}
