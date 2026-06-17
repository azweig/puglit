# Pip Runner — correr y probar localmente

Endless runner original (personaje "Pip" propio, sin derechos de autor de terceros).
8 mundos × 8 niveles, jugable con un toque (celular o desktop), con leaderboard en Postgres.

## Requisitos
- Node 20+
- Docker (para Postgres) — o un Postgres propio.

## Pasos
```bash
docker compose up -d db                              # Postgres
cp .env.local.example .env.local
npm install
node --env-file=.env.local scripts/db-setup.mjs      # crea la tabla de scores
npm run dev                                           # → http://localhost:3000
# (opcional) test end-to-end:
node --env-file=.env.local scripts/e2e.mjs
```

## Cómo se juega
- Elegí mundo/nivel en el menú (se desbloquean al ganar el anterior).
- **Tocá la pantalla** (o Espacio / ↑) para saltar los obstáculos.
- Llegá a la meta (barra de progreso arriba) para superar el nivel.
- Tu distancia se guarda en el leaderboard (tabla `scores`).

## Producción
Desplegá en Vercel/Fly y configurá `POSTGRES_*` (usá el pooler de Supabase como host).
El esquema está en `sql/app.sql`.
