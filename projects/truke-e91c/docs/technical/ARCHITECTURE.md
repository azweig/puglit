# Arquitectura de Truke

## Descripción General del Sistema
Truke es una aplicación similar a Tinder, diseñada para el intercambio y donación de objetos usados. Los usuarios pueden deslizar fotos de objetos, publicar los suyos, y si hay un match mutuo, pueden chatear de forma anónima sobre los artículos que hicieron match.

## Mapa de Componentes/Módulos
- **Next.js 16**: Framework de React para el frontend, que permite una renderización del lado del servidor y generación de sitios estáticos.
- **TypeScript**: Lenguaje de programación que añade tipado estático a JavaScript, mejorando la mantenibilidad del código.
- **PostgreSQL via Pooler**: Base de datos relacional utilizada para almacenar datos de usuarios, items, matches y chats.
- **Auth JWT**: Autenticación basada en JSON Web Tokens para asegurar las interacciones de los usuarios.
- **Stripe**: Integrado para posibles futuras funcionalidades de pago.
- **Resend**: Servicio para el envío de correos electrónicos.
- **Fly.io**: Plataforma de despliegue para aplicaciones distribuidas.

## Flujo de Solicitudes
1. **Autenticación**: Los usuarios inician sesión mediante JWT, asegurando que solo usuarios autenticados puedan interactuar con la aplicación.
2. **Deslizamiento de Items**: Los usuarios pueden deslizar para ver diferentes items. Las solicitudes se manejan mediante llamadas a la API que devuelven listas de items.
3. **Match y Chat**: Cuando dos usuarios muestran interés mutuo en un item, se crea un match. Esto permite iniciar un chat anónimo sobre el item.

El flujo de datos sigue el siguiente patrón: Cliente (Next.js) → Servidor (Node.js con Express) → Base de Datos (PostgreSQL).