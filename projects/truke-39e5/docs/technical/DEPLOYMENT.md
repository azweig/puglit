# Despliegue de Truke

## Entornos
- **Desarrollo**: Configurado localmente con variables de entorno específicas para pruebas.
- **Producción**: Desplegado en Fly.io para el backend y Vercel para el frontend.

## Migraciones
- Uso de herramientas de migración de base de datos para aplicar cambios de esquema de manera controlada.

## Despliegue en Fly.io y Vercel
- **Fly.io**: Utilizado para desplegar el backend, aprovechando su capacidad para manejar aplicaciones escalables y distribuidas.
- **Vercel**: Utilizado para el frontend, beneficiándose de su integración con Next.js para despliegues rápidos y eficientes.

## Integración Continua (CI)
- Configuración de pipelines de CI para asegurar que los cambios en el código sean testeados y validados automáticamente antes del despliegue.

## Observabilidad
- Implementación de herramientas de monitoreo y logging para asegurar la disponibilidad y el rendimiento del sistema en producción.