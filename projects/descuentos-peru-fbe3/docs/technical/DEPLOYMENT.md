# Despliegue

## Entornos
- **Desarrollo**: Local con Docker para replicar el entorno de producción.
- **Producción**: Desplegado en Fly.io para el backend y Vercel para el frontend.

## Migraciones
- Gestionadas con herramientas como `knex` o `sequelize` para PostgreSQL.

## Despliegue en Fly.io y Vercel
- **Fly.io**: Utilizado para el backend debido a su capacidad para manejar aplicaciones Node.js y PostgreSQL.
- **Vercel**: Ideal para el frontend con Next.js, proporcionando despliegues rápidos y escalables.

## CI/CD
- Integración continua configurada con GitHub Actions para pruebas automáticas y despliegues.

## Observabilidad
- Monitoreo con herramientas como Prometheus y Grafana para el backend.
- Logs y métricas de rendimiento para el frontend a través de Vercel.