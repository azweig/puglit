# Despliegue de Truke

## Entornos
- **Desarrollo**: Local, con base de datos PostgreSQL en Docker.
- **Producción**: Desplegado en Fly.io, con base de datos PostgreSQL gestionada.

## Migraciones
- Uso de herramientas como `Prisma` para gestionar migraciones de base de datos.

## Despliegue en Fly.io
- Configuración de `fly.toml` para definir la aplicación y servicios.
- Uso de `flyctl` para desplegar la aplicación.

## Despliegue en Vercel
- Configuración de `vercel.json` para despliegue de frontend.

## Integración Continua
- Configuración de GitHub Actions para pruebas automáticas y despliegue continuo.

## Observabilidad
- Integración con servicios de monitoreo como `Sentry` para rastreo de errores.
- Uso de `LogDNA` para el análisis de logs en tiempo real.