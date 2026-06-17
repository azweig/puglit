# Despliegue de Truke

## Entornos
- **Desarrollo**: Local, con base de datos PostgreSQL local.
- **Producción**: Desplegado en Fly.io con base de datos gestionada.

## Migraciones
- Utilizar herramientas de migración como `Knex.js` para gestionar cambios en el esquema de la base de datos.

## Despliegue en Fly.io
- Configurar `fly.toml` para definir la aplicación y sus servicios.
- Utilizar `flyctl` para desplegar la aplicación y gestionar el ciclo de vida.

## Despliegue en Vercel
- Configurar el proyecto para despliegue continuo desde el repositorio de GitHub.
- Definir variables de entorno necesarias para la conexión a la base de datos y servicios externos.

## CI/CD
- Integración continua configurada para ejecutar pruebas y despliegues automáticos en cada commit.

## Observabilidad
- Implementar monitoreo y logging utilizando servicios como `LogDNA` o `Datadog` para rastrear el rendimiento y errores.