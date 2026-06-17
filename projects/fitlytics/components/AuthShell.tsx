import Link from "next/link"
import config from "@/domain.config"
import { Mark } from "@/components/Mark"

/** Centered card used by /login and /register. */
export function AuthShell({ title, children, footer }: { title: string; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <div className="min-h-screen grid-bg flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center gap-2 justify-center text-brand mb-8">
          <Mark size={34} />
          <span className="font-extrabold text-ink text-xl tracking-tight">{config.identity.name}</span>
        </Link>
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-7">
          <h1 className="text-xl font-extrabold text-ink mb-5">{title}</h1>
          {children}
        </div>
        <p className="text-center text-sm text-ink/60 mt-5">{footer}</p>
      </div>
    </div>
  )
}

export const fieldClass = "w-full px-3.5 py-2.5 rounded-lg border border-black/10 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 text-ink"
export const submitClass = "w-full px-4 py-2.5 rounded-lg text-white font-semibold disabled:opacity-60"
