/**
 * storage-module.ts — object storage (S3 / MinIO / Cloudflare R2 / Backblaze), zero-dep.
 * Presigned URLs (SigV4 via node crypto) so the browser uploads DIRECTLY to the bucket — the
 * server never proxies bytes. presignPut() to upload, publicUrl() to read. env: S3_ENDPOINT,
 * S3_BUCKET, S3_REGION, S3_ACCESS_KEY, S3_SECRET_KEY, S3_PUBLIC_URL.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"

type AppFile = { path: string; content: string }

const STORAGE = `import { createHash, createHmac } from "node:crypto"
// Compact SigV4 presigner — works with any S3-compatible endpoint (AWS/MinIO/R2/B2).
const cfg = () => ({ endpoint: (process.env.S3_ENDPOINT || "").replace(/\\/$/, ""), bucket: process.env.S3_BUCKET || "", region: process.env.S3_REGION || "us-east-1", access: process.env.S3_ACCESS_KEY || "", secret: process.env.S3_SECRET_KEY || "" })
const enc = (s: string) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase())
const hmac = (k: Buffer | string, m: string) => createHmac("sha256", k).update(m).digest()
const sha = (s: string) => createHash("sha256").update(s).digest("hex")

/** Presigned PUT URL — give it to the browser to upload the file directly. */
export function presignPut(key: string, expires = 900): string {
  const { endpoint, bucket, region, access, secret } = cfg()
  const host = endpoint.replace(/^https?:\\/\\//, "")
  const now = new Date().toISOString().replace(/[:-]|\\.\\d{3}/g, "")
  const date = now.slice(0, 8)
  const scope = \`\${date}/\${region}/s3/aws4_request\`
  const q = new URLSearchParams({ "X-Amz-Algorithm": "AWS4-HMAC-SHA256", "X-Amz-Credential": \`\${access}/\${scope}\`, "X-Amz-Date": now, "X-Amz-Expires": String(expires), "X-Amz-SignedHeaders": "host" })
  const canonical = \`PUT\\n/\${bucket}/\${key.split("/").map(enc).join("/")}\\n\${q.toString()}\\nhost:\${host}\\n\\nhost\\nUNSIGNED-PAYLOAD\`
  const sts = \`AWS4-HMAC-SHA256\\n\${now}\\n\${scope}\\n\${sha(canonical)}\`
  const signing = hmac(hmac(hmac(hmac("AWS4" + secret, date), region), "s3"), "aws4_request")
  const sig = createHmac("sha256", signing).update(sts).digest("hex")
  return \`\${endpoint}/\${bucket}/\${key}?\${q.toString()}&X-Amz-Signature=\${sig}\`
}
/** Public read URL (set S3_PUBLIC_URL for a CDN, else the endpoint). */
export function publicUrl(key: string): string {
  const base = process.env.S3_PUBLIC_URL || \`\${cfg().endpoint}/\${cfg().bucket}\`
  return \`\${base.replace(/\\/$/, "")}/\${key}\`
}
`

// Route that hands the browser a presigned upload URL.
const UPLOAD_ROUTE = `import { NextRequest, NextResponse } from "next/server"
import { presignPut, publicUrl } from "@/lib/storage"
export async function POST(req: NextRequest) {
  const { filename, contentType } = await req.json().catch(() => ({}))
  if (!filename) return NextResponse.json({ error: "filename required" }, { status: 400 })
  const key = Date.now() + "-" + String(filename).replace(/[^a-zA-Z0-9._-]/g, "_")
  return NextResponse.json({ uploadUrl: presignPut(key), publicUrl: publicUrl(key), key, contentType })
}
`

export function deterministicStorage(config: DomainConfig, bp: Blueprint): { files: AppFile[] } | null {
  const tagline = typeof config.identity.tagline === "string" ? config.identity.tagline : ""
  const hay = `${config.identity.name} ${tagline} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  const wants = /upload|subir|archivo|file|imagen|image|photo|foto|avatar|adjunt|attach|document|video|audio|media|storage|s3|bucket|galer|gallery|portfolio|cv\b|pdf/.test(hay)
  if (!wants) return null
  return { files: [{ path: "lib/storage.ts", content: STORAGE }, { path: "app/api/upload/route.ts", content: UPLOAD_ROUTE }] }
}
