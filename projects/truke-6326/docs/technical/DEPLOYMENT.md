# Despliegue de Truke

## Entornos
- **Desarrollo**: Local con Docker y herramientas de desarrollo.
- **Producción**: Fly.io para backend y Vercel para frontend.

## Migraciones
- Utilizar herramientas de migración como `Prisma` o `Knex` para gestionar cambios en la base de datos.

## Despliegue en Fly/Vercel
- **Fly.io**: Configurar `fly.toml` para desplegar el backend.
- **Vercel**: Desplegar el frontend con configuración automática de Vercel.

## CI/CD
- Configurar pipelines de CI/CD para pruebas automáticas y despliegue continuo utilizando GitHub Actions.

## Observabilidad
- Implementar monitoreo y logging con herramientas como `Sentry` para errores y `Prometheus` para métricas de rendimiento.