# Despliegue de Notely

## Entornos
- **Desarrollo**: Local, con base de datos PostgreSQL en contenedor.
- **Producción**: Desplegado en Fly.io, con base de datos gestionada.

## Migraciones
- Utilizar herramientas de migración como `knex` para gestionar cambios en el esquema de la base de datos.

## Despliegue en Fly.io
- Configurar `fly.toml` para definir la aplicación y servicios asociados.
- Comando de despliegue: `fly deploy`

## Despliegue en Vercel
- Utilizado para el frontend si se separa del backend.
- Integración continua configurada para despliegues automáticos.

## CI/CD
- Integración continua configurada para ejecutar pruebas y despliegues automáticos.

## Observabilidad
- Implementar monitoreo y logging para asegurar el rendimiento y la detección de errores.
