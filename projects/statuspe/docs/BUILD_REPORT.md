# Build report — StatusPe

## Bespoke app (generation swarm)

StatusPe es una página pública de estado, sin login para visitantes, que muestra en tiempo real el estado global de un servicio, sus componentes monitoreados por endpoints HTTPS, barras de uptime de los últimos 90 días, incidentes activos, mantenimientos programados, historial mensual, páginas de detalle con timeline, suscripción pública a actualizaciones y feed RSS. Los datos de páginas, componentes y endpoints son catálogo/configuración curada por el operador mediante seeds o ingestión interna; los visitantes solo leen el estado público y pueden crear/gestionar suscripciones verificables.

- Tablas: status_pages, component_groups, components, endpoints, status_checks, uptime_daily, incidents, incident_updates, incident_components, scheduled_maintenances, maintenance_updates, maintenance_components, subscribers, subscriber_components, notification_deliveries
- Rutas API: app/api/v1/status-pages/[slug]/route.ts, app/api/v1/status-pages/[slug]/incidents/[incidentId]/route.ts, app/api/v1/status-pages/[slug]/maintenances/[maintenanceId]/route.ts, app/api/v1/status-pages/[slug]/history/route.ts, app/api/v1/status-pages/[slug]/subscribe/route.ts, app/api/v1/subscriptions/verify/route.ts, app/api/v1/subscriptions/manage/[token]/route.ts, app/api/v1/status-pages/[slug]/rss/route.ts, app/api/internal/run-checks/route.ts, app/api/v1/status-pages/by-domain/route.ts
- Pantallas: /, /s/[slug], /s/[slug]/incidents/[incidentId], /s/[slug]/maintenances/[maintenanceId], /s/[slug]/history, /s/[slug]/subscribe, /subscribe/verify, /subscribe/manage/[token], /s/[slug]/rss
