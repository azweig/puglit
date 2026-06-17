# Despliegue de Descuentos Perú

## Entornos

- **Desarrollo**: Local, con base de datos PostgreSQL en Docker.
- **Producción**: Desplegado en Fly.io, con base de datos PostgreSQL gestionada.

## Migraciones

- Las migraciones de la base de datos se gestionan utilizando herramientas como `knex` o `sequelize` para asegurar que los cambios en el esquema se apliquen de manera controlada.

## Despliegue en Fly.io

1. **Configuración Inicial**: Crear una aplicación en Fly.io y configurar variables de entorno necesarias.
2. **Construcción y Despliegue**: Utilizar `fly deploy` para construir y desplegar la aplicación.
3. **Verificación**: Asegurarse de que la aplicación esté corriendo correctamente después del despliegue.

## Integración Continua (CI)

- Utilizar GitHub Actions para ejecutar pruebas y despliegues automáticos en cada push al repositorio principal.

## Observabilidad

- **Logs**: Configurar logging centralizado para monitorear la aplicación.
- **Monitoreo**: Utilizar herramientas como Prometheus y Grafana para monitorear el rendimiento y la salud de la aplicación.
