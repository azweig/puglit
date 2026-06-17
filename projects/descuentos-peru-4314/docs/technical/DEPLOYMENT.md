# Despliegue de Descuentos Perú

## Entornos
- **Desarrollo**: Local, con base de datos PostgreSQL en contenedor Docker.
- **Producción**: Desplegado en Fly.io, con base de datos PostgreSQL gestionada.

## Migraciones
- Uso de herramientas como `Prisma` o `Knex` para manejar migraciones de base de datos.

## Despliegue en Fly.io
- Configuración de la aplicación para desplegarse en múltiples regiones para mejorar la latencia.
- Uso de `flyctl` para gestionar despliegues y configuraciones.

## Despliegue en Vercel
- Aunque Fly.io es el principal entorno de producción, Vercel puede ser utilizado para despliegues de frontend si es necesario.

## Integración Continua (CI)
- Configuración de CI con GitHub Actions para pruebas automáticas y despliegues continuos.

## Observabilidad
- Integración con servicios como `Sentry` para monitoreo de errores y `Prometheus` para métricas de rendimiento.
- Logs centralizados para facilitar el diagnóstico y resolución de problemas.