import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

/**
 * Interview DRAFT persistence — so a founder never loses an in-progress (or finished-but-not-built)
 * interview if the session closes or they switch devices.
 *   POST { id, name, messages, answers, progress, refs, done } → upsert the draft.
 *   GET  [?id=<draftId>] → the draft to resume (the logged-in user's latest, else by id for anon).
 *   DELETE ?id= → discard a draft.
 * Logged-in users resume on ANY device (keyed by email); anonymous resume same-device (localStorage id).
 */
let ready = false
async function ensure() {
  if (ready) return
  ready = true
  await query(`CREATE TABLE IF NOT EXISTS puglit_interview_drafts (
    id VARCHAR(40) PRIMARY KEY,
    user_email VARCHAR(255),
    name VARCHAR(160),
    messages JSONB NOT NULL DEFAULT '[]',
    log JSONB NOT NULL DEFAULT '[]',
    step JSONB,
    answers JSONB NOT NULL DEFAULT '{}',
    progress INT NOT NULL DEFAULT 0,
    refs TEXT,
    done BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_idrafts_user ON puglit_interview_drafts(user_email, updated_at DESC);
  ALTER TABLE puglit_interview_drafts ADD COLUMN IF NOT EXISTS log JSONB NOT NULL DEFAULT '[]';
  ALTER TABLE puglit_interview_drafts ADD COLUMN IF NOT EXISTS step JSONB;`).catch(() => {})
}

export async function GET(req: NextRequest) {
  await ensure()
  const id = new URL(req.url).searchParams.get("id")
  const session = await getSession().catch(() => null)
  let row: Record<string, unknown> | undefined
  if (session?.email) row = (await query<Record<string, unknown>>("SELECT * FROM puglit_interview_drafts WHERE user_email=$1 AND done=false AND jsonb_array_length(messages) > 0 ORDER BY updated_at DESC LIMIT 1", [session.email]).catch(() => ({ rows: [] }))).rows[0]
  if (!row && id) row = (await query<Record<string, unknown>>("SELECT * FROM puglit_interview_drafts WHERE id=$1 AND done=false", [id]).catch(() => ({ rows: [] }))).rows[0]
  if (!row) return NextResponse.json({ ok: true, draft: null })
  return NextResponse.json({ ok: true, draft: { id: row.id, name: row.name, messages: row.messages, log: row.log, step: row.step, answers: row.answers, progress: row.progress, refs: row.refs, updatedAt: row.updated_at } })
}

export async function POST(req: NextRequest) {
  await ensure()
  const b = await req.json().catch(() => ({} as Record<string, unknown>))
  if (!b?.id) return NextResponse.json({ ok: false }, { status: 400 })
  const session = await getSession().catch(() => null)
  await query(
    `INSERT INTO puglit_interview_drafts (id, user_email, name, messages, log, step, answers, progress, refs, done, updated_at)
     VALUES ($1,$2,$3,$4::jsonb,$5::jsonb,$6::jsonb,$7::jsonb,$8,$9,$10,NOW())
     ON CONFLICT (id) DO UPDATE SET
       user_email=COALESCE(EXCLUDED.user_email, puglit_interview_drafts.user_email),
       name=EXCLUDED.name, messages=EXCLUDED.messages, log=EXCLUDED.log, step=EXCLUDED.step,
       answers=EXCLUDED.answers, progress=EXCLUDED.progress, refs=EXCLUDED.refs, done=EXCLUDED.done, updated_at=NOW()`,
    [String(b.id).slice(0, 40), session?.email || null, String(b.name || "").slice(0, 160), JSON.stringify(b.messages || []), JSON.stringify(b.log || []), b.step ? JSON.stringify(b.step) : null, JSON.stringify(b.answers || {}), Number(b.progress) || 0, String(b.refs || "").slice(0, 8000), !!b.done],
  ).catch(() => {})
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  await ensure()
  const id = new URL(req.url).searchParams.get("id")
  if (id) await query("UPDATE puglit_interview_drafts SET done=true WHERE id=$1", [id]).catch(() => {})
  return NextResponse.json({ ok: true })
}
