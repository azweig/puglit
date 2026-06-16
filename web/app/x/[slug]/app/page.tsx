/**
 * /x/[slug]/app — the FUNCTIONAL demo app. Auth-gated (demo session cookie),
 * renders a real CRUD dashboard over the project's AI-designed entities,
 * persisted per-user in Puglit's DB.
 */
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getProject } from "@/lib/db"
import { readSession } from "@/lib/demo-auth"
import { DemoDashboard } from "@/components/DemoDashboard"

export const dynamic = "force-dynamic"

export default async function DemoApp({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const token = (await cookies()).get(`pd_${slug}`)?.value
  const session = readSession(token)
  if (!session || session.slug !== slug) redirect(`/x/${slug}`)

  const project = await getProject(slug)
  if (!project) redirect(`/x/${slug}`)

  return (
    <DemoDashboard
      slug={slug}
      productName={project.config.identity.name}
      brand={project.config.identity.brandColor || "#7C3AED"}
      userName={session!.name}
      entities={(project.config.entities || []).map((e) => ({ name: e.name, plural: e.plural || e.name, fields: e.fields }))}
    />
  )
}
