/**
 * Puglit Spine — /api/records/[entity]  (CRUD for the dashboard, auth-gated)
 * GET list · POST create · DELETE remove. Scoped to the logged-in user.
 */
import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { listRecords, createRecord, deleteRecord } from "@/lib/records"

export async function GET(request: NextRequest, { params }: { params: Promise<{ entity: string }> }) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { entity } = await params
  return NextResponse.json({ records: await listRecords(user.userId, entity) })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ entity: string }> }) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { entity } = await params
  const { data } = await request.json()
  if (typeof data !== "object" || !data) return NextResponse.json({ error: "Invalid data" }, { status: 400 })
  return NextResponse.json({ ok: true, record: await createRecord(user.userId, entity, data) })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ entity: string }> }) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { entity } = await params
  const { id } = await request.json()
  await deleteRecord(user.userId, entity, Number(id))
  return NextResponse.json({ ok: true })
}
