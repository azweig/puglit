#!/usr/bin/env bash
# Seed DEMO users + projects to verify per-user isolation in the dashboard.
# Each user is logged in via the API (no email needed — devCode) and gets a few projects in
# varied states. Then you log in as each in the browser and confirm you ONLY see your own.
#   bash infra/demo-seed.sh
set -e
B="${BASE:-http://localhost:3000}"
PGP="${PG_PORT:-5432}"
export PGPASSWORD=postgres
q() { command psql -h localhost -p "$PGP" -U postgres -d puglit -tAc "$1" >/dev/null 2>&1 || true; }

login() { # $1=email → echoes cookie-jar path
  local e="$1" j="/tmp/demo_$(echo "$e" | tr -cd 'a-z0-9').txt"
  local c; c="$(curl -s -X POST "$B/api/auth/request" -H 'content-type: application/json' -d "{\"email\":\"$e\"}" | jq -r '.devCode // empty')"
  curl -s -c "$j" -X POST "$B/api/auth/verify" -H 'content-type: application/json' -d "{\"email\":\"$e\",\"code\":\"$c\"}" >/dev/null
  echo "$j"
}
mkjob() { # $1=jar $2=name $3=what → echoes id
  curl -s -b "$1" -X POST "$B/api/job/create" -H 'content-type: application/json' -d "{\"name\":\"$2\",\"what\":\"$3\"}" | jq -r '.id // empty'
}

echo "→ ana@demo.puglit.app"
JAR="$(login ana@demo.puglit.app)"
A1="$(mkjob "$JAR" Recetario 'recetas con fotos y favoritos')"
A2="$(mkjob "$JAR" FitTrack 'rutinas de gimnasio y progreso por ejercicio')"
A3="$(mkjob "$JAR" Reservas 'reservar canchas de padel por horario')"
q "UPDATE puglit_jobs SET status='done', completion=100 WHERE id='$A1'"
q "UPDATE puglit_jobs SET status='running', completion=60 WHERE id='$A2'"
echo "  3 proyectos: Recetario(listo) · FitTrack(construyendo 60%) · Reservas(en cola)"

echo "→ beto@demo.puglit.app"
JAR="$(login beto@demo.puglit.app)"
B1="$(mkjob "$JAR" Inventario 'control de stock para una tienda')"
B2="$(mkjob "$JAR" Blog 'blog personal con markdown y tags')"
q "UPDATE puglit_jobs SET status='done', completion=100 WHERE id='$B1'"
echo "  2 proyectos: Inventario(listo) · Blog(en cola)"

echo ""
echo "✓ VERIFICÁ LA AISLACIÓN en el navegador:"
echo "  1. $B/login → ana@demo.puglit.app → el código sale en pantalla → ves SOLO los 3 de Ana"
echo "  2. botón 'Salir' → beto@demo.puglit.app → ves SOLO los 2 de Beto"
echo "  (cada uno NO ve los proyectos del otro)"
