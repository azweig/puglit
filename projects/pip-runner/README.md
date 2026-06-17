# Pip Runner

An original HTML5 endless-runner: **8 worlds × 8 levels**, mobile-playable (one-tap),
canvas game loop, with a Postgres leaderboard. Character "Pip" and all art are original
(no third-party characters).

Built by [Puglit](https://puglit.com) — open-source SaaS/game factory.

- `app/page.tsx` — the game (canvas engine + world/level select + leaderboard)
- `app/api/scores/route.ts` — leaderboard API (Postgres)
- `sql/app.sql` — schema · `scripts/` — db-setup + e2e
- **RUN-AND-TEST.md** — run & test locally
