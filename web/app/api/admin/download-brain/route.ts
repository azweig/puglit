/**
 * GET /api/admin/download-brain — stream the brain backup so you can DOWNLOAD it through the
 * RunPod proxy (port 3000) when external upload services are down. Open in a browser:
 *   https://<your-pod>-3000.proxy.runpod.net/api/admin/download-brain
 * Serves PUGLIT_BRAIN_BACKUP or /workspace/brain-backup.sql.gz. No secrets in the brain (exemplars,
 * skills, diary) — but it's gated behind this explicit admin path; remove the file after downloading.
 */
import { NextResponse } from "next/server"
import { readFileSync } from "fs"

export const dynamic = "force-dynamic"

export async function GET() {
  const path = process.env.PUGLIT_BRAIN_BACKUP || "/workspace/brain-backup.sql.gz"
  try {
    const buf = readFileSync(path)
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/gzip",
        "Content-Disposition": 'attachment; filename="brain-backup.sql.gz"',
        "Content-Length": String(buf.length),
        "Cache-Control": "no-store",
      },
    })
  } catch (e) {
    return NextResponse.json({ error: "not_found", path, detail: (e as Error).message }, { status: 404 })
  }
}
