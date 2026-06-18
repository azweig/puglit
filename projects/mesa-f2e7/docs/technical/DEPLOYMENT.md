# Despliegue de Mesa

## Entornos
- **Desarrollo**: Configurado localmente con variables de entorno específicas.
- **Producción**: Desplegado en Fly.io, con gestión de secretos y configuración de entorno.

## Migraciones
- Gestionadas mediante herramientas de migración de bases de datos para PostgreSQL.

## Despliegue en Fly.io
- **Configuración**: Definida en el archivo `fly.toml`.
- **Comando de Despliegue**: `fly deploy` para actualizar la aplicación.

## Despliegue en Vercel
- Utilizado para el frontend, con integración continua para despliegues automáticos.

## Integración Continua (CI)
- Configurada para ejecutar pruebas y despliegues automáticos en cada commit a la rama principal.

## Observabilidad
- **Logs**: Centralizados y accesibles a través de Fly.io.
- **Monitoreo**: Integración con herramientas de monitoreo para alertas y métricas de rendimiento.