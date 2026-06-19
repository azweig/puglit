"use client"
/**
 * /campus — the genetic campus: 3 competing team buildings, agents living & working,
 * click a building to zoom in. Demo-driven for now; wires to a live tournament next.
 */
import { CampusStage } from "@/components/CampusStage"

export default function CampusPage() {
  return (
    <main className="min-h-screen bg-[#070a12] px-4 py-6 text-white">
      {/* TEMP version marker — confirms the pod is serving the NEW build. Remove after. */}
      <div className="mb-4 rounded-xl bg-fuchsia-500 px-5 py-4 text-center text-2xl font-black text-white shadow-lg">
        🟢 BUILD v8 — si ves este cartel fucsia, el código nuevo ESTÁ live ✅
      </div>
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-1 text-2xl font-extrabold">Campus genético · 3 equipos</h1>
        <p className="mb-4 text-sm text-white/50">Lean · Enterprise · Hacker compiten en paralelo. Click en un edificio para acercarte; click en un agente para su ficha RPG.</p>
        <CampusStage />
      </div>
    </main>
  )
}
