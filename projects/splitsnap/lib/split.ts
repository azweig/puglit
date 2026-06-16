/**
 * SplitSnap — pure split math.
 * Each item's price is divided equally among the people sharing it (sharedBy);
 * an empty sharedBy means the item is split among everyone. Tax and tip are
 * computed per-person as a percentage of that person's subtotal, then added.
 * All money values are rounded to cents. The frontend imports these names —
 * do not rename them.
 */

export interface SplitItem {
  id: string
  name: string
  price: number
  sharedBy: string[] // person names sharing this item; [] means split among everyone
}

export interface SplitInput {
  items: SplitItem[]
  people: string[]
  taxPct: number
  tipPct: number
}

export interface PersonShare {
  name: string
  subtotal: number
  tax: number
  tip: number
  total: number
}

/** Round to cents (2 decimals), avoiding binary-float drift. */
function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

export function computeSplit(input: SplitInput): { shares: PersonShare[]; grandTotal: number } {
  const people = Array.isArray(input.people) ? input.people : []
  const items = Array.isArray(input.items) ? input.items : []

  // 0 people → nothing to split.
  if (people.length === 0) {
    return { shares: [], grandTotal: 0 }
  }

  const taxPct = Number.isFinite(input.taxPct) ? input.taxPct : 0
  const tipPct = Number.isFinite(input.tipPct) ? input.tipPct : 0

  // Accumulate each person's raw subtotal.
  const rawSubtotal = new Map<string, number>()
  for (const name of people) rawSubtotal.set(name, 0)

  for (const item of items) {
    const price = Number.isFinite(item.price) ? item.price : 0
    // Who shares this item? Restrict to known people; fall back to everyone.
    const explicit = Array.isArray(item.sharedBy)
      ? item.sharedBy.filter((n) => rawSubtotal.has(n))
      : []
    const sharers = explicit.length > 0 ? explicit : people
    if (sharers.length === 0) continue
    const perPerson = price / sharers.length
    for (const name of sharers) {
      rawSubtotal.set(name, (rawSubtotal.get(name) || 0) + perPerson)
    }
  }

  let grandTotal = 0
  const shares: PersonShare[] = people.map((name) => {
    const subtotal = round2(rawSubtotal.get(name) || 0)
    const tax = round2(subtotal * (taxPct / 100))
    const tip = round2(subtotal * (tipPct / 100))
    const total = round2(subtotal + tax + tip)
    grandTotal += total
    return { name, subtotal, tax, tip, total }
  })

  return { shares, grandTotal: round2(grandTotal) }
}
