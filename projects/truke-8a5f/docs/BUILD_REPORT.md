# Build report — Truke

## Bespoke app (generation swarm)

Truke es una aplicación para intercambiar y regalar objetos usados al estilo Tinder. Los usuarios pueden deslizar fotos de objetos, publicar los suyos y, si hay un match mutuo, chatear de forma anónima sobre los objetos que hicieron match.

- Tablas: items, swipes, matches, messages
- Rutas API: app/api/items/publish.ts, app/api/feed/route.ts, app/api/swipes/route.ts, app/api/matches/route.ts, app/api/messages/route.ts, app/api/messages/route.ts
- Pantallas: /app, /app/publicar, /app/matches, /app/chat/[matchId]
