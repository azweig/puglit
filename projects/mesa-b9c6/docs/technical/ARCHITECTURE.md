# Arquitectura de Mesa

## Descripción General del Sistema
Mesa es una aplicación web diseñada para facilitar las reservas en restaurantes. Los comensales pueden realizar reservas en línea, mientras que los restaurantes pueden gestionar sus salones y turnos.

## Mapa de Componentes/Módulos
- **Next.js 16**: Framework utilizado para el frontend y backend.
- **TypeScript**: Lenguaje de programación para asegurar tipos estáticos.
- **PostgreSQL**: Base de datos utilizada, accedida a través de un pooler para optimizar conexiones.
- **JWT (JSON Web Tokens)**: Utilizado para la autenticación.
- **Stripe**: Integración para pagos.
- **Resend**: Servicio para gestionar el ciclo de vida de los correos electrónicos.
- **Fly.io**: Plataforma de despliegue.

## La Pila y Por Qué
- **Next.js**: Proporciona un entorno de desarrollo rápido y eficiente para aplicaciones web con soporte para renderizado del lado del servidor.
- **TypeScript**: Mejora la calidad del código mediante la detección de errores en tiempo de compilación.
- **PostgreSQL**: Ofrece robustez y escalabilidad para manejar datos relacionales.
- **JWT**: Permite una autenticación segura y sin estado.
- **Stripe**: Facilita la gestión de pagos de manera segura.
- **Resend**: Simplifica el envío y gestión de correos electrónicos.
- **Fly.io**: Permite despliegues globales y escalables.

## Flujo de Solicitudes
1. **Reserva de Comensal**: Un usuario realiza una solicitud POST para crear una reserva.
2. **Verificación de Disponibilidad**: El sistema verifica la disponibilidad de mesas y turnos.
3. **Asignación de Mesa**: Si hay disponibilidad, se asigna una mesa.
4. **Confirmación de Reserva**: Se confirma la reserva y se notifica al usuario.
5. **Gestión de Turnos**: Los restaurantes pueden gestionar los turnos y las mesas desde el backend.