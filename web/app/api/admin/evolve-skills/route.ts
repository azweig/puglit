import { NextResponse } from "next/server"
import { isServiceRequest } from "@/lib/auth"
import { evolveAllSkills, evolveSkill, type SkillArea } from "@/lib/skill-evolution"
import { evolveInterviewStyle, consolidateInterviewStyle } from "@/lib/interview-evolution"

export const maxDuration = 800

/**
 * SkillOpt-Sleep trigger — run one offline validation-gated skill-evolution epoch.
 * POST /api/admin/evolve-skills            → all areas
 * POST /api/admin/evolve-skills?area=data  → one area
 * Auth: x-puglit-service: $PUGLIT_SERVICE_TOKEN. Heavy (runs held-out blueprint rollouts), so run
 * it offline/nightly, never in the request path of a build.
 */
export async function POST(req: Request) {
  if (!isServiceRequest(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  const area = new URL(req.url).searchParams.get("area") as SkillArea | null
  try {
    const result = area ? { [area]: await evolveSkill(area) } : await evolveAllSkills()
    const accepted = Object.entries(result).filter(([, r]) => r.accepted).map(([a]) => a)
    // the interviewer evolves from founder 😀/😞 (not blueprint rollouts): revert a bad edit, then try one.
    const reverted = await consolidateInterviewStyle().catch(() => null)
    const interview = await evolveInterviewStyle().catch(() => null)
    return NextResponse.json({ ok: true, accepted, result, interview, reverted })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
