"use client"

/** A toggleable chip used to assign which people share an item. */
export function PersonChip({
  name,
  active,
  onToggle,
}: {
  name: string
  active: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className="px-3 py-2 rounded-full text-sm font-semibold border transition-colors min-h-[40px]"
      style={
        active
          ? { background: "var(--brand)", color: "#fff", borderColor: "var(--brand)" }
          : { background: "transparent", color: "var(--ink)", borderColor: "rgba(0,0,0,0.15)" }
      }
    >
      {name}
    </button>
  )
}
