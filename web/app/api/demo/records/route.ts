/**
 * /api/demo/records — functional CRUD for the live demo, gated by the demo
 * session cookie (pd_<slug>). GET ?slug&entity · POST {slug,entity,data} ·
 * DELETE {slug,entity,id}.
 */
import { NextRequest, NextResponse } from "next/server"
import { readSession } from "@/lib/demo-auth"
import { listRecords, createRecord, deleteRecord } from "@/lib/demo-records"

function session(request: NextRequest, slug: string) {
  return readSession(request.cookies.get(`pd_${slug}`)?.value)
}

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug") || ""
  const entity = request.nextUrl.searchParams.get("entity") || ""
  const s = session(request, slug)
  if (!s || s.slug !== slug) return NextResponse.json({ error: "unauth" }, { status: 401 })
  return NextResponse.json({ records: await listRecords(slug, s.email, entity) })
}

export async function POST(request: NextRequest) {
  const { slug, entity, data } = await request.json()
  const s = session(request, String(slug))
  if (!s || s.slug !== slug) return NextResponse.json({ error: "unauth" }, { status: 401 })
  if (!entity || typeof data !== "object") return NextResponse.json({ error: "bad_request" }, { status: 400 })
  const row = await createRecord(String(slug), s.email, String(entity), data)
  return NextResponse.json({ ok: true, record: row })
}

export async function DELETE(request: NextRequest) {
  const { slug, entity, id } = await request.json()
  const s = session(request, String(slug))
  if (!s || s.slug !== slug) return NextResponse.json({ error: "unauth" }, { status: 401 })
  await deleteRecord(String(slug), s.email, String(entity), Number(id))
  return NextResponse.json({ ok: true })
}
