// End-to-end smoke test. Usage: (term 1) npm run dev  (term 2) node --env-file=.env.local scripts/e2e.mjs
import pg from "pg"
const B = process.env.BASE || "http://localhost:3000"
const cfg = { host: process.env.POSTGRES_HOST || "localhost", port: +(process.env.POSTGRES_PORT || 5432), user: process.env.POSTGRES_USER || "postgres", password: process.env.POSTGRES_PASSWORD || "postgres", database: process.env.POSTGRES_DB || "appdb", ssl: process.env.POSTGRES_SSL === "disable" ? undefined : { rejectUnauthorized: false } }
const db = new pg.Client(cfg); await db.connect()
let pass = 0, fail = 0
const ok = (c, m) => { c ? pass++ : fail++; console.log(c ? "✅ " + m : "❌ " + m) }
const arr = (x) => (Array.isArray(x) ? x : x.scores || [])

await db.query("DELETE FROM scores WHERE player = 'E2E'").catch(() => {})
ok((await (await fetch(B + "/")).status) === 200, "home page renders 200")
const before = arr(await (await fetch(B + "/api/scores")).json()).length
const post = await fetch(B + "/api/scores", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ world: 0, level: 0, player: "E2E", distance: 420 }) })
ok(post.status === 200, "submit a score (POST /api/scores)")
const board = arr(await (await fetch(B + "/api/scores")).json())
ok(board.length >= before + 1, `leaderboard grew (${before} → ${board.length})`)
ok(board.some((s) => s.player === "E2E" && Number(s.distance) === 420), "submitted score appears in leaderboard")
ok(board[0] && Number(board[0].distance) >= Number(board[board.length - 1].distance), "leaderboard ordered by distance desc")
const bad = await fetch(B + "/api/scores", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ player: "E2E" }) })
ok(bad.status === 400, "invalid score rejected (400)")

await db.query("DELETE FROM scores WHERE player = 'E2E'").catch(() => {})
await db.end()
console.log(`\n=== ${pass} passed, ${fail} failed ===`)
process.exit(fail ? 1 : 0)
