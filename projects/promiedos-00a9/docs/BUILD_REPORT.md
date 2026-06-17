# Build report — Promiedos

## Bespoke app (generation swarm)

Promiedos es una aplicación que ofrece información en vivo sobre el fútbol argentino, incluyendo partidos del día, fixtures, tablas de posiciones, goleadores y resultados históricos. Los datos son actualizados automáticamente a través de un proceso de scraping y cron.

- Tablas: matches, tournaments, standings, goal_scorers
- Rutas API: app/api/v1/live-matches, app/api/v1/matches, app/api/v1/tournaments, app/api/v1/standings, app/api/v1/goal-scorers
- Pantallas: /app, /app/matches/create, /app/tournaments/create, /app/standings/create, /app/goal-scorers/create
