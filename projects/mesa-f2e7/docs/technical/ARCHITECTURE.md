# Arquitectura de Mesa

## Visión General del Sistema
Mesa es una aplicación web diseñada para facilitar las reservas en restaurantes. Permite a los comensales realizar reservas en línea mientras que los restaurantes pueden gestionar sus salones y turnos de manera eficiente.

## Mapa de Componentes/Módulos
- **Frontend**: Construido con Next.js 16 y TypeScript, proporciona una interfaz de usuario interactiva y dinámica.
- **Backend**: Implementado en Node.js con TypeScript, maneja la lógica de negocio y las interacciones con la base de datos.
- **Base de Datos**: PostgreSQL, accesible a través de un pooler para optimizar las conexiones.
- **Autenticación**: Utiliza JWT para la autenticación de usuarios.
- **Pagos**: Integración con Stripe para gestionar pagos.
- **Notificaciones**: Resend para el envío de correos electrónicos.
- **Infraestructura**: Desplegado en Fly.io para escalabilidad y rendimiento.

## La Pila Tecnológica y su Justificación
- **Next.js 16**: Framework React para aplicaciones web, elegido por su capacidad de renderizado del lado del servidor y generación de sitios estáticos.
- **TypeScript**: Proporciona tipado estático, mejorando la mantenibilidad y la detección de errores en tiempo de desarrollo.
- **PostgreSQL**: Base de datos relacional robusta y escalable, adecuada para las necesidades de almacenamiento de datos de Mesa.
- **JWT**: Protocolo estándar para la autenticación segura de usuarios.
- **Stripe**: Solución de pagos confiable y ampliamente adoptada.
- **Resend**: Servicio para el envío eficiente de correos electrónicos.
- **Fly.io**: Plataforma de despliegue que facilita la distribución geográfica y el escalado automático.

## Flujo de Solicitudes
1. **Solicitud de Reserva**: Un usuario envía una solicitud de reserva a través del frontend.
2. **Validación de Disponibilidad**: El backend verifica la disponibilidad del restaurante, turno y mesas.
3. **Confirmación de Reserva**: Si hay disponibilidad, se crea una reserva y se notifica al usuario.
4. **Gestión de Pagos**: Si es necesario, se procesa un pago a través de Stripe.
5. **Notificación**: Se envía un correo de confirmación al usuario mediante Resend.

Este flujo asegura que las reservas se gestionen de manera eficiente y que los usuarios reciban confirmaciones rápidas.