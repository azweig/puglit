/** Puglit Spine — /app/[entity]: CRUD page for one declared entity. */
import { notFound } from "next/navigation"
import config from "@/domain.config"
import { EntityManager } from "@/components/EntityManager"

export const dynamic = "force-dynamic"

export default async function EntityPage({ params }: { params: Promise<{ entity: string }> }) {
  const { entity } = await params
  const e = (config.entities || []).find((x) => x.name === entity)
  if (!e) notFound()
  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-6">{e.plural || e.name}</h1>
      <EntityManager name={e.name} plural={e.plural || e.name} fields={e.fields} />
    </div>
  )
}
