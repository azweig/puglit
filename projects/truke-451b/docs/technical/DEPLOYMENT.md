# Despliegue de Truke

## Entornos
- **Desarrollo**: Local, con base de datos PostgreSQL en Docker.
- **Producción**: Desplegado en Fly.io con PostgreSQL gestionado.

## Migraciones
- Uso de herramientas como `knex` para gestionar migraciones de base de datos.

## Despliegue en Fly.io
- Configuración de `fly.toml` para definir servicios y regiones.
- Uso de `fly deploy` para desplegar la aplicación.

## CI/CD
- Integración continua configurada con GitHub Actions para pruebas y despliegue automático.

## Observabilidad
- Uso de servicios como LogDNA para monitoreo de logs.
- Integración de alertas para errores críticos y métricas de rendimiento.