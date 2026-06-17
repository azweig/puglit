# Arquitectura de Truke

## Descripción General del Sistema
Truke es una aplicación web diseñada para facilitar el intercambio y regalo de objetos usados entre usuarios. Similar a aplicaciones de citas, los usuarios pueden deslizar fotos de objetos, publicar los suyos, y si hay un interés mutuo, pueden chatear de forma anónima sobre los objetos que hicieron match.

## Mapa de Componentes/Módulos
- **Next.js 16**: Framework de React para el frontend.
- **TypeScript**: Lenguaje de programación utilizado para tipado estático.
- **PostgreSQL**: Base de datos relacional utilizada para almacenar datos de usuarios, items, matches y chats.
- **JWT (JSON Web Tokens)**: Utilizado para autenticación de usuarios.
- **Stripe**: Integración para posibles transacciones futuras.
- **Resend**: Servicio para el manejo de correos electrónicos.
- **Fly.io**: Plataforma de despliegue para aplicaciones.
- **Geo Module**: Módulo para manejar funcionalidades geográficas.

## Flujo de Solicitudes
1. **Autenticación**: El usuario inicia sesión y recibe un JWT.
2. **Navegación de Items**: El usuario navega por los items disponibles.
3. **Creación de Match**: Si el usuario está interesado en un item, puede intentar hacer match.
4. **Chat**: Si hay un match mutuo, se habilita un chat anónimo entre los usuarios.

Las solicitudes fluyen desde el cliente a través de la API de Next.js, interactuando con la base de datos PostgreSQL para operaciones CRUD, y utilizando JWT para la autenticación y autorización.