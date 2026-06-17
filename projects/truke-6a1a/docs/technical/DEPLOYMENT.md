# Despliegue de Truke

## Entornos
- **Desarrollo**: Local, con base de datos PostgreSQL en contenedor Docker.
- **Producción**: Desplegado en Fly.io, base de datos gestionada externamente.

## Migraciones
- Uso de herramientas de migración como `Prisma` para gestionar cambios en el esquema de la base de datos.

## Despliegue en Fly.io
- Configuración de `fly.toml` para definir la aplicación y servicios.
- Despliegue continuo mediante GitHub Actions para CI/CD.

## Observabilidad
- Integración de servicios como `LogDNA` o `Datadog` para monitoreo de logs y métricas.
- Alertas configuradas para errores críticos y umbrales de rendimiento.

## Variables de Entorno
- Configuración de variables sensibles como claves de API y secretos de base de datos en el entorno de Fly.io.

## Estrategia de Despliegue
- Despliegue rolling para minimizar el tiempo de inactividad.
- Pruebas automatizadas ejecutadas antes de cada despliegue para asegurar la estabilidad del sistema.