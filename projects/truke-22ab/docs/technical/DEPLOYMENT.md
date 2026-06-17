# Despliegue de Truke

## Entornos
- **Desarrollo**: Usado para pruebas locales y desarrollo de nuevas funcionalidades.
- **Producción**: Entorno en vivo accesible por los usuarios finales.

## Migraciones
Las migraciones de base de datos se manejan utilizando herramientas como `Knex.js` o `Prisma` para asegurar que los cambios en el esquema de datos se apliquen de manera consistente en todos los entornos.

## Despliegue en Fly.io
- **Backend**: Desplegado en Fly.io, aprovechando su capacidad para manejar aplicaciones de backend escalables.
- **Configuración**: Uso de archivos `fly.toml` para definir configuraciones de despliegue.

## Despliegue en Vercel
- **Frontend**: Desplegado en Vercel, aprovechando su integración con Git para despliegues continuos.
- **Configuración**: Configuración a través de la interfaz de Vercel, permitiendo ajustes rápidos y fáciles.

## CI/CD
Integración continua configurada para ejecutar pruebas y desplegar automáticamente al aprobar cambios en el repositorio principal.

## Observabilidad
- **Logs**: Uso de servicios como `Loggly` o `Datadog` para el monitoreo de logs.
- **Monitoreo**: Integración con herramientas de monitoreo para rastrear el rendimiento y la disponibilidad del sistema.