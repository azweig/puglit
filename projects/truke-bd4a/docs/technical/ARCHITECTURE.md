# Arquitectura de Truke

## Visión General del Sistema
Truke es una aplicación web diseñada para facilitar el intercambio y regalo de objetos usados entre usuarios, similar a Tinder. Los usuarios pueden deslizar fotos de objetos, publicar los suyos y, si hay un match mutuo, chatear de forma anónima sobre los items que hicieron match.

## Mapa de Componentes/Módulos
- **Next.js 16**: Framework de React para la construcción de la interfaz de usuario.
- **TypeScript**: Lenguaje de programación para asegurar tipos estáticos y mejorar la mantenibilidad del código.
- **PostgreSQL via pooler**: Base de datos relacional para almacenar datos de usuarios, items, matches y chats.
- **Autenticación JWT**: Sistema de autenticación basado en tokens JSON Web Tokens.
- **Stripe**: Integración para potenciales pagos o donaciones.
- **Resend**: Servicio para el envío de correos electrónicos.
- **Fly.io**: Plataforma de despliegue para aplicaciones web.

## Flujo de Solicitudes
1. **Autenticación**: El usuario inicia sesión y obtiene un JWT.
2. **Deslizamiento de Items**: El usuario ve una lista de items y puede deslizar para indicar interés.
3. **Creación de Match**: Si dos usuarios muestran interés mutuo en los items del otro, se crea un match.
4. **Chat Anónimo**: Los usuarios pueden chatear sobre los items que hicieron match.

Cada solicitud pasa por un middleware de autenticación que valida el JWT antes de permitir el acceso a las funcionalidades.