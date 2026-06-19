/**
 * /campus — the genetic campus: 3 competing team buildings, agents living & working,
 * click a building to zoom in. Server component + force-dynamic so it is NEVER statically
 * prerendered/cached (the RunPod proxy was serving a stale static copy). CampusStage is
 * the client component that runs the animation.
 */
import { CampusStage } from "@/components/CampusStage"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default function CampusPage() {
  return (
    <main className="min-h-screen bg-[#070a12] px-4 py-6 text-white">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-1 text-2xl font-extrabold">Campus genético · 3 equipos</h1>
        <p className="mb-4 text-sm text-white/50">Lean · Enterprise · Hacker compiten en paralelo. Click en un edificio para acercarte; click en un agente para su ficha RPG.</p>
        <CampusStage />
      </div>
    </main>
  )
}
