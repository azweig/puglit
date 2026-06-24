/** GET /api/admin/test-landing?name=&what=&color=  → generates ONLY the landing/tool HTML (one LLM call,
 *  ~30-60s) and returns it directly, so you can verify the landing/tool output WITHOUT a full 30-min build. */
import { NextRequest, NextResponse } from "next/server"
import { generateConfig, type IntakeAnswers } from "@/lib/generate"
import { generateLandingHtml } from "@/lib/landing-gen"

export async function GET(req: NextRequest) {
  const u = new URL(req.url)
  const answers = {
    name: u.searchParams.get("name") || "Calc kWh Bogotá",
    what: u.searchParams.get("what") || "calculadora de kWh: ingresar consumo, tarifa casa, tarifa calle, costo instalacion y parqueadero; compara el costo mensual casa (instalacion amortizada) vs calle (kWh + parqueadero), muestra el punto de equilibrio en meses, cual conviene, y un grafico de las dos curvas de costo cruzandose",
    audience: "uno mismo", monetization: "free", price: 0,
    color: u.searchParams.get("color") || "#1E488F",
    languages: "es", benefits: [], modules: [], email: "",
  } as unknown as IntakeAnswers
  const config = generateConfig(answers)
  let html: string | null = null
  try { html = await generateLandingHtml(config, undefined, true) } catch (e) { html = `<pre>ERROR: ${(e as Error).message}</pre>` }
  if (!html) html = "<pre>generateLandingHtml returned NULL (the model call failed). Check the model is pulled + the server log.</pre>"
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } })
}
