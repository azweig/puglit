# Build report — Promiedos

## Bespoke app (generation swarm)

Promiedos is a live Argentine football tracker providing real-time updates on matches, fixtures, standings, top scorers, and historical results. The data is scraped and updated periodically via cron jobs, offering users an up-to-date view of the football landscape without requiring an account.

- Tablas: matches, tournaments, standings, scorers
- Rutas API: app/api/live-football/route.ts, app/api/matches/route.ts, app/api/tournaments/route.ts, app/api/standings/route.ts, app/api/scorers/route.ts
- Pantallas: /, /matches, /standings, /scorers, /app/create-match, /app/create-tournament, /app/create-standing, /app/create-scorer
