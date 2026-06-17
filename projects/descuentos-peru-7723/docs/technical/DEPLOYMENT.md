# Despliegue de Descuentos Perú

## Entornos
- **Desarrollo**: Local con Next.js y PostgreSQL en contenedores Docker.
- **Producción**: Desplegado en Fly.io para alta disponibilidad y escalabilidad.

## Migraciones
- Uso de herramientas de migración como `knex` para gestionar cambios en el esquema de la base de datos.

## Despliegue en Fly.io
- Configuración de `fly.toml` para definir la aplicación y sus servicios.
- Uso de `flyctl` para desplegar y gestionar la aplicación.

## CI/CD
- Integración continua configurada con GitHub Actions para pruebas y despliegues automáticos.

## Observabilidad
- Monitoreo mediante servicios como Sentry para errores y LogDNA para logs de aplicación.
