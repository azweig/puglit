/**
 * maps-module.ts — the LOCATION stack, all open-source / no API key. Complements the existing
 * Haversine "nearby" math with the pieces it was missing:
 *   - maps (UI): Leaflet + OpenStreetMap tiles — free, no key, loaded from CDN (no npm dep)
 *   - IP geolocation: ip-api (free); MaxMind GeoLite2 for offline self-host
 *   - geocoding (address ↔ coords): Nominatim (OpenStreetMap) — free, self-hostable
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"

type AppFile = { path: string; content: string }

// IP → location. env: IPGEO_URL (override). Free default: ip-api.com (no key).
const IP = `// IP geolocation — free, no key (ip-api.com). For offline/self-host use MaxMind GeoLite2.
export function clientIP(req: Request): string {
  const h = req.headers
  return (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "").trim()
}
export async function locateIP(ip: string): Promise<{ lat: number; lng: number; city?: string; country?: string } | null> {
  if (!ip || ip.startsWith("127.") || ip === "::1") return null
  try {
    const base = process.env.IPGEO_URL || "http://ip-api.com/json"
    const r = await fetch(\`\${base}/\${ip}?fields=status,lat,lon,city,country\`).then((x) => x.json())
    if (r.status && r.status !== "success") return null
    return { lat: r.lat, lng: r.lon, city: r.city, country: r.country }
  } catch { return null }
}
`

// address ↔ coords via Nominatim (OpenStreetMap). Free; respect 1 req/s, or self-host + GEOCODE_URL.
const GEOCODE = `const base = () => (process.env.GEOCODE_URL || "https://nominatim.openstreetmap.org").replace(/\\/$/, "")
const UA = { "User-Agent": "puglit-app" }
export async function geocode(address: string): Promise<{ lat: number; lng: number; display: string } | null> {
  try {
    const r = await fetch(\`\${base()}/search?format=json&limit=1&q=\${encodeURIComponent(address)}\`, { headers: UA }).then((x) => x.json())
    return r[0] ? { lat: parseFloat(r[0].lat), lng: parseFloat(r[0].lon), display: r[0].display_name } : null
  } catch { return null }
}
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const r = await fetch(\`\${base()}/reverse?format=json&lat=\${lat}&lon=\${lng}\`, { headers: UA }).then((x) => x.json())
    return r?.display_name || null
  } catch { return null }
}
`

// Map component — Leaflet + OpenStreetMap, free, no key, no npm dep (loaded from CDN).
const MAP = `"use client"
import { useEffect, useRef } from "react"
type Marker = { lat: number; lng: number; label?: string }
export function Map({ markers = [], center, zoom = 13, height = 400 }: { markers?: Marker[]; center?: [number, number]; zoom?: number; height?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let map: any
    const init = () => {
      const L = (window as any).L
      if (!L || !ref.current || ref.current.dataset.init) return
      ref.current.dataset.init = "1"
      const c = center || (markers[0] ? [markers[0].lat, markers[0].lng] : [0, 0])
      map = L.map(ref.current).setView(c, zoom)
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap", maxZoom: 19 }).addTo(map)
      for (const m of markers) L.marker([m.lat, m.lng]).addTo(map).bindPopup(m.label || "")
    }
    if (!(window as any).L) {
      const css = document.createElement("link"); css.rel = "stylesheet"; css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"; document.head.appendChild(css)
      const s = document.createElement("script"); s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"; s.onload = init; document.body.appendChild(s)
    } else init()
    return () => { try { map?.remove() } catch {} }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(markers)])
  return <div ref={ref} style={{ height, width: "100%", borderRadius: 12, zIndex: 0 }} />
}
`

// A ready route: detect the caller's location from their IP.
const WHEREAMI = `import { NextRequest, NextResponse } from "next/server"
import { clientIP, locateIP } from "@/lib/location/ip"
export async function GET(req: NextRequest) {
  const loc = await locateIP(clientIP(req))
  return NextResponse.json({ ok: true, location: loc })
}
`

/** Inject the maps/location stack when the product deals with maps, places or location. */
export function deterministicMaps(config: DomainConfig, bp: Blueprint): { files: AppFile[] } | null {
  const tagline = typeof config.identity.tagline === "string" ? config.identity.tagline : ""
  const hay = `${config.identity.name} ${tagline} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  const wants = /\bmapa?s?\b|\bmap\b|ubicaci|location|nearby|cerca|cercan|geoloc|geocod|direcci|address|lat\b|lng|lon\b|place|lugar|restaurant|tienda|sucursal|branch|store|delivery|reparto/.test(hay)
  if (!wants) return null
  return {
    files: [
      { path: "lib/location/ip.ts", content: IP },
      { path: "lib/location/geocode.ts", content: GEOCODE },
      { path: "components/Map.tsx", content: MAP },
      { path: "app/api/whereami/route.ts", content: WHEREAMI },
    ],
  }
}
