# Arquitectura de Fitlytics

## Visión General del Sistema
Fitlytics es una plataforma SaaS diseñada para proporcionar analítica avanzada a gimnasios. Permite a los administradores de gimnasios analizar la retención de socios, predecir bajas y generar reportes detallados.

## Mapa de Componentes/Módulos
- **Next.js 16**: Framework de React para el frontend, utilizado por su capacidad de renderizado del lado del servidor y generación de páginas estáticas.
- **TypeScript**: Se utiliza para proporcionar tipado estático, mejorando la mantenibilidad y robustez del código.
- **PostgreSQL**: Base de datos relacional utilizada para almacenar datos de miembros, predicciones y reportes. Se accede a través de un pooler para optimizar el rendimiento.
- **JWT para Autenticación**: Se utiliza para autenticar usuarios de manera segura.
- **Stripe**: Integrado para gestionar pagos y suscripciones.
- **Resend**: Servicio para el envío de correos electrónicos transaccionales.
- **Fly.io**: Plataforma de despliegue que permite escalar la aplicación globalmente.

## Flujo de Solicitudes
1. **Autenticación**: Los usuarios inician sesión y reciben un token JWT.
2. **Consultas de Datos**: Las solicitudes de datos (por ejemplo, predicciones de miembros) se envían al backend, donde se autentican y autorizan antes de acceder a la base de datos.
3. **Procesamiento de AI**: El módulo `aiLayer` procesa datos para generar predicciones.
4. **Generación de Reportes**: Los reportes se generan y almacenan, disponibles para su descarga o visualización.
5. **Gestión de Pagos**: Las transacciones se gestionan a través de Stripe, asegurando la suscripción activa de los usuarios.
