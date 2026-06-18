import { NextRequest, NextResponse } from 'next/server'
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

export const runtime = 'nodejs'

type QueryResult<T = Record<string, unknown>> = { rows: T[] }
type QueryFunction = <T = Record<string, unknown>>(text: string, params?: unknown[]) => Promise<QueryResult<T>>

declare global {
  var __appDbQuery: QueryFunction | undefined
}

async function query<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<QueryResult<T>> {
  const globalQuery = globalThis.__appDbQuery
  if (globalQuery) return globalQuery<T>(text, params)

  const endpoint = process.env.DATABASE_QUERY_URL
  if (endpoint) {
    const headers: Record<string, string> = { 'content-type': 'application/json' }
    const token = process.env.DATABASE_QUERY_TOKEN
    if (token) headers.authorization = `Bearer ${token}`

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ text, params }),
    })

    if (!response.ok) throw new Error(`database_query_http_${response.status}`)
    const data = (await response.json()) as { rows?: T[] }
    return { rows: Array.isArray(data.rows) ? data.rows : [] }
  }

  throw new Error('database_adapter_missing')
}

type RunPayload = {
  v: 1
  scenarioId: string
  difficulty: string
  startedAt: number
  expiresAt: number
  maxScore: number
  nonce: string
}

type ScoreSubmitEvent = {
  event: 'score_submit'
  scenarioId: string
  difficulty: string
  startedAt: number
  completedAt: number
  elapsedMs: number
  maxScore: number
  successful: boolean
  score: number
}

type LeaderboardRow = {
  name: string
  score: number
  created_at?: string
}

const ABSOLUTE_MAX_SCORE = 1_000_000
const RUN_TOKEN_TTL_MS = 2 * 60 * 60 * 1000
const FALLBACK_TOKEN_SECRET = randomBytes(32).toString('hex')

function signingSecret() {
  return (
    process.env.SCORE_RUN_TOKEN_SECRET ||
    process.env.SCORE_TOKEN_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    FALLBACK_TOKEN_SECRET
  )
}

function base64Url(input: Buffer | string) {
  return Buffer.from(input).toString('base64').split('+').join('-').split('/').join('_').replace(/=+$/, '')
}

function base64UrlDecode(input: string) {
  const base64 = input.split('-').join('+').split('_').join('/')
  return Buffer.from(base64 + '='.repeat((4 - (base64.length % 4)) % 4), 'base64')
}

function signTokenPayload(encodedPayload: string) {
  return base64Url(createHmac('sha256', signingSecret()).update(encodedPayload).digest())
}

function createRunToken(payload: RunPayload) {
  const encodedPayload = base64Url(JSON.stringify(payload))
  return `${encodedPayload}.${signTokenPayload(encodedPayload)}`
}

function verifyRunToken(token: string): RunPayload | null {
  const parts = token.split('.')
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null

  const expected = Buffer.from(signTokenPayload(parts[0]), 'utf8')
  const actual = Buffer.from(parts[1], 'utf8')
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null

  try {
    const payload = JSON.parse(base64UrlDecode(parts[0]).toString('utf8')) as Partial<RunPayload>
    const now = Date.now()

    if (payload.v !== 1) return null
    if (typeof payload.scenarioId !== 'string' || !payload.scenarioId) return null
    if (typeof payload.difficulty !== 'string' || !payload.difficulty) return null
    if (typeof payload.nonce !== 'string' || !payload.nonce) return null
    if (typeof payload.startedAt !== 'number' || !Number.isFinite(payload.startedAt)) return null
    if (typeof payload.expiresAt !== 'number' || !Number.isFinite(payload.expiresAt)) return null
    if (typeof payload.maxScore !== 'number' || !Number.isFinite(payload.maxScore)) return null
    if (payload.expiresAt < now || payload.startedAt > now + 60_000) return null
    if (payload.maxScore <= 0 || payload.maxScore > ABSOLUTE_MAX_SCORE) return null

    return {
      v: 1,
      scenarioId: payload.scenarioId,
      difficulty: payload.difficulty,
      startedAt: Math.floor(payload.startedAt),
      expiresAt: Math.floor(payload.expiresAt),
      maxScore: Math.floor(payload.maxScore),
      nonce: payload.nonce,
    }
  } catch {
    return null
  }
}

function sanitizeIdentifier(value: unknown, fallback: string) {
  const raw = typeof value === 'string' && value.trim() ? value.trim() : fallback
  return raw.replace(/[^a-zA-Z0-9:_-]/g, '').slice(0, 80) || fallback
}

function sanitizeDifficulty(value: unknown) {
  const difficulty = sanitizeIdentifier(value, 'normal').toLowerCase()
  return ['beginner', 'easy', 'normal', 'medium', 'hard', 'expert'].includes(difficulty) ? difficulty : 'normal'
}

function allowedMaxScoreFor(_scenarioId: string, _difficulty: string) {
  return ABSOLUTE_MAX_SCORE
}

function isStartRequest(body: Record<string, unknown>, pathname = '') {
  const action = typeof body.action === 'string' ? body.action.toLowerCase() : ''
  return pathname.endsWith('/start') || ['start', 'begin', 'run_start', 'create_run', 'issue_token'].includes(action)
}

function parseSubmittedScore(value: unknown) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return null
  const score = Math.floor(numeric)
  return score >= 0 ? score : null
}

function parseSubmittedSuccessful(value: unknown, fallback: boolean) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number' && Number.isFinite(value)) return value > 0
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (['true', '1', 'yes', 'y', 'success', 'successful', 'won', 'win', 'passed', 'pass'].includes(normalized)) return true
    if (['false', '0', 'no', 'n', 'fail', 'failed', 'lost', 'lose', 'blocked'].includes(normalized)) return false
  }
  return fallback
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null
}

function parseEvaluatorConfirmedSuccess(body: Record<string, unknown>) {
  const directKeys = ['evaluatorConfirmed', 'verifiedSuccess', 'successful', 'success', 'wasSuccessful', 'passed']
  for (const key of directKeys) {
    if (key in body) return parseSubmittedSuccessful(body[key], false)
  }

  const nestedKeys = ['evaluator', 'evaluation', 'duelEvaluation', 'result', 'outcome']
  for (const nestedKey of nestedKeys) {
    const nested = asRecord(body[nestedKey])
    if (!nested) continue

    for (const key of directKeys) {
      if (key in nested) return parseSubmittedSuccessful(nested[key], false)
    }

    if ('status' in nested) return parseSubmittedSuccessful(nested.status, false)
  }

  return false
}

function elapsedMsFor(startedAt: number, completedAt: number) {
  return Math.max(0, Math.floor(completedAt) - Math.floor(startedAt))
}

async function getLeaderboard() {
  try {
    const { rows } = await query<LeaderboardRow>('SELECT name, score, created_at FROM scores ORDER BY score DESC, created_at ASC LIMIT 10')
    return rows
  } catch {
    return []
  }
}

async function storeScoreSubmitEvent(event: ScoreSubmitEvent) {
  try {
    await query('INSERT INTO funnel_events (event_name, payload) VALUES ($1, $2::jsonb)', [event.event, JSON.stringify(event)])
  } catch {
  }
}

export async function GET() {
  return NextResponse.json(await getLeaderboard())
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>

    if (isStartRequest(body, request.nextUrl.pathname)) {
      const scenarioId = sanitizeIdentifier(body.scenarioId ?? body.lessonId, 'default')
      const difficulty = sanitizeDifficulty(body.difficulty)
      const now = Date.now()
      const maxScore = allowedMaxScoreFor(scenarioId, difficulty)
      const runPayload: RunPayload = {
        v: 1,
        scenarioId,
        difficulty,
        startedAt: now,
        expiresAt: now + RUN_TOKEN_TTL_MS,
        maxScore,
        nonce: randomBytes(16).toString('hex'),
      }
      const token = createRunToken(runPayload)
      const leaderboard = await getLeaderboard()

      return NextResponse.json({
        token,
        runToken: token,
        signedRun: {
          token,
          payload: runPayload,
        },
        scenarioId,
        difficulty,
        startedAt: runPayload.startedAt,
        maxScore,
        expiresAt: runPayload.expiresAt,
        leaderboard,
      })
    }

    const runToken = typeof body.runToken === 'string' ? body.runToken : typeof body.token === 'string' ? body.token : ''
    if (!runToken) return NextResponse.json({ error: 'run_token_required' }, { status: 401 })

    const run = verifyRunToken(runToken)
    if (!run) return NextResponse.json({ error: 'invalid_run_token' }, { status: 401 })

    const submittedScenarioId = body.scenarioId ?? body.lessonId
    if (submittedScenarioId !== undefined && sanitizeIdentifier(submittedScenarioId, run.scenarioId) !== run.scenarioId) {
      return NextResponse.json({ error: 'run_context_mismatch' }, { status: 400 })
    }

    if (body.difficulty !== undefined && sanitizeDifficulty(body.difficulty) !== run.difficulty) {
      return NextResponse.json({ error: 'run_context_mismatch' }, { status: 400 })
    }

    const evaluatorConfirmedSuccess = parseEvaluatorConfirmedSuccess(body)
    if (!evaluatorConfirmedSuccess) {
      return NextResponse.json({ error: 'score_requires_successful_evaluation' }, { status: 400 })
    }

    const score = parseSubmittedScore(body.score)
    if (score === null) return NextResponse.json({ error: 'invalid_score' }, { status: 400 })

    const serverMaxScore = Math.min(run.maxScore, allowedMaxScoreFor(run.scenarioId, run.difficulty))
    if (score > serverMaxScore) return NextResponse.json({ error: 'score_out_of_bounds' }, { status: 400 })

    const completedAt = Date.now()
    const elapsedMs = elapsedMsFor(run.startedAt, completedAt)
    const successful = true
    const name = String(body.name || 'Anónimo').slice(0, 24)
    const { rows } = await query(
      'INSERT INTO scores (name, score, scenario_id, difficulty, started_at, elapsed_ms, max_score, successful) VALUES ($1, $2, $3, $4, to_timestamp($5 / 1000.0), $6, $7, $8) RETURNING id, name, score, scenario_id, difficulty, started_at, elapsed_ms, max_score, successful',
      [name, score, run.scenarioId, run.difficulty, run.startedAt, elapsedMs, serverMaxScore, successful]
    )

    await storeScoreSubmitEvent({
      event: 'score_submit',
      scenarioId: run.scenarioId,
      difficulty: run.difficulty,
      startedAt: run.startedAt,
      completedAt,
      elapsedMs,
      maxScore: serverMaxScore,
      successful,
      score,
    })

    const leaderboard = await getLeaderboard()
    return NextResponse.json({ ...(rows[0] || {}), leaderboard }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'could_not_save' }, { status: 400 })
  }
}
