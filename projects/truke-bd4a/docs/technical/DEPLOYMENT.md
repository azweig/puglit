# Despliegue de Truke

## Entornos
- **Desarrollo**: Local, con base de datos PostgreSQL en Docker.
- **Producción**: Desplegado en Fly.io con base de datos gestionada.

## Migraciones
- Uso de herramientas como `knex` para gestionar migraciones de base de datos.

## Despliegue en Fly/Vercel
- **Fly.io**: Para la aplicación backend y base de datos.
- **Vercel**: Para la aplicación frontend en Next.js.

## Integración Continua (CI)
- Configuración de pipelines de CI para pruebas automáticas y despliegue continuo.

## Observabilidad
- Uso de herramientas como `Sentry` para monitorear errores y `Prometheus` para métricas de rendimiento.