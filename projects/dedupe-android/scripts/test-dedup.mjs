// Unit test for the core duplicate-detection logic (no device needed).
// Run: node scripts/test-dedup.mjs
import { findDuplicates, totalReclaimable, defaultDeletion, fingerprint, formatBytes } from "../lib/dedup.ts"

let pass = 0, fail = 0
const ok = (c, m) => { c ? pass++ : fail++; console.log(c ? "✅ " + m : "❌ " + m) }

const assets = [
  { id: "1", uri: "a", filename: "IMG_001.jpg", size: 2_000_000, hash: "aaa", kind: "image" },
  { id: "2", uri: "b", filename: "IMG_001 (1).jpg", size: 2_000_000, hash: "aaa", kind: "image" }, // dup of 1 by hash
  { id: "3", uri: "c", filename: "IMG_001 (2).jpg", size: 2_000_000, hash: "aaa", kind: "image" }, // dup of 1 by hash
  { id: "4", uri: "d", filename: "vacaciones.png", size: 500_000, hash: "bbb", kind: "image" },     // unique
  { id: "5", uri: "e", filename: "doc.pdf", size: 1_000_000, kind: "document" },                    // no hash
  { id: "6", uri: "f", filename: "doc (1).pdf", size: 1_000_000, kind: "document" },                // dup of 5 by size+name
]

const groups = findDuplicates(assets)
ok(groups.length === 2, `2 duplicate groups found (got ${groups.length})`)
const big = groups[0]
ok(big.assets.length === 3 && big.assets.every((a) => a.hash === "aaa"), "the 3 hash-identical images grouped together")
ok(big.reclaimableBytes === 4_000_000, `reclaimable for the image group = 4MB (got ${big.reclaimableBytes})`)
ok(groups[1].assets.length === 2, "the 2 same-size+name PDFs grouped (no-hash fallback)")
ok(totalReclaimable(groups) === 5_000_000, `total reclaimable = 5MB (got ${totalReclaimable(groups)})`)
ok(groups[0].reclaimableBytes >= groups[1].reclaimableBytes, "groups sorted by reclaimable desc")
const del = defaultDeletion(groups)
ok(del.length === 3 && !del.includes("1") && !del.includes("5"), "default deletion keeps one per group, marks the rest")
ok(fingerprint(assets[0]) === fingerprint(assets[1]), "hash fingerprint matches across renamed copies")
ok(formatBytes(5_000_000) === "4.8 MB", `formatBytes works (${formatBytes(5_000_000)})`)
// negative: all-unique
ok(findDuplicates([assets[3]]).length === 0, "single unique asset → no groups")

console.log(`\n=== ${pass} passed, ${fail} failed ===`)
process.exit(fail ? 1 : 0)
