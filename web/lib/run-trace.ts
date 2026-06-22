/**
 * run-trace.ts — a tiny in-process span collector for the swarm's LLM calls (the agent-house idea).
 * Every call() in openai.ts records one span here; swarm-profile.ts scores the run from these. Process-
 * global + bounded; reset at the start of each build. Zero deps, no I/O.
 */
export type Span = { tier: string; model: string; promptChars: number; outChars: number; ms: number; ok: boolean; json: boolean }

let spans: Span[] = []

export function traceReset(): void { spans = [] }
export function traceCall(s: Span): void { if (spans.length < 5000) spans.push(s) }
export function traceSpans(): Span[] { return spans }
