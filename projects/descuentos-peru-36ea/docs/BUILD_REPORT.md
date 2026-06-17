# Build report — Descuentos Perú

## Bespoke app (generation swarm)

Descuentos Perú es una aplicación web que permite a los usuarios ver descuentos en restaurantes y tiendas cercanas basados en los programas de lealtad que poseen y su ubicación actual. Los usuarios pueden gestionar sus programas de lealtad y establecer su ubicación para recibir ofertas personalizadas.

- Tablas: programs, user_memberships, merchants, branches, offers
- Rutas API: app/api/programs/list.ts, app/api/user/memberships/add.ts, app/api/user/memberships/remove.ts, app/api/location/set.ts, app/api/offers/nearby.ts, app/api/merchants/create.ts, app/api/branches/create.ts, app/api/offers/create.ts
- Pantallas: /app, /app/memberships, /app/location, /app/merchants/create, /app/branches/create, /app/offers/create
