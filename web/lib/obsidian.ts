/**
 * obsidian.ts — mirror each agent's RPG state to an Obsidian-style markdown vault.
 *
 * One file per agent: obsidian-vault/<team>/<role>.md, with YAML frontmatter (the stats
 * the orchestrator reads) + a "Diario de Aprendizajes" section (the few-shot lessons).
 * This is the human-browsable "character sheet" and the canonical persisted personality;
 * Postgres stays the fast runtime store for the campus visual. Vault dir = OBSIDIAN_DIR
 * (default <cwd>/obsidian-vault), persistent on the GPU box under /workspace.
 */
import { promises as fs } from "node:fs"
import path from "node:path"
import { xpToReach } from "@/lib/progression"

const VAULT = process.env.OBSIDIAN_DIR || path.join(process.cwd(), "obsidian-vault")
const TEAM_NAME: Record<string, string> = { A: "Equipo_Lean", B: "Equipo_Enterprise", C: "Equipo_Hacker" }

interface Sheet {
  id: string; team: string; role: string; name: string; queen: boolean
  stats: Record<string, number>; level: number; xp: number; quality_sum: number; quality_n: number
}
type DiaryRow = { kind: string; entry: string; quality: number | null; created_at: string }

export async function writeAgentSheet(a: Sheet, diary: DiaryRow[]): Promise<void> {
  const dir = path.join(VAULT, TEAM_NAME[a.team] || a.team)
  await fs.mkdir(dir, { recursive: true })
  const quality = a.quality_n ? Math.round((a.quality_sum / a.quality_n) * 10) / 10 : 0
  const next = xpToReach(a.level + 1)
  const statLines = Object.entries(a.stats).map(([k, v]) => `  ${k}: ${v}`).join("\n")
  const diaryLines = diary.length
    ? diary.map((d) => `- **${d.kind}${d.quality != null ? ` ${d.quality}/10` : ""}** (${String(d.created_at).slice(0, 10)}): ${d.entry}`).join("\n")
    : "- Sin proyectos aún — la reputación se acumula con cada build."

  const md = `---
id: ${a.id}
team: ${a.team}
role: ${a.role}
name: ${a.name}
queen: ${a.queen}
nivel: ${a.level}
xp_actual: ${a.xp}
xp_siguiente_nivel: ${next}
proyectos: ${a.quality_n}
calidad: ${quality}
stats:
${statLines}
---

# ${a.name} ${a.queen ? "👑" : ""}

**Nivel ${a.level}** · ${a.xp}/${next} XP · calidad ${quality}/10

## Diario de Aprendizajes
${diaryLines}
`
  await fs.writeFile(path.join(dir, `${a.role}.md`), md, "utf8")
}
