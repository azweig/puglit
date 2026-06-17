# Despliegue

## Entornos
- **Desarrollo**: Configurado localmente para pruebas y desarrollo.
- **Producción**: Desplegado en Fly.io para alta disponibilidad y escalabilidad.

## Migraciones
Las migraciones de la base de datos se gestionan utilizando herramientas de migración de PostgreSQL para asegurar que los cambios en el esquema se apliquen correctamente en todos los entornos.

## Despliegue en Fly.io
1. Configurar el entorno de Fly.io con las variables de entorno necesarias.
2. Utilizar el CLI de Fly.io para desplegar la aplicación.
3. Verificar el estado del despliegue y realizar pruebas de verificación.

## CI/CD
- **Integración Continua**: Configurada para ejecutar pruebas automatizadas en cada commit.
- **Despliegue Continuo**: Despliegue automático a producción tras la aprobación de los cambios.

## Observabilidad
- **Logs**: Configurados para capturar y almacenar logs de aplicación y de errores.
- **Monitoreo**: Integración con herramientas de monitoreo para rastrear el rendimiento y la disponibilidad del sistema.