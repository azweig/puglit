# Despliegue de Fitlytics

## Entornos
- **Desarrollo**: Configurado localmente con variables de entorno específicas.
- **Producción**: Desplegado en Fly.io para alta disponibilidad y escalabilidad.

## Migraciones
- Uso de herramientas de migración de bases de datos para aplicar cambios de esquema en PostgreSQL.

## Despliegue en Fly.io
- **Configuración**: Definida en `fly.toml`.
- **Comando de Despliegue**: `fly deploy`

## Despliegue en Vercel
- **Frontend**: Desplegado en Vercel para un rendimiento óptimo de la aplicación Next.js.

## CI/CD
- Integración continua configurada para ejecutar pruebas y despliegues automáticos en cada commit a la rama principal.

## Observabilidad
- **Monitoreo**: Integración con servicios de monitoreo para rastrear el rendimiento y la disponibilidad del sistema.
- **Alertas**: Configuración de alertas para notificar sobre cualquier problema de rendimiento o seguridad.
