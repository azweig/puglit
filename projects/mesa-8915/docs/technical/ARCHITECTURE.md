# Arquitectura de Mesa

Mesa es una aplicación web que permite a los comensales realizar reservas en línea en restaurantes, mientras que los restaurantes pueden gestionar sus salones y turnos. La aplicación está construida sobre la pila Puglit/TodoAstros, que incluye Next.js 16, TypeScript, PostgreSQL con pooler, autenticación JWT, Stripe, Resend y Fly.io.

## Mapa de Componentes/Módulos

- **Frontend**: Construido con Next.js 16 y TypeScript, proporciona la interfaz de usuario para comensales y restaurantes.
- **Backend**: Implementado en Node.js con TypeScript, maneja la lógica de negocio y las interacciones con la base de datos PostgreSQL.
- **Base de Datos**: PostgreSQL se utiliza para almacenar datos de restaurantes, mesas, turnos y reservas.
- **Autenticación**: JWT se utiliza para autenticar a los usuarios.
- **Pagos**: Stripe se integra para manejar pagos seguros.
- **Notificaciones**: Resend se utiliza para enviar correos electrónicos de confirmación y notificaciones.
- **Despliegue**: Fly.io se utiliza para el despliegue y la gestión de la infraestructura.

## Pila Tecnológica y Razones

- **Next.js 16**: Ofrece un rendimiento excelente y capacidades de renderizado del lado del servidor (SSR), lo que mejora la experiencia del usuario.
- **TypeScript**: Proporciona tipado estático que ayuda a detectar errores en tiempo de desarrollo.
- **PostgreSQL**: Elegido por su robustez y capacidad para manejar transacciones complejas y consultas SQL.
- **JWT**: Permite una autenticación segura y sin estado.
- **Stripe**: Facilita la integración de pagos seguros y confiables.
- **Resend**: Simplifica el envío de correos electrónicos transaccionales.
- **Fly.io**: Ofrece un entorno de despliegue escalable y de alta disponibilidad.

## Flujo de Solicitudes

1. **Reserva de Comensal**: Un comensal accede a la interfaz de usuario y selecciona un restaurante y un turno disponible.
2. **Validación de Disponibilidad**: El backend valida la disponibilidad del turno y la capacidad de las mesas.
3. **Creación de Reserva**: Si hay disponibilidad, se crea una reserva en la base de datos.
4. **Confirmación de Reserva**: Se envía un correo electrónico de confirmación al comensal utilizando Resend.
5. **Gestión de Turnos**: Los restaurantes pueden gestionar sus turnos y disponibilidad a través de la interfaz de usuario.

Este flujo asegura que las reservas se manejen de manera eficiente y que los comensales reciban confirmaciones rápidas.