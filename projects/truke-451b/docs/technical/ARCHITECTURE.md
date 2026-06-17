# Arquitectura de Truke

## Descripción General del Sistema
Truke es una aplicación similar a Tinder para intercambiar y regalar objetos usados. Los usuarios pueden deslizar fotos de objetos, publicar los suyos y, si hay un match mutuo, chatear de forma anónima sobre los items que hicieron match.

## Mapa de Componentes/Módulos
- **Next.js 16**: Utilizado para el frontend y backend, proporcionando SSR y API routes.
- **TypeScript**: Asegura tipado estático y reduce errores en el desarrollo.
- **PostgreSQL**: Base de datos relacional para almacenar datos de usuarios, items, matches y chats.
- **JWT (JSON Web Tokens)**: Autenticación de usuarios.
- **Stripe**: Integración para posibles futuras funcionalidades de pago.
- **Resend**: Servicio para enviar notificaciones por correo electrónico.
- **Fly.io**: Plataforma de despliegue para aplicaciones distribuidas.

## Flujo de Solicitudes
1. **Usuario inicia sesión**: Se autentica mediante JWT.
2. **Deslizar items**: Solicitudes GET para obtener items.
3. **Match**: Solicitud POST para crear un match.
4. **Chat**: Solicitudes POST para enviar mensajes y GET para obtener el historial de chat.

Cada solicitud es manejada por Next.js API routes, que interactúan con PostgreSQL a través de un pool de conexiones.