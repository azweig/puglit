# Build report — Descuentos Perú

## Bespoke app (generation swarm)

Descuentos Perú es una aplicación web que permite a los usuarios ver descuentos en restaurantes y tiendas cercanas basados en los programas de lealtad que poseen y su ubicación actual.

- Tablas: programs, user_memberships, merchants, branches, offers
- Rutas API: app/api/programs/list.ts, app/api/memberships/add.ts, app/api/location/set.ts, app/api/offers/nearby.ts, app/api/merchants/list.ts, app/api/branches/list.ts
- Pantallas: /app, /app/memberships, /app/location, /app/offers, /app/merchants, /app/branches
