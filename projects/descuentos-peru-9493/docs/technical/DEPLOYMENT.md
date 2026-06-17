# Despliegue de Descuentos Perú

## Entornos
- **Desarrollo**: Local, con base de datos PostgreSQL en Docker.
- **Producción**: Fly.io para el backend, Vercel para el frontend.

## Migraciones
- Uso de herramientas como `knex` para gestionar migraciones de base de datos.

## Despliegue en Fly.io
- Configuración de `fly.toml` para definir la aplicación y sus servicios.
- Despliegue continuo configurado con GitHub Actions para automatizar el despliegue tras cada commit en la rama principal.

## Despliegue en Vercel
- Integración directa con el repositorio de GitHub para despliegue automático del frontend.

## CI/CD
- Uso de GitHub Actions para pruebas automatizadas y despliegue continuo.

## Observabilidad
- Integración con servicios de monitoreo como LogDNA para seguimiento de logs y errores.
- Alertas configuradas para notificar sobre fallos críticos en el sistema.
