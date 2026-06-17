# Arquitectura de Truke

## Descripción General del Sistema
Truke es una aplicación que permite a los usuarios intercambiar y regalar objetos usados de manera similar a Tinder. Los usuarios pueden deslizar fotos de objetos, publicar los suyos y, si hay un match mutuo, chatear de forma anónima sobre los ítems que hicieron match.

## Mapa de Componentes/Módulos
- **Next.js 16**: Utilizado para el frontend y el servidor de la aplicación, permitiendo una experiencia de usuario dinámica y reactiva.
- **TypeScript**: Proporciona tipado estático para mejorar la calidad del código y reducir errores.
- **PostgreSQL via Pooler**: Base de datos relacional para almacenar datos de usuarios, ítems, matches y chats.
- **Auth JWT**: Manejo de autenticación segura mediante tokens JWT.
- **Stripe**: Integración para posibles transacciones futuras.
- **Resend**: Servicio de reenvío de correos electrónicos para notificaciones.
- **Fly.io**: Plataforma de despliegue para aplicaciones distribuidas.

## Por qué esta Pila
- **Next.js**: Ofrece SSR y SSG, mejorando el rendimiento y SEO.
- **TypeScript**: Mejora la mantenibilidad del código.
- **PostgreSQL**: Ofrece robustez y escalabilidad para manejar datos relacionales.
- **JWT**: Proporciona un método seguro y estándar para la autenticación.
- **Fly.io**: Facilita el despliegue global y la escalabilidad.

## Flujo de Solicitudes
1. **Inicio de Sesión**: El usuario inicia sesión y recibe un JWT.
2. **Deslizar Ítems**: El cliente solicita ítems desde el servidor.
3. **Crear Match**: Cuando dos usuarios deslizan a la derecha sobre los ítems del otro, se crea un match.
4. **Iniciar Chat**: Los usuarios pueden chatear sobre los ítems que hicieron match.
5. **Notificaciones**: Se envían notificaciones por correo usando Resend.
