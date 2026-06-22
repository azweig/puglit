import { NextRequest, NextResponse } from "next/server"
import { recordInterviewFeedback } from "@/lib/interview-evolution"

/** POST /api/interview/feedback { up:boolean, kind:string, ver:number }
 *  The founder's 😀/😞 on a question. Feeds the interviewer's style evolution. Public (no PII). */
export async function POST(req: NextRequest) {
  try {
    const b = await req.json()
    await recordInterviewFeedback(!!b?.up, String(b?.kind || "general"), Number(b?.ver) || 0)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 }) // never block the interview on feedback
  }
}
