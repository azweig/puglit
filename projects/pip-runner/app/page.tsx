"use client"
import { useEffect, useRef, useState, useCallback } from "react"

// Pip Runner — an ORIGINAL endless-runner. Character "Pip" (a teal sprite) and all art
// are original (no third-party / copyrighted characters). 8 worlds × 8 levels.

type Theme = { name: string; sky: [string, string]; ground: string; hill: string; ob: string }
const THEMES: Theme[] = [
  { name: "Pradera", sky: ["#7ec8ff", "#bff0c8"], ground: "#3aa655", hill: "#2e8b57", ob: "#8b5a2b" },
  { name: "Desierto", sky: ["#ffd27f", "#ffe9b0"], ground: "#d9a441", hill: "#c98e2f", ob: "#7a5230" },
  { name: "Nieve", sky: ["#cfe8ff", "#ffffff"], ground: "#dfefff", hill: "#9fc6e8", ob: "#5c7a99" },
  { name: "Cueva", sky: ["#241b3a", "#3a2a5a"], ground: "#4b3a6b", hill: "#2e2348", ob: "#160f26" },
  { name: "Playa", sky: ["#8fd6ff", "#ffe7b3"], ground: "#e9d39b", hill: "#7fc7e8", ob: "#b07a3c" },
  { name: "Bosque", sky: ["#3a6b4a", "#7ec88a"], ground: "#2f6b3f", hill: "#235031", ob: "#5a3a22" },
  { name: "Volcán", sky: ["#3a1414", "#ff6a3c"], ground: "#5a2a1a", hill: "#7a3320", ob: "#241010" },
  { name: "Cielo", sky: ["#9fd6ff", "#dff1ff"], ground: "#bfe0ff", hill: "#8fc6ee", ob: "#6a8fb0" },
]
const WORLDS = 8, LEVELS = 8
const idx = (w: number, l: number) => w * LEVELS + l
// goal distance (m) grows with progression
const goalFor = (w: number, l: number) => 200 + idx(w, l) * 60

type Score = { world: number; level: number; player: string; distance: number }

export default function Page() {
  const [screen, setScreen] = useState<"menu" | "play" | "win" | "over">("menu")
  const [world, setWorld] = useState(0)
  const [level, setLevel] = useState(0)
  const [unlocked, setUnlocked] = useState(0) // highest unlocked index
  const [lastDist, setLastDist] = useState(0)
  const [board, setBoard] = useState<Score[]>([])
  const [player, setPlayer] = useState("Pip")
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const endRef = useRef<(won: boolean, dist: number) => void>(() => {})

  useEffect(() => {
    try {
      setUnlocked(Number(localStorage.getItem("pip_unlocked") || "0"))
      setPlayer(localStorage.getItem("pip_player") || "Pip")
    } catch { /* ignore */ }
  }, [])

  const loadBoard = useCallback(async () => {
    try {
      const r = await fetch("/api/scores")
      const d = await r.json()
      setBoard(Array.isArray(d) ? d : d.scores || [])
    } catch { /* offline ok */ }
  }, [])
  useEffect(() => { loadBoard() }, [loadBoard])

  const finish = useCallback(async (won: boolean, dist: number) => {
    setLastDist(dist)
    setScreen(won ? "win" : "over")
    if (won) {
      const next = idx(world, level) + 1
      if (next > unlocked) { setUnlocked(next); try { localStorage.setItem("pip_unlocked", String(next)) } catch {} }
    }
    try {
      await fetch("/api/scores", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ world, level, player, distance: dist }) })
      loadBoard()
    } catch { /* offline ok */ }
  }, [world, level, unlocked, player, loadBoard])
  endRef.current = finish

  // ---- the game loop (canvas) ----
  useEffect(() => {
    if (screen !== "play") return
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext("2d")!
    const DPR = Math.min(window.devicePixelRatio || 1, 2)
    let W = 0, H = 0
    const resize = () => { W = cv.width = cv.clientWidth * DPR; H = cv.height = cv.clientHeight * DPR; ctx.imageSmoothingEnabled = false }
    resize(); window.addEventListener("resize", resize)

    const th = THEMES[world]
    const G = 0.9 * DPR
    const groundY = () => H - 90 * DPR
    const goal = goalFor(world, level)
    const pip = { x: 90 * DPR, y: 0, vy: 0, w: 38 * DPR, h: 44 * DPR, onGround: true, run: 0 }
    pip.y = groundY() - pip.h
    let obstacles: { x: number; y: number; w: number; h: number }[] = []
    let speed = (6.5 + world * 0.6 + level * 0.25) * DPR
    let dist = 0, alive = true, ended = false, raf = 0

    const jump = () => { if (pip.onGround && alive) { pip.vy = -16 * DPR; pip.onGround = false } }
    const onDown = () => jump()
    const onKey = (e: KeyboardEvent) => { if (e.code === "Space" || e.code === "ArrowUp") jump() }
    cv.addEventListener("pointerdown", onDown); window.addEventListener("keydown", onKey)

    const roundRect = (x: number, y: number, w: number, h: number, r: number) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath() }
    const circle = (x: number, y: number, r: number) => { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill() }
    const drawPip = () => {
      const { x: px, y: py, w, h } = pip
      ctx.fillStyle = "#16c2b0"; roundRect(px, py, w, h, 10 * DPR); ctx.fill()
      ctx.fillStyle = "#0e8f82"; const lift = pip.onGround ? Math.sin(pip.run) * 5 * DPR : 6 * DPR
      roundRect(px + 4 * DPR, py + h - 8 * DPR, 12 * DPR, 10 * DPR + lift, 4 * DPR); ctx.fill()
      roundRect(px + w - 16 * DPR, py + h - 8 * DPR, 12 * DPR, 10 * DPR - lift, 4 * DPR); ctx.fill()
      ctx.fillStyle = "#fff"; circle(px + w - 12 * DPR, py + 14 * DPR, 7 * DPR)
      ctx.fillStyle = "#08110f"; circle(px + w - 10 * DPR, py + 15 * DPR, 3.5 * DPR)
    }
    const rect = (a: typeof pip, b: { x: number; y: number; w: number; h: number }) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
    const spawn = () => {
      const last = obstacles[obstacles.length - 1]
      const gap = (200 + (40 - Math.min(28, world * 2 + level)) * DPR) + Math.random() * 120 * DPR
      if (!last || (W - last.x) > gap) { const tall = Math.random() < 0.35; obstacles.push({ x: W + 20 * DPR, y: 0, w: (24 + Math.random() * 16) * DPR, h: (tall ? 64 : 38) * DPR }) }
    }

    const frame = () => {
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, th.sky[0]); g.addColorStop(1, th.sky[1]); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = th.hill; for (let i = 0; i < 6; i++) { const hx = (i * 320 * DPR) - (dist * 0.3) % (320 * DPR); circle(hx, groundY(), 120 * DPR) }
      ctx.fillStyle = th.ground; ctx.fillRect(0, groundY(), W, H - groundY())
      ctx.fillStyle = "rgba(0,0,0,.12)"; for (let i = 0; i < 40; i++) { const gx = (i * 60 * DPR) - (dist) % (60 * DPR); ctx.fillRect(gx, groundY(), 30 * DPR, 6 * DPR) }
      if (alive) {
        dist += speed; speed += 0.0015 * DPR
        pip.vy += G; pip.y += pip.vy; pip.run += 0.3
        if (pip.y >= groundY() - pip.h) { pip.y = groundY() - pip.h; pip.vy = 0; pip.onGround = true }
        spawn()
        for (const o of obstacles) { o.x -= speed; o.y = groundY() - o.h }
        obstacles = obstacles.filter((o) => o.x + o.w > 0)
        for (const o of obstacles) if (rect(pip, o)) alive = false
      }
      ctx.fillStyle = th.ob; for (const o of obstacles) { roundRect(o.x, o.y, o.w, o.h, 5 * DPR); ctx.fill() }
      drawPip()
      // HUD progress bar toward the goal
      const m = Math.floor(dist / (40 * DPR))
      const prog = Math.min(1, m / goal)
      ctx.fillStyle = "rgba(255,255,255,.35)"; roundRect(16 * DPR, 16 * DPR, W - 32 * DPR, 12 * DPR, 6 * DPR); ctx.fill()
      ctx.fillStyle = "#16c2b0"; roundRect(16 * DPR, 16 * DPR, (W - 32 * DPR) * prog, 12 * DPR, 6 * DPR); ctx.fill()
      ctx.fillStyle = "#08110f"; ctx.font = `800 ${16 * DPR}px system-ui`; ctx.textAlign = "left"; ctx.fillText(`${m} / ${goal} m`, 16 * DPR, 48 * DPR)
      if (!ended) {
        if (m >= goal) { ended = true; cancelAnimationFrame(raf); endRef.current(true, m); return }
        if (!alive) { ended = true; cancelAnimationFrame(raf); endRef.current(false, m); return }
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); cv.removeEventListener("pointerdown", onDown); window.removeEventListener("keydown", onKey) }
  }, [screen, world, level])

  const start = (w: number, l: number) => { setWorld(w); setLevel(l); setScreen("play") }
  const nextLevel = () => { let w = world, l = level + 1; if (l >= LEVELS) { l = 0; w = Math.min(WORLDS - 1, w + 1) } start(w, l) }

  if (screen === "play") {
    return (
      <div style={{ position: "fixed", inset: 0 }}>
        <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} data-testid="game-canvas" />
        <div style={{ position: "fixed", top: 10, right: 14, fontWeight: 800 }}>{THEMES[world].name} · {world + 1}-{level + 1}</div>
        <button onClick={() => setScreen("menu")} style={{ position: "fixed", bottom: 14, left: 14, background: "rgba(0,0,0,.4)", color: "#fff", border: 0, borderRadius: 10, padding: "8px 14px" }}>← Mundos</button>
        <div style={{ position: "fixed", bottom: 14, right: 14, opacity: .7, fontSize: 13 }}>Tocá / Espacio para saltar</div>
      </div>
    )
  }

  return (
    <main style={{ height: "100dvh", overflow: "auto", padding: "20px 16px 40px", maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: -1 }}>🟦 Pip Runner</h1>
      <p style={{ opacity: .7, marginTop: 4 }}>8 mundos × 8 niveles · jugable con un toque · personajes propios</p>

      {(screen === "win" || screen === "over") && (
        <div style={{ marginTop: 16, padding: 16, borderRadius: 16, background: screen === "win" ? "#0e8f82" : "#7a2230" }}>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{screen === "win" ? "¡Nivel superado! 🎉" : "¡Te chocaste! 💥"}</div>
          <div style={{ opacity: .9, marginTop: 4 }}>{lastDist} m · {THEMES[world].name} {world + 1}-{level + 1}</div>
          <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
            <button onClick={() => start(world, level)} style={btn("#16c2b0")}>Reintentar</button>
            {screen === "win" && <button onClick={nextLevel} style={btn("#2563eb")}>Siguiente nivel →</button>}
            <button onClick={() => setScreen("menu")} style={btn("#334155")}>Mundos</button>
          </div>
        </div>
      )}

      <h2 style={{ marginTop: 22, fontSize: 18, fontWeight: 800 }}>Elegí nivel</h2>
      {THEMES.map((th, w) => (
        <div key={w} style={{ marginTop: 14 }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Mundo {w + 1} · {th.name}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 6 }}>
            {Array.from({ length: LEVELS }, (_, l) => {
              const locked = idx(w, l) > unlocked
              return (
                <button key={l} disabled={locked} onClick={() => start(w, l)}
                  style={{ aspectRatio: "1", borderRadius: 10, border: 0, fontWeight: 800, color: locked ? "#64748b" : "#06231f",
                    background: locked ? "#1e293b" : `linear-gradient(180deg, ${th.sky[0]}, ${th.ground})`, opacity: locked ? .6 : 1 }}>
                  {locked ? "🔒" : l + 1}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      <h2 style={{ marginTop: 26, fontSize: 18, fontWeight: 800 }}>🏆 Mejores distancias</h2>
      <div style={{ marginTop: 8 }}>
        {board.length === 0 && <div style={{ opacity: .5 }}>Todavía no hay scores. ¡Jugá un nivel!</div>}
        {board.slice(0, 10).map((s, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: i % 2 ? "transparent" : "rgba(255,255,255,.05)", borderRadius: 8 }}>
            <span>{i + 1}. {s.player} · {THEMES[s.world]?.name} {s.world + 1}-{s.level + 1}</span>
            <b>{s.distance} m</b>
          </div>
        ))}
      </div>
    </main>
  )
}

function btn(bg: string): React.CSSProperties {
  return { background: bg, color: "#fff", border: 0, borderRadius: 10, padding: "10px 16px", fontWeight: 800 }
}
