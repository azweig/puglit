# Arquitectura de Truke

## Visión General del Sistema
Truke es una aplicación web que permite a los usuarios intercambiar y regalar objetos usados de manera similar a Tinder. Los usuarios pueden deslizar fotos de objetos, publicar los suyos y, si hay un interés mutuo, pueden chatear de forma anónima sobre los ítems que hicieron match.

## Mapa de Componentes/Módulos
- **Next.js 16**: Framework de React para la construcción de la interfaz de usuario.
- **TypeScript**: Lenguaje de programación utilizado para garantizar la tipificación estática.
- **PostgreSQL via Pooler**: Base de datos relacional utilizada para almacenar datos de usuarios, ítems, matches y chats.
- **JWT para Autenticación**: JSON Web Tokens se utilizan para autenticar a los usuarios.
- **Stripe**: Integrado para posibles transacciones futuras y donaciones.
- **Resend**: Servicio utilizado para enviar notificaciones por correo electrónico.
- **Fly.io**: Plataforma de despliegue para la aplicación.

## Flujo de Solicitudes
1. **Autenticación**: Los usuarios inician sesión y obtienen un JWT.
2. **Deslizar Ítems**: Los usuarios ven ítems y pueden deslizar para mostrar interés.
3. **Crear Match**: Si dos usuarios muestran interés mutuo, se crea un match.
4. **Chat**: Los usuarios pueden chatear sobre los ítems que hicieron match.

Las solicitudes fluyen desde el cliente (Next.js) al servidor, donde se procesan y se interactúa con la base de datos PostgreSQL para almacenar o recuperar información.