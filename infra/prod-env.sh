#!/usr/bin/env bash
# One-time production hardening: write strong secrets to web/.env.local so the app stops
# running on the (forgeable) dev defaults. Idempotent — keeps any key already set. Run once,
# then rebuild. .env.local is gitignored, so secrets never reach the repo.
#
#   bash infra/prod-env.sh        → generate secrets
#   (optional) edit web/.env.local to add RESEND_API_KEY for real login emails
#   then: git pull && nohup bash infra/rebuild.sh > /tmp/rebuild.log 2>&1 &
set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV="$ROOT/web/.env.local"
touch "$ENV"
rnd() { node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"; }
add() { if grep -q "^$1=" "$ENV"; then echo "  · $1 ya existe (lo dejo)"; else echo "$1=$(rnd)" >> "$ENV"; echo "  + $1 generado"; fi; }

echo "→ secretos de producción en $ENV"
add PUGLIT_SESSION_SECRET     # firma de la cookie de sesión (sin esto, sesiones falsificables)
add PUGLIT_SERVICE_TOKEN      # token interno build-local ↔ server
add CRON_SECRET               # protege /api/cron/sweep

# email (opcional): para que los códigos de login lleguen por mail en vez de salir en el log
grep -q "^RESEND_API_KEY=" "$ENV"   || echo "# RESEND_API_KEY=re_xxxxx           # ← pegá tu key de Resend para mail real" >> "$ENV"
grep -q "^PUGLIT_MAIL_FROM=" "$ENV" || echo "# PUGLIT_MAIL_FROM=Puglit <hola@tudominio.com>" >> "$ENV"
# imágenes (opcional): logos reales en vez de monograma SVG
grep -q "^OPENAI_API_KEY=" "$ENV"   || echo "# OPENAI_API_KEY=sk-xxxxx           # ← para logos reales (gpt-image-1) y BYOK" >> "$ENV"

echo "✓ listo. Revisá $ENV (descomentá RESEND/OPENAI si los querés). Ahora corré el rebuild."
