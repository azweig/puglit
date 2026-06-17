# Build report — Truke

## Bespoke app (generation swarm)

Truke es una aplicación tipo Tinder para intercambiar y regalar cosas usadas. Los usuarios pueden deslizar fotos de objetos, publicar los suyos, y si hay un match mutuo, pueden chatear de forma anónima sobre los items que hicieron match.

- Tablas: items, swipes, matches, messages
- Rutas API: app/api/feed/route.ts, app/api/items/route.ts, app/api/swipes/route.ts, app/api/matches/route.ts, app/api/messages/route.ts, app/api/messages/route.ts
- Pantallas: /app, /app/publicar, /app/matches, /app/chat/[matchId]
