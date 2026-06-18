# Despliegue de Mesa

## Entornos

- **Desarrollo**: Utilizado para pruebas y desarrollo de nuevas funcionalidades.
- **Producción**: Entorno en vivo donde los usuarios interactúan con la aplicación.

## Migraciones

- **Herramienta de Migración**: Utilizamos herramientas como `knex` para gestionar migraciones de base de datos.
- **Estrategia**: Las migraciones se aplican automáticamente durante el despliegue para asegurar la consistencia de la base de datos.

## Despliegue en Fly.io

- **Configuración**: Fly.io se utiliza para desplegar tanto el frontend como el backend.
- **Pipeline CI/CD**: Integración continua configurada para ejecutar pruebas y desplegar automáticamente en Fly.io después de cada commit en la rama principal.

## Observabilidad

- **Monitoreo**: Uso de herramientas como Prometheus y Grafana para monitorear el rendimiento y la salud del sistema.
- **Logging**: Logs centralizados con herramientas como ELK Stack para facilitar el diagnóstico de problemas.

Estas prácticas aseguran que el despliegue de Mesa sea eficiente y que el sistema sea monitoreado adecuadamente para detectar y resolver problemas rápidamente.