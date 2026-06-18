# Despliegue

## Entornos

- **Desarrollo**: Utiliza una base de datos local y un entorno de desarrollo de Next.js.
- **Producción**: Desplegado en Fly.io para alta disponibilidad y escalabilidad.

## Migraciones

- Utilizar herramientas como `knex` para manejar migraciones de base de datos.
- Asegurarse de que todas las migraciones se ejecuten antes de desplegar nuevas versiones de la aplicación.

## Despliegue en Fly.io

- Configurar `fly.toml` para definir las variables de entorno y configuraciones específicas de Fly.io.
- Utilizar `fly deploy` para desplegar la aplicación.

## CI/CD

- Integrar con GitHub Actions para automatizar pruebas y despliegues.
- Definir flujos de trabajo para ejecutar pruebas en cada `push` y desplegar en `main`.

## Observabilidad

- Utilizar servicios como LogDNA o Sentry para monitorear logs y errores.
- Configurar alertas para notificar sobre errores críticos o caídas de servicio.