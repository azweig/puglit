// Generate one pixel-art sprite per swarm agent via OpenAI gpt-image-1.
// Reads the roster from lib/swarm-agents.ts (id + persona per line). Idempotent:
// skips agents whose PNG already exists. Downscales to 256px with sharp if available.
import fs from "node:fs"
import path from "node:path"

const key = (fs.readFileSync(".env.local", "utf8").match(/OPENAI_API_KEY=(.+)/) || [])[1]?.trim()
if (!key) { console.error("no OPENAI_API_KEY in .env.local"); process.exit(1) }
let sharp = null; try { sharp = (await import("sharp")).default } catch {}

const STYLE = "Pixel art sprite, isometric 2.5D retro office RPG videogame style (like Stardew Valley / Eco), single full-body character, three-quarter isometric view, crisp clean 32-bit pixel art, bold vibrant saturated palette, thick readable forms, centered in frame, FULLY TRANSPARENT background, no ground, no shadow, no text, no UI, no border."

const src = fs.readFileSync("lib/swarm-agents.ts", "utf8")
const agents = []
for (const line of src.split("\n")) {
  const id = (line.match(/id:\s*"([^"]+)"/) || [])[1]
  const persona = (line.match(/persona:\s*"([^"]+)"/) || [])[1]
  if (id && persona) agents.push({ id, persona })
}
console.log(`roster: ${agents.length} agents`)

async function gen(persona) {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gpt-image-1", prompt: `${STYLE} The character: ${persona}.`, size: "1024x1024", n: 1, background: "transparent" }),
  })
  if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 160)}`)
  const d = await res.json()
  return Buffer.from(d.data[0].b64_json, "base64")
}

let done = 0, skip = 0
for (const a of agents) {
  const out = path.join("public/sprites/agents", `${a.id}.png`)
  if (fs.existsSync(out)) { skip++; continue }
  try {
    let buf = await gen(a.persona)
    if (sharp) buf = await sharp(buf).resize(256, 256, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png({ compressionLevel: 9 }).toBuffer()
    fs.writeFileSync(out, buf)
    done++; console.log(`✓ ${a.id} (${Math.round(buf.length / 1024)}KB)`)
  } catch (e) { console.log(`✗ ${a.id}: ${e.message}`) }
}
fs.writeFileSync("public/sprites/manifest.json", JSON.stringify({ agents: agents.map((a) => a.id) }, null, 2))
console.log(`done: ${done} generated, ${skip} skipped`)
