/** Puglit web — the curated seed examples (already deployed live demos). */
export interface SeedExample {
  slug: string
  name: string
  category: string
  headline: string
  color: string
  modules: string[]
  live: string
}

export const SEEDS: SeedExample[] = [
  { slug: "mesa", name: "Mesa", category: "AI meal planning", headline: "Eat well without thinking.", color: "#10B981", modules: ["payments", "aiLayer", "contentBlog", "email"], live: "https://puglit-spine.vercel.app" },
  { slug: "pulso", name: "Pulso", category: "Adaptive AI fitness coach", headline: "A coach that adapts to you, not the other way around.", color: "#F97316", modules: ["engine", "aiLayer", "gamification", "mobile", "profiling"], live: "https://puglit-demo-pulso.vercel.app" },
  { slug: "lumi", name: "Lumi", category: "Personalized AI bedtime stories", headline: "Every night, a story made just for your little one.", color: "#6366F1", modules: ["aiLayer", "contentBlog", "payments", "gamification"], live: "https://puglit-demo-lumi.vercel.app" },
  { slug: "cancha", name: "Cancha", category: "Amateur football, organized", headline: "Even teams. Zero arguments.", color: "#16A34A", modules: ["engine", "geo", "gamification", "growth", "payments"], live: "https://puglit-demo-cancha.vercel.app" },
  { slug: "boleta", name: "Boleta", category: "Invoicing for LATAM", headline: "Stop fighting with invoices. Get paid faster.", color: "#2563EB", modules: ["payments", "email", "geo", "growth"], live: "https://puglit-demo-boleta.vercel.app" },
]
