/**
 * Puglit Spine — /app dashboard layout. Auth-gated (redirects to /login) with a
 * fixed config-driven sidebar. Everything under /app is the logged-in product.
 */
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { verifyJWT } from "@/lib/auth"
import { AppSidebar } from "@/components/AppSidebar"

export const dynamic = "force-dynamic"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get("auth_token")?.value
  const user = token ? await verifyJWT(token) : null
  if (!user) redirect("/login")

  return (
    <div className="min-h-screen bg-paper text-ink">
      <AppSidebar />
      <main className="lg:pl-64">
        <div className="max-w-4xl mx-auto px-5 py-8">{children}</div>
      </main>
    </div>
  )
}
