/** Puglit Spine — /app overview. Cards for each entity in the product. */
import Link from "next/link"
import config from "@/domain.config"

export default function Overview() {
  const entities = config.entities || []
  return (
    <div>
      <h1 className="text-2xl font-extrabold">Welcome to {config.identity.name}</h1>
      <p className="text-ink/60 mt-1">Manage everything below.</p>
      <div className="mt-6 grid sm:grid-cols-2 gap-4">
        {entities.map((e) => (
          <Link key={e.name} href={`/app/${e.name}`} className="block bg-white border border-black/5 rounded-2xl p-5 shadow-sm hover:border-brand/40 transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: "var(--brand)" }}>{e.name.slice(0, 1)}</div>
              <div>
                <div className="font-bold">{e.plural || e.name}</div>
                <div className="text-ink/50 text-sm">{e.fields.length} fields</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
