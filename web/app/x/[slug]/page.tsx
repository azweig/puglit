/**
 * /x/[slug] — live preview of a generated project, rendered straight from its
 * stored DomainConfig. No per-project deploy: one renderer, every example live.
 */
import Link from "next/link"
import { getProject } from "@/lib/db"
import { Landing } from "@/components/Landing"
import { DemoAuthOverlay } from "@/components/DemoAuthOverlay"

export const dynamic = "force-dynamic"

export default async function PreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const project = await getProject(slug)

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 gap-4">
        <h1 className="text-2xl font-extrabold">Preview not found</h1>
        <p className="text-white/60">This example isn’t available yet (the database may not be connected).</p>
        <Link href="/" className="text-violet-bright font-semibold">← Back to Puglit</Link>
      </div>
    )
  }
  return (
    <>
      <Landing config={project.config} />
      <DemoAuthOverlay
        slug={project.slug}
        productName={project.config.identity.name}
        entity={project.config.entities?.[0]?.plural || project.config.entities?.[0]?.name}
        color={project.config.identity.brandColor}
      />
    </>
  )
}
