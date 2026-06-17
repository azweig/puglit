# Build report — Descuentos Perú

## Bespoke app (generation swarm)

Descuentos Perú es una aplicación web que permite a los usuarios ver descuentos disponibles en tiendas y restaurantes cercanos basados en los programas de lealtad que poseen y su ubicación actual.

- Tablas: programs, user_memberships, merchants, branches, offers
- Rutas API: app/api/nearby-offers/route.ts, app/api/my-programs/route.ts, app/api/set-location/route.ts, app/api/offers/route.ts, app/api/merchants/route.ts, app/api/programs/route.ts
- Pantallas: /app, /app/my-programs, /app/set-location, /app/create-offer, /app/create-merchant, /app/create-program
