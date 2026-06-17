# Despliegue de Truke

## Entornos
- **Desarrollo**: Local con base de datos PostgreSQL.
- **Producción**: Desplegado en Fly.io con base de datos PostgreSQL gestionada.

## Migraciones
- Utilizar herramientas de migración como `knex` para aplicar cambios en el esquema de la base de datos.

## Despliegue en Fly.io
- Configurar `fly.toml` para definir la aplicación y el entorno.
- Utilizar `flyctl` para desplegar la aplicación.

## CI/CD
- Integración continua configurada con GitHub Actions para pruebas automáticas y despliegues.

## Observabilidad
- Uso de herramientas como LogDNA o Grafana para monitorear logs y métricas de la aplicación.
