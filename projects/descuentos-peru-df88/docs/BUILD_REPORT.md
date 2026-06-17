# Build report — Descuentos Perú

## Bespoke app (generation swarm)

Descuentos Perú es una aplicación web que permite a los usuarios ver descuentos en restaurantes y tiendas cercanas basados en los programas de lealtad que poseen y su ubicación actual. Los usuarios pueden agregar sus programas de lealtad y establecer su ubicación para descubrir ofertas cercanas.

- Tablas: loyalty_programs, user_memberships, merchants, branches, offers
- Rutas API: app/api/programs/route.ts, app/api/memberships/route.ts, app/api/memberships/route.ts, app/api/location/route.ts, app/api/discounts/route.ts, app/api/merchants/route.ts, app/api/branches/route.ts, app/api/offers/route.ts
- Pantallas: /, /mis-programas, /establecer-ubicacion, /crear-comerciante, /crear-sucursal, /crear-oferta
