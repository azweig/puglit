# Arquitectura de Statura

## Visión General del Sistema
Statura es una aplicación que proporciona una página de estado pública sin necesidad de inicio de sesión. Monitorea endpoints HTTPS y muestra el estado actual, historial de tiempo de actividad e incidentes recientes. Está diseñada para ser similar a status.claude.com.

## Mapa de Componentes/Módulos
- **Next.js 16**: Framework de React para el frontend y la API.
- **TypeScript**: Lenguaje de programación para asegurar tipos estáticos.
- **PostgreSQL**: Base de datos relacional utilizada para almacenar datos de estado, incidentes y verificaciones de tiempo de actividad.
- **JWT**: Utilizado para autenticación en otras partes del sistema, aunque no se requiere para la página de estado pública.
- **Stripe**: Integración para potenciales características de pago.
- **Resend**: Servicio para el manejo de correos electrónicos.
- **Fly.io**: Plataforma de despliegue para aplicaciones.

## El Stack y Por Qué
- **Next.js**: Elegido por su capacidad de renderizado del lado del servidor y su integración con APIs.
- **TypeScript**: Proporciona seguridad de tipos, lo que reduce errores en tiempo de ejecución.
- **PostgreSQL**: Ofrece robustez y capacidades avanzadas para manejar datos relacionales.
- **Fly.io**: Permite un despliegue fácil y escalable.

## Flujo de Solicitudes
1. Un usuario realiza una solicitud GET a `/api/public/status-pages/:slug`.
2. El servidor Next.js procesa la solicitud, resolviendo el dominio personalizado si es necesario.
3. Se consulta la base de datos PostgreSQL para obtener la página de estado, endpoints, incidentes y verificaciones de tiempo de actividad.
4. La respuesta se genera y se envía de vuelta al cliente, mostrando el estado actual, incidentes recientes y el historial de tiempo de actividad.