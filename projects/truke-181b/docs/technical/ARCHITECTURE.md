# Arquitectura de Truke

## Descripción General del Sistema
Truke es una aplicación tipo Tinder para el intercambio y regalo de objetos usados. Los usuarios pueden deslizar fotos de objetos, publicar los suyos, y si hay un match mutuo, pueden chatear de forma anónima sobre los items que hicieron match.

## Mapa de Componentes/Módulos
- **Next.js 16**: Framework de React para el frontend, que permite el renderizado del lado del servidor y la generación de sitios estáticos.
- **TypeScript**: Usado para asegurar tipado estático y mejorar la calidad del código.
- **PostgreSQL via Pooler**: Base de datos relacional utilizada para almacenar datos de usuarios, items, matches y chats.
- **JWT para Autenticación**: Se utiliza JSON Web Tokens para la autenticación de usuarios.
- **Stripe**: Integrado para manejar pagos, aunque no es el foco principal de la aplicación.
- **Resend**: Servicio para el envío de correos electrónicos.
- **Fly.io**: Plataforma de despliegue para aplicaciones distribuidas.

## Flujo de Solicitudes
1. **Autenticación**: El usuario inicia sesión y recibe un JWT.
2. **Deslizamiento de Items**: El frontend solicita items desde el backend.
3. **Creación de Match**: Cuando un usuario desliza un item y hay interés mutuo, se crea un match.
4. **Chat**: Los usuarios pueden chatear sobre los items que hicieron match.

El flujo de datos se maneja principalmente a través de solicitudes HTTP al backend, que interactúa con la base de datos PostgreSQL para persistir y recuperar información.