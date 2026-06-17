# Arquitectura de Truke

## Visión General del Sistema
Truke es una aplicación web diseñada para facilitar el intercambio y regalo de objetos usados, similar a Tinder. Los usuarios pueden deslizar fotos de objetos, publicar los suyos y, si hay un match mutuo, pueden chatear de forma anónima sobre los ítems que hicieron match.

## Mapa de Componentes/Módulos
- **Next.js 16**: Framework para el desarrollo de la interfaz de usuario.
- **TypeScript**: Lenguaje de programación para asegurar tipos estáticos.
- **PostgreSQL vía Pooler**: Base de datos relacional para almacenar datos de usuarios, ítems, matches y chats.
- **JWT para Autenticación**: Manejo de sesiones de usuario de manera segura.
- **Stripe**: Integración para posibles transacciones futuras.
- **Resend**: Servicio para el envío de notificaciones por correo electrónico.
- **Fly.io**: Plataforma de despliegue para la aplicación.

## Stack y Justificación
- **Next.js**: Elegido por su capacidad de renderizado del lado del servidor y su facilidad de integración con React.
- **TypeScript**: Proporciona seguridad de tipos, lo que reduce errores en tiempo de ejecución.
- **PostgreSQL**: Ofrece robustez y flexibilidad para manejar datos relacionales.
- **JWT**: Permite una autenticación segura y sin estado.
- **Fly.io**: Facilita el despliegue global y la escalabilidad de la aplicación.

## Flujo de Solicitudes
1. **Autenticación**: El usuario inicia sesión y recibe un JWT.
2. **Interacción con Ítems**: El usuario desliza ítems, y las acciones se registran en la base de datos.
3. **Creación de Match**: Cuando dos usuarios muestran interés mutuo en los ítems, se crea un match.
4. **Chat**: Los usuarios pueden chatear sobre los ítems que hicieron match.
5. **Notificaciones**: Se envían notificaciones por correo electrónico usando Resend.