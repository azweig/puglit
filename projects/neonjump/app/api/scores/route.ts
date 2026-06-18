import { NextRequest, NextResponse } from "next/server"
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto"
import { createRequire } from "node:module"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type DbRow = Record<string, unknown>
type QueryResult<T extends DbRow = DbRow> = { rows: T[] }
type QueryAdapter = { query: <T extends DbRow = DbRow>(sql: string, params?: readonly unknown[]) => Promise<QueryResult<T>> }

type Difficulty = "easy" | "normal" | "hard" | "expert"
type RateLimitBucket = { count: number; resetAt: number }
type RunTokenPayload = { v: 1; d: Difficulty; iat: number; n: string; iph: string }

const requireOptional = createRequire(import.meta.url)
const MAX_NAME_LENGTH = 24
const RUN_TOKEN_TTL_MS = 15 * 60 * 1000
const ELAPSED_TOLERANCE_MS = 5000
// Required in production for POST score mutations/run tokens: set NEONJUMP_RUN_TOKEN_SECRET (or RUN_TOKEN_SECRET) to a >=32 character secret.
// Public GET leaderboard reads do not require this secret.
const RUN_TOKEN_SECRET = process.env.NEONJUMP_RUN_TOKEN_SECRET || process.env.RUN_TOKEN_SECRET

const DIFFICULTY_ALIASES: Record<string, Difficulty> = {
  easy: "easy",
  facil: "easy",
  fácil: "easy",
  beginner: "easy",
  normal: "normal",
  medium: "normal",
  medio: "normal",
  hard: "hard",
  dificil: "hard",
  difícil: "hard",
  expert: "expert",
  experto: "expert",
}

const DIFFICULTY_CONFIG: Record<Difficulty, { maxScorePerSecond: number; graceScore: number; absoluteMax: number; minElapsedMs: number }> = {
  easy: { maxScorePerSecond: 7500, graceScore: 1000, absoluteMax: 500_000, minElapsedMs: 500 },
  normal: { maxScorePerSecond: 10_000, graceScore: 1500, absoluteMax: 750_000, minElapsedMs: 500 },
  hard: { maxScorePerSecond: 15_000, graceScore: 2000, absoluteMax: 1_000_000, minElapsedMs: 500 },
  expert: { maxScorePerSecond: 20_000, graceScore: 2500, absoluteMax: 1_000_000, minElapsedMs: 500 },
}

const globalState = globalThis as typeof globalThis & { __scoresRateLimit?: Map<string, RateLimitBucket> }
const rateLimitStore = (globalState.__scoresRateLimit ||= new Map<string, RateLimitBucket>())

let dbAdapter: QueryAdapter | undefined

function requireModule(moduleName: string): any | null {
  try {
    return requireOptional(moduleName)
  } catch {
    return null
  }
}

function shouldUseSsl(connectionString: string) {
  try {
    const url = new URL(connectionString)
    if (url.searchParams.get("sslmode") === "disable") return false
    return url.hostname !== "localhost" && url.hostname !== "127.0.0.1"
  } catch {
    return true
  }
}

function getDbAdapter(): QueryAdapter {
  if (dbAdapter) return dbAdapter

  const vercelPostgres = requireModule("@vercel/postgres")
  if (vercelPostgres?.sql?.query) {
    dbAdapter = {
      query: (sql, params = []) => vercelPostgres.sql.query(sql, params),
    }
    return dbAdapter
  }

  const pg = requireModule("pg")
  if (pg?.Pool) {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING
    if (!connectionString) throw new Error("database_url_missing")

    const pool = new pg.Pool({
      connectionString,
      ssl: shouldUseSsl(connectionString) ? { rejectUnauthorized: false } : false,
    })

    dbAdapter = {
      query: (sql, params = []) => pool.query(sql, params),
    }
    return dbAdapter
  }

  throw new Error("database_driver_missing")
}

async function query<T extends DbRow = DbRow>(sql: string, params: readonly unknown[] = []): Promise<QueryResult<T>> {
  return getDbAdapter().query<T>(sql, params)
}

function logInfo(event: string, data: Record<string, unknown> = {}) {
  console.info(JSON.stringify({ event, ...data }))
}

function logError(event: string, data: Record<string, unknown> = {}) {
  console.error(JSON.stringify({ event, ...data }))
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "unknown_error"
}

function clientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown"
}

function getRunTokenSecret() {
  return RUN_TOKEN_SECRET && RUN_TOKEN_SECRET.length >= 32 ? RUN_TOKEN_SECRET : null
}

function runTokenSecretMissingResponse() {
  logError("leaderboard_run_token_secret_missing", { requiredEnv: "NEONJUMP_RUN_TOKEN_SECRET", fallbackEnv: "RUN_TOKEN_SECRET", minLength: 32 })
  return NextResponse.json({ error: "run_token_secret_missing" }, { status: 500 })
}

function ipHash(ip: string, secret: string) {
  return createHmac("sha256", secret).update(ip).digest("hex").slice(0, 16)
}

function base64UrlJson(value: unknown) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url")
}

function signPayload(encodedPayload: string, secret: string) {
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url")
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

function createRunToken(difficulty: Difficulty, requestIpHash: string, secret: string) {
  const payload: RunTokenPayload = {
    v: 1,
    d: difficulty,
    iat: Date.now(),
    n: randomBytes(16).toString("base64url"),
    iph: requestIpHash,
  }
  const encodedPayload = base64UrlJson(payload)
  return `${encodedPayload}.${signPayload(encodedPayload, secret)}`
}

function verifyRunToken(token: unknown, requestIpHash: string, secret: string) {
  if (typeof token !== "string" || token.length > 2048) return { ok: false as const, error: "run_token_required" }

  const [encodedPayload, signature, extra] = token.split(".")
  if (!encodedPayload || !signature || extra) return { ok: false as const, error: "run_token_invalid" }
  if (!safeEqual(signPayload(encodedPayload, secret), signature)) return { ok: false as const, error: "run_token_invalid" }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as Partial<RunTokenPayload>
    if (payload.v !== 1 || !payload.d || !DIFFICULTY_CONFIG[payload.d] || typeof payload.iat !== "number" || typeof payload.n !== "string") {
      return { ok: false as const, error: "run_token_invalid" }
    }
    if (payload.iph !== requestIpHash) return { ok: false as const, error: "run_token_invalid" }

    const age = Date.now() - payload.iat
    if (age < -ELAPSED_TOLERANCE_MS || age > RUN_TOKEN_TTL_MS) return { ok: false as const, error: "run_token_expired" }

    return { ok: true as const, payload: payload as RunTokenPayload, serverElapsedMs: age }
  } catch {
    return { ok: false as const, error: "run_token_invalid" }
  }
}

function normalizeDifficulty(value: unknown, fallback: Difficulty | null = null): Difficulty | null {
  if (typeof value !== "string") return fallback
  return DIFFICULTY_ALIASES[value.trim().toLowerCase()] || fallback
}

function normalizeName(value: unknown) {
  const raw = typeof value === "string" ? value : "Anónimo"
  const compact = raw.replace(/\s+/g, " ").trim() || "Anónimo"
  const name = compact.slice(0, MAX_NAME_LENGTH)
  return { name, truncated: compact.length > MAX_NAME_LENGTH, originalLength: compact.length }
}

function normalizeScore(value: unknown) {
  const raw = Number(value)
  if (!Number.isFinite(raw)) return { ok: false as const, error: "invalid_score" }
  const score = Math.floor(raw)
  if (score < 0) return { ok: false as const, error: "invalid_score" }
  return { ok: true as const, score, normalized: score !== raw }
}

function normalizeElapsedMs(value: unknown) {
  const elapsedMs = Number(value)
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) return null
  return Math.floor(elapsedMs)
}

function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  const existing = rateLimitStore.get(key)

  if (!existing || existing.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true as const }
  }

  if (existing.count >= limit) {
    return { allowed: false as const, retryAfter: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)) }
  }

  existing.count += 1
  return { allowed: true as const }
}

function cleanupRateLimits() {
  if (rateLimitStore.size < 10_000) return
  const now = Date.now()
  for (const [key, bucket] of rateLimitStore) {
    if (bucket.resetAt <= now) rateLimitStore.delete(key)
  }
}

function scorePlausibilityError(score: number, difficulty: Difficulty, elapsedMs: number, serverElapsedMs: number) {
  const config = DIFFICULTY_CONFIG[difficulty]
  if (score > config.absoluteMax) return "score_not_plausible"
  if (elapsedMs < config.minElapsedMs) return "run_too_short"
  if (elapsedMs > RUN_TOKEN_TTL_MS) return "elapsed_time_invalid"
  if (elapsedMs > serverElapsedMs + ELAPSED_TOLERANCE_MS) return "elapsed_time_invalid"

  const plausibleMax = Math.min(config.absoluteMax, Math.ceil((elapsedMs / 1000) * config.maxScorePerSecond + config.graceScore))
  if (score > plausibleMax) return "score_not_plausible"

  return null
}

function rejectScore(error: string, status = 400, extra: Record<string, unknown> = {}) {
  logInfo("leaderboard_score_rejected", { error, ...extra })
  return NextResponse.json({ error }, { status })
}

// GET: top 10 scores. POST: issue a run token or submit a verified score. Public (no auth) — it's an arcade leaderboard.
export async function GET() {
  try {
    const { rows } = await query("SELECT name, score, difficulty, created_at FROM scores ORDER BY score DESC, created_at ASC LIMIT 10")
    return NextResponse.json(rows)
  } catch (error) {
    logError("leaderboard_scores_load_error", { error: errorMessage(error) })
    return NextResponse.json({ error: "could_not_load_scores" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  cleanupRateLimits()

  const secret = getRunTokenSecret()
  if (!secret) return runTokenSecretMissingResponse()

  const ip = clientIp(request)
  const hashedIp = ipHash(ip, secret)
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const action = String(body?.action || "").trim().toLowerCase()

  if (action === "start" || action === "start_run" || body?.start === true) {
    const limit = rateLimit(`scores:start:${hashedIp}`, 20, 60_000)
    if (!limit.allowed) return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } })

    const difficulty = normalizeDifficulty(body?.difficulty, "normal")
    if (!difficulty) return NextResponse.json({ error: "invalid_difficulty" }, { status: 400 })

    const runToken = createRunToken(difficulty, hashedIp, secret)
    logInfo("leaderboard_run_token_created", { difficulty })
    return NextResponse.json({ runToken, difficulty, expiresInMs: RUN_TOKEN_TTL_MS }, { status: 201 })
  }

  const limit = rateLimit(`scores:submit:${hashedIp}`, 5, 60_000)
  if (!limit.allowed) return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } })

  const verifiedToken = verifyRunToken(body?.runToken || body?.token, hashedIp, secret)
  if (!verifiedToken.ok) return rejectScore(verifiedToken.error, 401)

  const requestedDifficulty = normalizeDifficulty(body?.difficulty, verifiedToken.payload.d)
  if (requestedDifficulty !== verifiedToken.payload.d) return rejectScore("difficulty_mismatch", 400)
  const difficulty = verifiedToken.payload.d

  const submittedScore = normalizeScore(body?.score)
  if (!submittedScore.ok) return rejectScore(submittedScore.error, 400, { difficulty })

  const elapsedMs = normalizeElapsedMs(body?.elapsedMs ?? body?.durationMs ?? body?.elapsed)
  if (elapsedMs === null) return rejectScore("elapsed_time_required", 400, { difficulty, score: submittedScore.score })

  const plausibilityError = scorePlausibilityError(submittedScore.score, difficulty, elapsedMs, verifiedToken.serverElapsedMs)
  if (plausibilityError) return rejectScore(plausibilityError, 400, { difficulty, score: submittedScore.score, elapsedMs })

  const { name, truncated, originalLength } = normalizeName(body?.name)
  if (truncated) logInfo("leaderboard_name_truncated", { originalLength, maxLength: MAX_NAME_LENGTH })
  if (submittedScore.normalized) logInfo("leaderboard_score_normalized", { score: submittedScore.score })

  try {
    const { rows } = await query(
      "INSERT INTO scores (name, score, difficulty) VALUES ($1, $2, $3) RETURNING id, name, score, difficulty",
      [name, submittedScore.score, difficulty],
    )
    logInfo("leaderboard_score_created", { score: submittedScore.score, difficulty, elapsedMs, nameTruncated: truncated, scoreNormalized: submittedScore.normalized })
    return NextResponse.json(rows[0], { status: 201 })
  } catch (error) {
    logError("leaderboard_score_save_error", { error: errorMessage(error), score: submittedScore.score, difficulty })
    return NextResponse.json({ error: "could_not_save" }, { status: 500 })
  }
}
