# Puglit — Security model

Security is a **first-class citizen**, at two levels: every generated SaaS is **secure by default**, and every generation passes an **automated ethical-hacking gate** before it's delivered.

---

## 1. Secure by default (baked into the Spine)

Every generated project ships with:

- **Auth hardening** — JWT with short expiry + rotation, httpOnly/SameSite cookies, bcrypt (cost ≥ 10), magic-link/OTP, optional 2FA hook. Email verification as a soft gate.
- **Authorization** — per-user row ownership + **RLS** on `ownedByUser` entities; premium checks centralized in `getEffectivePlan` (no ad-hoc gating).
- **Input validation** — every route validates with **Zod**; reject-by-default.
- **SQL safety** — parameterized queries only (`$1,$2`); no string interpolation. ORM-free but disciplined.
- **Rate limiting** — per-route map in middleware (tuned: generous on auth so real users aren't locked out, strict on expensive/payment routes).
- **Secrets** — never in code; `secrets.example.env` documents them; `.gitignore` blocks `.env`. Webhook signatures verified (Stripe/MP).
- **Headers/CSP** — security headers, CSP, HTTPS forced.
- **Dependencies** — pinned; Dependabot config included.
- **PII discipline** — minimal collection, encryption helpers for sensitive fields.

---

## 2. The ethical-hacking gate (pipeline step 5)

After the LLM writes the domain (and **before** anything is pushed to the user's GitHub), the generator runs an automated security pass. The repo is **only delivered if it passes**; a `SECURITY_REPORT.md` is attached.

```
DOMAIN GENERATED
      │
      ▼
┌─────────────────────────────────────────────┐
│ 1. SAST          — Semgrep (OWASP + Next.js  │
│                    + custom Puglit rules)     │
│ 2. DEPS          — osv-scanner / npm audit    │
│ 3. SECRETS       — gitleaks (block any leak)  │
│ 4. RED-TEAM      — LLM prompted to ATTACK the │
│                    generated domain:          │
│                    · authz bypass / IDOR      │
│                    · injection (SQL/CMD/SSRF) │
│                    · missing premium gating   │
│                    · broken object-level auth │
│                    · unsafe AI prompt surfaces│
│ 5. AUTO-FIX LOOP — findings → patch → re-scan │
│                    (max N rounds)             │
└─────────────────────────────────────────────┘
      │  all clear?
      ├─ yes → VERIFY (typecheck + build + tests) → DELIVER + SECURITY_REPORT.md
      └─ no  → block delivery, surface findings
```

### What the red-team specifically checks on the generated domain
- Every `ownedByUser` entity route enforces ownership (no IDOR).
- Premium-gated features actually call `getEffectivePlan` server-side, not just hide UI.
- No user input flows unsanitized into SQL, shell, file paths, or external URLs (SSRF).
- AI-layer endpoints can't be prompt-injected into leaking data or unbounded cost.
- Webhooks verify signatures; no unauthenticated mutation routes.
- No secrets, tokens, or internal URLs committed.

### Honest scope (no overselling)
- The **Spine** is mechanically assembled and pre-audited → effectively zero compile/security regressions there.
- The **domain** is LLM-generated → low-but-nonzero risk, which is exactly why this gate exists. The gate raises the floor dramatically but is **not a substitute for a human pentest** on a high-stakes production app. The delivered `SECURITY_REPORT.md` says so.

---

## 3. Tooling
`Semgrep` · `osv-scanner` / `npm audit` · `gitleaks` · an LLM red-team prompt pack (lives in the generator, Phase 2/3). Reporting a vuln in the Spine itself: see repo issues / SECURITY contact (to be added).
