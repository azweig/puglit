/** I'm Still Alive — public page after clicking the check-in link in a reminder. */
import Link from "next/link"
import config from "@/domain.config"
import { Mark } from "@/components/Mark"

export default function CheckinConfirmed() {
  const brand = config.identity.brandColor || "#4F46E5"
  return (
    <div className="min-h-screen flex items-center justify-center px-6 text-center" style={{ ["--brand" as string]: brand, background: "var(--paper, #faf9fd)" }}>
      <div className="max-w-md">
        <div className="flex justify-center text-brand mb-5"><Mark size={48} /></div>
        <div className="text-5xl mb-3">✓</div>
        <h1 className="text-2xl font-extrabold text-ink">You’re still alive — thanks for checking in.</h1>
        <p className="text-ink/60 mt-3">Your messages stay sealed. We’ll check on you again soon.</p>
        <div className="mt-7 flex gap-3 justify-center">
          <Link href="/app" className="px-5 py-2.5 rounded-lg text-white font-semibold" style={{ background: brand }}>Open dashboard</Link>
          <Link href="/" className="px-5 py-2.5 rounded-lg font-semibold text-ink border border-black/10">Home</Link>
        </div>
      </div>
    </div>
  )
}
