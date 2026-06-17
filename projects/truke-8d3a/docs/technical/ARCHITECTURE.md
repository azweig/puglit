# Arquitectura de Truke

## Visión General del Sistema
Truke es una aplicación tipo Tinder diseñada para el intercambio y regalo de objetos usados. Los usuarios pueden deslizar fotos de objetos, publicar los suyos y, si hay un match mutuo, chatear de forma anónima sobre los items que hicieron match.

## Mapa de Componentes/Módulos
- **Next.js 16**: Framework de React para la construcción de la interfaz de usuario.
- **TypeScript**: Lenguaje de programación que añade tipado estático a JavaScript.
- **PostgreSQL via Pooler**: Base de datos relacional para almacenar datos de usuarios, items, matches y chats.
- **Auth JWT**: Autenticación basada en tokens JWT para asegurar las solicitudes de API.
- **Stripe**: Integración para manejar pagos (si aplica en futuras versiones).
- **Resend**: Servicio para enviar correos electrónicos (por ejemplo, notificaciones de match).
- **Fly.io**: Plataforma de despliegue para aplicaciones backend.

## Flujo de Solicitudes
1. **Cliente**: El usuario interactúa con la aplicación a través de la interfaz de usuario de Next.js.
2. **Servidor**: Las solicitudes del cliente se envían al backend donde se procesan usando Node.js.
3. **Base de Datos**: Las operaciones CRUD se realizan en PostgreSQL a través de conexiones gestionadas por Pooler.
4. **Autenticación**: Las solicitudes se autentican usando JWT para asegurar que solo los usuarios autorizados puedan acceder a ciertas funcionalidades.
5. **Respuestas**: El servidor responde al cliente con los datos solicitados o mensajes de error según corresponda.

## Elección de la Pila
- **Next.js**: Elegido por su capacidad para renderizado del lado del servidor y su integración con React.
- **TypeScript**: Mejora la calidad del código y reduce errores en tiempo de ejecución.
- **PostgreSQL**: Ofrece robustez y escalabilidad para manejar datos estructurados.
- **JWT**: Proporciona un método seguro y estándar para manejar la autenticación.
- **Fly.io**: Permite despliegues rápidos y escalables de la aplicación backend.