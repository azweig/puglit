/**
 * flights-module.ts — real-time flight / airline tracking. flightStatus(iata) → status, scheduled
 * vs actual times, delay, gate, terminal. Provider-agnostic: AviationStack by default, AeroDataBox
 * as an alt (both have free tiers). For travel, logistics ETAs, ops dashboards. env: AVIATIONSTACK_KEY
 * (or AERODATABOX_KEY + FLIGHTS_PROVIDER=aerodatabox).
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"

type AppFile = { path: string; content: string }

const FLIGHTS = `/** Status for a flight by IATA number (e.g. "AA100"). */
export async function flightStatus(flightIata: string) {
  const provider = process.env.FLIGHTS_PROVIDER || "aviationstack"
  try {
    if (provider === "aerodatabox") {
      const r = await fetch(\`https://aerodatabox.p.rapidapi.com/flights/number/\${flightIata}\`, { headers: { "X-RapidAPI-Key": process.env.AERODATABOX_KEY || "", "X-RapidAPI-Host": "aerodatabox.p.rapidapi.com" } }).then((x) => x.json())
      const f = Array.isArray(r) ? r[0] : r
      if (!f) return null
      return { status: f.status, departure: { airport: f.departure?.airport?.iata, scheduled: f.departure?.scheduledTime?.utc, actual: f.departure?.actualTime?.utc, terminal: f.departure?.terminal, gate: f.departure?.gate }, arrival: { airport: f.arrival?.airport?.iata, scheduled: f.arrival?.scheduledTime?.utc, actual: f.arrival?.actualTime?.utc, terminal: f.arrival?.terminal } }
    }
    const r = await fetch(\`https://api.aviationstack.com/v1/flights?access_key=\${process.env.AVIATIONSTACK_KEY || ""}&flight_iata=\${flightIata}\`).then((x) => x.json())
    const f = r.data?.[0]
    if (!f) return null
    return { status: f.flight_status, delayMin: f.departure?.delay || 0, departure: { airport: f.departure?.iata, scheduled: f.departure?.scheduled, actual: f.departure?.actual, terminal: f.departure?.terminal, gate: f.departure?.gate }, arrival: { airport: f.arrival?.iata, scheduled: f.arrival?.scheduled, estimated: f.arrival?.estimated, terminal: f.arrival?.terminal, gate: f.arrival?.gate } }
  } catch (e) { console.error("[flights]", (e as Error).message); return null }
}
`

export function deterministicFlights(config: DomainConfig, bp: Blueprint): { files: AppFile[] } | null {
  const hay = `${config.identity.name} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  const wants = /flight|vuelo|airline|aerol[ií]nea|aeropuerto|airport|travel|viaje|aviation|aero|departure|arrival|gate|terminal|boarding/.test(hay)
  if (!wants) return null
  return { files: [{ path: "lib/flights.ts", content: FLIGHTS }] }
}
