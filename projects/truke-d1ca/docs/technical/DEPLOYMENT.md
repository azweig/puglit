# Despliegue de Truke

## Entornos
- **Desarrollo**: Configurado localmente con variables de entorno específicas para pruebas.
- **Producción**: Desplegado en Fly.io con configuraciones optimizadas para rendimiento y seguridad.

## Migraciones
- Las migraciones de la base de datos se gestionan mediante herramientas como `knex` o `sequelize` para mantener la integridad del esquema de datos.

## Despliegue en Fly.io
- La aplicación se empaqueta y despliega en Fly.io, aprovechando su capacidad para manejar aplicaciones distribuidas y escalables.

## CI/CD
- Se utiliza un pipeline de CI/CD para automatizar pruebas y despliegues, asegurando que solo el código probado llegue a producción.

## Observabilidad
- Se implementan herramientas de monitoreo y logging para rastrear el rendimiento y detectar problemas en tiempo real, asegurando la estabilidad de la aplicación en producción.