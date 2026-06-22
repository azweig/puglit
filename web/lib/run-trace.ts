/**
 * run-trace.ts — a tiny in-process span collector for the swarm's LLM calls (the agent-house idea).
 * Every call() in openai.ts records one span here; swarm-profile.ts scores the run from these. Process-
 * global + bounded; reset at the start of each build. Zero deps, no I/O.
 */
export type Span = { tier: string; model: string; promptChars: number; outChars: number; ms: number; ok: boolean; json: boolean }

let spans: Span[] = []
let tokens = 0 // #15: running token estimate for this build (chars/4)

export function traceReset(): void { spans = []; tokens = 0 }
export function traceCall(s: Span): void { if (spans.length < 5000) spans.push(s); tokens += Math.ceil((s.promptChars + s.outChars) / 4) }
export function traceSpans(): Span[] { return spans }
/** #15 — tokens (estimate) spent so far this build. Used to enforce a per-build budget cap. */
export function traceTokens(): number { return tokens }
