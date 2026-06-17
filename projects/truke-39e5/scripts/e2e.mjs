// End-to-end smoke test against the running app + Postgres. Auto-discovers the
// app's routes, then exercises the real user flow. Tolerant: tests what exists.
// Usage: (terminal 1) npm run dev    (terminal 2) node --env-file=.env.local scripts/e2e.mjs
import pg from "pg"
import fs from "fs"
import path from "path"

const B = process.env.BASE || "http://localhost:3000"
const cfg = { host: process.env.POSTGRES_HOST || "localhost", port: +(process.env.POSTGRES_PORT || 5432), user: process.env.POSTGRES_USER || "postgres", password: process.env.POSTGRES_PASSWORD || "postgres", database: process.env.POSTGRES_DB || "appdb", ssl: process.env.POSTGRES_SSL === "disable" ? undefined : { rejectUnauthorized: false } }
const db = new pg.Client(cfg); await db.connect()
let pass = 0, fail = 0
const ok = (c, m) => { c ? pass++ : fail++; console.log(c ? "✅ " + m : "❌ " + m) }
const num = (v) => Number(v)

function walk(d) { return fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]) : [] }
const routes = walk("app/api").filter((f) => f.endsWith("route.ts"))
const url = (f) => "/" + f.replace(/^app\//, "").replace(/\/route\.ts$/, "")
const keys = (s, m) => { const r = s.match(new RegExp("export async function " + m + "[\\s\\S]*?const\\s*\\{([^}]*)\\}\\s*(?::[^=]*)?=\\s*await request\\.json")); return r ? r[1].split(",").map((x) => x.trim().split(":")[0].trim()).filter(Boolean) : [] }
const param = (s) => (s.match(/searchParams\.get\(['"]([^'"]+)['"]\)/) || [])[1]
let publish, swipe, msgPost, msgGetParam, feedUrl, matchesUrl, msgUrl
for (const f of routes) { const s = fs.readFileSync(f, "utf8"); const u = url(f)
  if (/insert\s+into\s+items/i.test(s) && /function POST/.test(s)) publish = { url: u, keys: keys(s, "POST") }
  if (/insert\s+into\s+swipes/i.test(s)) swipe = { url: u, keys: keys(s, "POST") }
  if (/insert\s+into\s+messages/i.test(s)) { msgPost = { url: u, keys: keys(s, "POST") }; msgUrl = u; if (/function GET/.test(s)) msgGetParam = param(s) }
  if (/from\s+items/i.test(s) && /function GET/.test(s) && !/insert\s+into\s+items/i.test(s)) feedUrl = u
  if (/from\s+matches/i.test(s) && /function GET/.test(s) && !/insert\s+into\s+messages/i.test(s)) matchesUrl = u }
const itemsDdl = (fs.readFileSync("sql/app.sql", "utf8").match(/CREATE TABLE IF NOT EXISTS items[\\s\\S]*?\\);/) || [""])[0]
const enumFor = (k) => { const m = itemsDdl.match(new RegExp(k + "[^,]*CHECK\\s*\\([^)]*IN\\s*\\(([^)]*)\\)", "i")); return m ? m[1].split(",")[0].replace(/['\s]/g, "") : null }
const valFor = (k) => /image|photo|img|url|pic/i.test(k) ? "data:image/png;base64,iVBORw0KGgo=" : (enumFor(k) || (/price|amount|qty|num|count/i.test(k) ? 10 : "Prueba " + k))

const cookieOf = (r) => (r.headers.getSetCookie?.() || []).map((c) => c.split(";")[0]).find((c) => c.startsWith("auth_token=")) || ""
const reg = async (email, name) => { const r = await fetch(B + "/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "password123", name, profile: { city: "Lima", lastName: "Test" } }) }); return { status: r.status, cookie: cookieOf(r) } }
const get = (p, c) => fetch(B + p, { headers: { Cookie: c } })
const post = (p, c, b) => fetch(B + p, { method: "POST", headers: { "Content-Type": "application/json", Cookie: c }, body: JSON.stringify(b) })
const arr = (x) => Array.isArray(x) ? x : (x?.rows || x?.items || x?.messages || x?.matches || [])
const find = (ks, re) => ks.find((k) => re.test(k))

await db.query("DELETE FROM users WHERE email LIKE '%@e2e.test'").catch(() => {})
const A = await reg("ana@e2e.test", "Ana"), Bt = await reg("beto@e2e.test", "Beto"), C = await reg("caro@e2e.test", "Caro")
ok(A.cookie && Bt.cookie && C.cookie, "register 3 users with anonymous profile")

if (publish && swipe && feedUrl && matchesUrl) {
  await db.query("DELETE FROM messages; DELETE FROM matches; DELETE FROM swipes; DELETE FROM items").catch(() => {})
  const body = (t) => Object.fromEntries(publish.keys.map((k) => [k, /title|name|nombre/i.test(k) ? t : valFor(k)]))
  const pA = await post(publish.url, A.cookie, body("Cosa de Ana")), pB = await post(publish.url, Bt.cookie, body("Cosa de Beto"))
  ok([200, 201].includes(pA.status) && [200, 201].includes(pB.status), "A & B publish")
  const aUid = (await db.query("SELECT id FROM users WHERE email='ana@e2e.test'")).rows[0].id
  const itemA = num((await db.query("SELECT id FROM items WHERE owner_id=$1", [aUid])).rows[0]?.id)
  const itemB = num((await db.query("SELECT id FROM items WHERE title='Cosa de Beto'")).rows[0]?.id)
  const feed = arr(await (await get(feedUrl, A.cookie)).json()).map((x) => num(x.id))
  ok(feed.includes(itemB) && !feed.includes(itemA), "feed shows others, hides own")
  const sk = find(swipe.keys, /item/i) || "item_id"
  await post(swipe.url, A.cookie, { [sk]: itemB, liked: true })
  await post(swipe.url, Bt.cookie, { [sk]: itemA, liked: true })
  const matches = (await db.query("SELECT * FROM matches")).rows
  ok(matches.length === 1, "mutual match created")
  const matchId = matches[0]?.id
  ok(arr(await (await get(matchesUrl, A.cookie)).json()).length === 1, "matches endpoint")
  if (msgPost && msgGetParam) {
    const mk = find(msgPost.keys, /match/i) || "match_id", tk = msgPost.keys.find((k) => /body|text|message|content/i.test(k)) || "body"
    ok([200, 201].includes((await post(msgUrl, A.cookie, { [mk]: matchId, [tk]: "hola" })).status), "send message")
    ok(arr(await (await get(msgUrl + "?" + msgGetParam + "=" + matchId, Bt.cookie)).json()).length === 1, "list chat")
    ok((await post(msgUrl, C.cookie, { [mk]: matchId, [tk]: "x" })).status === 403, "non-participant blocked (chat scoped)")
  }
}
for (const p of ["/app"]) ok((await get(p, A.cookie)).status === 200, "main app screen renders")

await db.end()
console.log("\n=== " + pass + " passed, " + fail + " failed ===")
process.exit(fail ? 1 : 0)
