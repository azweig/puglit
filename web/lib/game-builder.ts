/**
 * Puglit web — game-builder.ts
 * The SECOND build mold. The data-app engine (app-builder.ts) shapes products as
 * Postgres tables → API routes → pages; a GAME is a different shape entirely, so it
 * gets its own pipeline: a design pass (genre, mechanics, controls, levels, art
 * direction) → a single self-contained, PLAYABLE HTML5 canvas game (one client
 * component, no external deps, keyboard + touch) → optional highscores (a real
 * route + table) → docs. Resumable like the engine so it completes on serverless.
 *
 * Art is drawn programmatically (shapes, gradients, emoji glyphs) — no sprite assets
 * to fetch — so the game is deterministic and actually runs the moment it's deployed.
 */
import { chatJSON, MODELS } from "@/lib/openai"
import type { AppFile } from "@/lib/app-builder"
import type { DomainConfig } from "@/lib/domain-types"

export interface GameDesign {
  title: string
  genre: string          // platformer | shooter | puzzle | runner | arcade | tower-defense | snake | breakout | …
  pitch: string
  mechanics: string[]     // core verbs the player does
  controls: { keyboard: string; touch: string }
  entities: string[]      // player, enemies, pickups, obstacles, projectiles…
  levels: string          // how difficulty/levels progress
  difficulties: string[]  // e.g. ["Fácil","Normal","Difícil"]
  scoring: string
  winLose: string
  art: string             // palette + visual style to render with canvas primitives
  hasHighscores: boolean
}

export interface GameState {
  phase: "design" | "code" | "extras" | "done"
  design: GameDesign | null
  files: AppFile[]
}

export function initGameState(): GameState {
  return { phase: "design", design: null, files: [] }
}

/** Keep the App-Router invariants the spine + backstops expect (mirror app-builder). */
function hardenTsx(code: string): string {
  let c = code.replace(/```[a-z]*\n?/gi, "").trim()
  c = c.replace(/from\s+["']next\/router["']/g, 'from "next/navigation"')
    .replace(/catch\s*\(\s*([a-zA-Z_$][\w$]*)\s*\)\s*\{/g, "catch ($1: any) {")
    .replace(/^[ \t]*use (client|server)[ \t]*;?[ \t]*$/gm, "")
  c = c.replace(/(?:^|\n)[ \t]*["']use client["'][ \t]*;?[ \t]*/g, "\n").replace(/^\s+/, "")
  return '"use client";\n' + c
}

function brief(config: DomainConfig, references: string): string {
  const tagline = typeof config.identity.tagline === "string" ? config.identity.tagline : ""
  const langs = (config.identity.languages || ["es"]).join(",")
  return `GAME: ${config.identity.name}\nPITCH: ${tagline}\nUI LANGUAGE: ${langs} (label all on-screen text in this language)\nBRAND COLOR: ${config.identity.brandColor || "#7C3AED"}${references ? `\n\nFOUNDER REFERENCES (match the vibe / mechanics / art they point to):\n${references.slice(0, 4000)}` : ""}`
}

async function designGame(config: DomainConfig, references: string): Promise<GameDesign> {
  const out = (await chatJSON([
    { role: "system", content: `You are a senior game designer. Turn the founder's idea into a TIGHT, BUILDABLE design for a browser game rendered on an HTML5 <canvas> with NO external assets (art = shapes, gradients, emoji glyphs). It must be genuinely fun and complete: clear core loop, real difficulty progression, win/lose, score. Pick the genre that best fits the idea. Keep scope to what one excellent self-contained canvas component can deliver well.
Return ONLY JSON: {"title","genre","pitch","mechanics":[..],"controls":{"keyboard","touch"},"entities":[..],"levels","difficulties":["Fácil","Normal","Difícil"],"scoring","winLose","art","hasHighscores":boolean}. Write player-facing strings in the product's UI language.` },
    { role: "user", content: brief(config, references) },
  ], { model: MODELS.premium, temperature: 0.4 })) as Partial<GameDesign>
  return {
    title: out.title || config.identity.name,
    genre: out.genre || "arcade",
    pitch: out.pitch || "",
    mechanics: Array.isArray(out.mechanics) ? out.mechanics : [],
    controls: { keyboard: out.controls?.keyboard || "Flechas / WASD", touch: out.controls?.touch || "Tocar y arrastrar" },
    entities: Array.isArray(out.entities) ? out.entities : [],
    levels: out.levels || "La dificultad sube con el tiempo.",
    difficulties: Array.isArray(out.difficulties) && out.difficulties.length ? out.difficulties : ["Fácil", "Normal", "Difícil"],
    scoring: out.scoring || "Puntos por objetivo logrado.",
    winLose: out.winLose || "",
    art: out.art || "",
    hasHighscores: out.hasHighscores !== false,
  }
}

async function codeGame(config: DomainConfig, d: GameDesign): Promise<string> {
  const langs = (config.identity.languages || ["es"]).join(",")
  const raw = await chatJSON([
    { role: "system", content: `You are an elite HTML5 game engineer. Produce ONE self-contained Next.js 16 App-Router client component (the file at app/page.tsx) that IS a complete, polished, PLAYABLE game on an HTML5 <canvas>. This is the product's homepage — the game itself, no marketing.

HARD REQUIREMENTS (compile + run with zero deps beyond react):
- First line exactly: "use client";  then: import { useRef, useEffect, useState } from "react".
- A single default-exported React component. ALL game state lives in refs/local objects inside a requestAnimationFrame loop (NOT React state per frame). Use React state ONLY for menu/score/gameover overlays.
- Canvas sized responsively (fit container, cap at a sane max; handle devicePixelRatio). Fixed-timestep or dt-based update so speed is frame-rate independent.
- Render ALL art with canvas primitives (fillRect, arc, gradients, paths) and/or emoji via ctx.fillText — NO image/audio file loading, NO external URLs, NO npm libs.
- INPUT: keyboard (arrows + WASD + space) AND touch/pointer (on-canvas controls or drag) — both must work; clean up listeners on unmount.
- GAME LOOP: start menu → playing → game over/win, with a difficulty selector, live score, and a restart button. Pause when tab hidden. cancelAnimationFrame on unmount.
- Difficulty + level progression as designed. Clamp the player to bounds. No crashes on resize.
- TypeScript strict-safe: type refs (HTMLCanvasElement | null), guard nulls, \`catch (e: any)\`. Must pass \`tsc --noEmit\`.
- Tailwind for the surrounding chrome (title, controls hint, score HUD). Use the brand color. Label ALL text in the UI language (${langs}).
${d.hasHighscores ? `- HIGHSCORES: on game over, POST {name, score} to /api/scores (fire-and-forget, ignore failure) and GET /api/scores to show a top-10 list on the menu. Treat a failed/empty fetch gracefully (show "Sé el primero").` : ""}

Return ONLY JSON: {"code":"<the FULL contents of app/page.tsx>"}.` },
    { role: "user", content: `${brief(config, "")}\n\nDESIGN:\n${JSON.stringify(d, null, 2)}` },
  ], { model: MODELS.code, temperature: 0.3 }) as { code?: string }
  const code = raw.code && raw.code.length > 200 ? String(raw.code) : ""
  return code ? hardenTsx(code) : ""
}

/** Deterministic highscores backend (no LLM): a real table + a real route the game calls. */
function highscoreFiles(): AppFile[] {
  return [
    {
      path: "sql/app.sql",
      content: `-- Game highscores
CREATE TABLE IF NOT EXISTS scores (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Anónimo',
  score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS scores_score_idx ON scores (score DESC);
`,
    },
    {
      path: "app/api/scores/route.ts",
      content: `import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

// GET: top 10 scores. POST: submit a score. Public (no auth) — it's an arcade leaderboard.
export async function GET() {
  try {
    const { rows } = await query("SELECT name, score, created_at FROM scores ORDER BY score DESC, created_at ASC LIMIT 10")
    return NextResponse.json(rows)
  } catch {
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const name = String(body?.name || "Anónimo").slice(0, 24)
    const score = Math.max(0, Math.min(1_000_000, Math.floor(Number(body?.score) || 0)))
    const { rows } = await query("INSERT INTO scores (name, score) VALUES ($1, $2) RETURNING id, name, score", [name, score])
    return NextResponse.json(rows[0], { status: 201 })
  } catch {
    return NextResponse.json({ error: "could_not_save" }, { status: 400 })
  }
}
`,
    },
  ]
}

function designDoc(d: GameDesign): AppFile {
  return {
    path: "docs/GAME-DESIGN.md",
    content: `# ${d.title} — Game Design

**Género:** ${d.genre}

${d.pitch}

## Mecánicas
${d.mechanics.map((m) => `- ${m}`).join("\n")}

## Controles
- Teclado: ${d.controls.keyboard}
- Táctil: ${d.controls.touch}

## Entidades
${d.entities.map((e) => `- ${e}`).join("\n")}

## Dificultad y niveles
${d.levels}

Dificultades: ${d.difficulties.join(", ")}

## Puntaje
${d.scoring}

## Victoria / derrota
${d.winLose}

## Arte
${d.art}

## Highscores
${d.hasHighscores ? "Tabla `scores` + `GET/POST /api/scores` (leaderboard top-10 público)." : "Sin leaderboard."}
`,
  }
}

/** Advance the game build ONE bounded unit (≤ one LLM call) and resume from state. */
export async function gameAdvance(
  config: DomainConfig,
  references: string,
  state: GameState,
): Promise<{ state: GameState; done: boolean; detail: string }> {
  if (state.phase === "design") {
    state.design = await designGame(config, references)
    state.phase = "code"
    return { state, done: false, detail: `juego diseñado: ${state.design.genre} · ${state.design.mechanics.length} mecánicas` }
  }
  if (state.phase === "code") {
    const d = state.design!
    const code = await codeGame(config, d)
    if (code) state.files.push({ path: "app/page.tsx", content: code })
    state.phase = "extras"
    return { state, done: false, detail: code ? "juego jugable generado (canvas + controles)" : "código del juego (reintenta)" }
  }
  if (state.phase === "extras") {
    const d = state.design!
    if (d.hasHighscores) state.files.push(...highscoreFiles())
    state.files.push(designDoc(d))
    state.phase = "done"
    return { state, done: true, detail: `${state.files.length} archivos · ${d.genre}${d.hasHighscores ? " · leaderboard" : ""}` }
  }
  return { state, done: true, detail: "listo" }
}

/** Local one-shot convenience (tests / local builds). */
export async function buildGameApp(config: DomainConfig, references = ""): Promise<{ files: AppFile[]; design: GameDesign }> {
  let state = initGameState()
  for (let i = 0; i < 6 && state.phase !== "done"; i++) {
    const r = await gameAdvance(config, references, state)
    state = r.state
    if (r.done) break
  }
  return { files: state.files, design: state.design! }
}

/** Heuristic fallback: detect a game from free text when no explicit archetype was set. */
export function looksLikeGame(text: string): boolean {
  return /\b(juego|jueguito|videojuego|game|arcade|plataformas?|platformer|shooter|runner|puzzle|tower\s*defense|snake|breakout|pong|tetris|jugador|niveles?|enemigos?|disparar|saltar|pong|flappy)\b/i.test(text || "")
}
