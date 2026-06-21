/**
 * seo-module.ts — SEO building blocks: metadata helpers, slugs, JSON-LD schema.org, and a dynamic
 * sitemap + robots route. buildMetadata() for Next metadata, slugify(), jsonLd(). Every public
 * product needs this to be found.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"

type AppFile = { path: string; content: string }

const SEO = `import type { Metadata } from "next"
export function slugify(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}
/** Build Next.js Metadata (title/description/OG/Twitter/canonical). */
export function buildMetadata(o: { title: string; description: string; path?: string; image?: string }): Metadata {
  const base = process.env.APP_URL || ""
  const url = base + (o.path || "")
  return {
    title: o.title, description: o.description, alternates: { canonical: url },
    openGraph: { title: o.title, description: o.description, url, images: o.image ? [o.image] : [] },
    twitter: { card: "summary_large_image", title: o.title, description: o.description, images: o.image ? [o.image] : [] },
  }
}
/** JSON-LD schema.org object → inject via a <script type="application/ld+json">. */
export function jsonLd(type: string, props: Record<string, unknown>): string {
  return JSON.stringify({ "@context": "https://schema.org", "@type": type, ...props })
}
`
const SITEMAP = `import { MetadataRoute } from "next"
// Add your dynamic URLs here (pull slugs from the DB).
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.APP_URL || "http://localhost:3000"
  return [{ url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 }]
}
`
const ROBOTS = `import { MetadataRoute } from "next"
export default function robots(): MetadataRoute.Robots {
  const base = process.env.APP_URL || "http://localhost:3000"
  return { rules: [{ userAgent: "*", allow: "/" }], sitemap: base + "/sitemap.xml" }
}
`

export function deterministicSeo(config: DomainConfig, bp: Blueprint): { files: AppFile[] } | null {
  const hay = `${config.identity.name} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  const wants = /seo|landing|blog|marketing|p[uú]blic|public|content|directorio|directory|marketplace|listing|ecommerce|e-commerce|tienda|web|sitemap|discover|organic|search engine/.test(hay)
  if (!wants) return null
  return { files: [{ path: "lib/seo.ts", content: SEO }, { path: "app/sitemap.ts", content: SITEMAP }, { path: "app/robots.ts", content: ROBOTS }] }
}
