# Arquitectura de Truke

## Descripción General del Sistema
Truke es una aplicación web que permite a los usuarios intercambiar objetos usados de manera similar a Tinder. Los usuarios pueden ver fotos de objetos, publicar los suyos y, si hay un "match", pueden chatear de forma anónima sobre ese ítem.

## Mapa de Componentes/Módulos
- **Engine**: Maneja la lógica principal de la aplicación, incluyendo la gestión de items y el proceso de matching.
- **Profiling**: Gestiona la información del usuario, incluyendo el registro, autenticación y perfiles.
- **Gamification**: Añade elementos de juego para mejorar la interacción del usuario.

## La Pila Tecnológica
- **Next.js 16**: Framework de React para aplicaciones web, elegido por su capacidad de renderizado del lado del servidor y su facilidad de uso con TypeScript.
- **TypeScript**: Proporciona tipado estático, lo que mejora la mantenibilidad y la detección de errores.
- **PostgreSQL via Pooler**: Base de datos relacional utilizada para almacenar datos de usuarios, items, matches y chats.
- **JWT para Autenticación**: Proporciona un método seguro para autenticar usuarios.
- **Stripe**: Integrado para futuras funcionalidades de pago.
- **Resend**: Servicio para manejar notificaciones por correo electrónico.
- **Fly.io**: Plataforma de despliegue que permite escalar la aplicación fácilmente.

## Flujo de Solicitudes
1. **Inicio de Sesión del Usuario**: El usuario inicia sesión, se genera un JWT y se almacena en el cliente.
2. **Navegación de Items**: El cliente solicita items disponibles al servidor, que responde con datos de items.
3. **Creación de Match**: Cuando un usuario intenta hacer match con un item, se envía una solicitud POST al servidor. Si el item está disponible y no pertenece al usuario, se crea un match.
4. **Chat**: Una vez que se crea un match, los usuarios pueden intercambiar mensajes a través del servicio de chat, que se gestiona mediante WebSockets para comunicación en tiempo real.