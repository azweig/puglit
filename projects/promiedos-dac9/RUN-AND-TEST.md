# Probar Promiedos localmente (end-to-end)

Este repo es autónomo: cloná, levantá una base y probá el flujo real.

## Requisitos
- Node 20+
- Docker (para Postgres) — o un Postgres propio.

## Pasos
```bash
# 1. Base de datos
docker compose up -d db

# 2. Variables de entorno locales
cp .env.local.example .env.local

# 3. Dependencias
npm install

# 4. Crear el esquema (tablas)
node --env-file=.env.local scripts/db-setup.mjs

# 5. Levantar la app
npm run dev          # → http://localhost:3000

# 6. (opcional) Test end-to-end automático, en otra terminal
node --env-file=.env.local scripts/e2e.mjs
```

El paso 6 registra usuarios, publica, hace swipe hasta un match mutuo, chatea (con
scoping de privacidad) y verifica las pantallas — el flujo completo, sin tocar nada.

## Producción
Desplegá en Vercel o Fly. Seteá `POSTGRES_*` y `JWT_SECRET` como secretos del host
(usá el POOLER de Supabase como host, no localhost). El esquema está en `sql/`.
