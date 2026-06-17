/**
 * Puglit Spine — analytics.ts (client)
 * Unified tracking: GA4 + Microsoft Clarity + internal funnel (persisted).
 * Generic, domain-agnostic. IDs come from env (NEXT_PUBLIC_*).
 */
declare global {
  interface Window {
    gtag: (...a: any[]) => void
    clarity: (...a: any[]) => void
    fbq: (...a: any[]) => void
  }
}

function gtag(...a: any[]) { if (typeof window !== "undefined" && window.gtag) window.gtag(...a) }
function clarity(action: string, ...a: any[]) { if (typeof window !== "undefined" && window.clarity) window.clarity(action, ...a) }

/** Sends funnel/UX events to /api/track, which PERSISTS them (analytics_events). */
function trackInternal(event: string, data: Record<string, any> = {}) {
  if (typeof window === "undefined") return
  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ page: window.location.pathname, event, ...data }),
  }).catch(() => {})
}

// Generic conversion funnel — the generator can extend per domain.
const FUNNEL_STEPS: Record<string, number> = {
  landing: 1, signup_view: 2, form_started: 3, form_completed: 4,
  activated: 5, pricing: 6, checkout: 7, purchased: 8,
}

export const analytics = {
  pageView(path: string, title?: string) {
    gtag("event", "page_view", { page_path: path, page_title: title })
    clarity("set", "page", path)
    trackInternal("page_view", { referrer: typeof document !== "undefined" ? document.referrer : "" })
  },

  funnelStep(step: keyof typeof FUNNEL_STEPS, data: Record<string, any> = {}) {
    const n = FUNNEL_STEPS[step]
    gtag("event", "funnel_step", { step_name: step, step_number: n, ...data })
    clarity("set", "funnel_step", String(step))
    trackInternal("funnel_step", { step, stepNumber: n, ...data })
  },

  event(name: string, data: Record<string, any> = {}) {
    gtag("event", name, data)
    trackInternal(name, data)
  },

  formError(reason: string, form: string) {
    gtag("event", "form_error", { reason, form })
    trackInternal("form_error", { reason, form })
  },

  setUser(props: { plan?: string; userId?: number | string; language?: string }) {
    if (props.plan) { gtag("set", "user_properties", { user_plan: props.plan }); clarity("set", "user_plan", props.plan) }
    if (props.userId) clarity("identify", String(props.userId))
  },
}
