# Arquitectura de Truke

## Visión General del Sistema
Truke es una aplicación tipo Tinder para intercambiar y regalar cosas usadas. Los usuarios pueden deslizar fotos de objetos, publicar los suyos, y si hay un match mutuo, pueden chatear de forma anónima solo sobre los ítems que hicieron match.

## Mapa de Componentes/Módulos
- **Next.js 16**: Framework para el frontend y backend, permitiendo renderizado del lado del servidor y generación de API endpoints.
- **TypeScript**: Lenguaje de programación tipado que mejora la mantenibilidad del código.
- **PostgreSQL**: Base de datos relacional utilizada para almacenar datos de usuarios, ítems, matches y chats.
- **Pooler**: Manejador de conexiones para optimizar el acceso a la base de datos.
- **JWT (JSON Web Tokens)**: Utilizado para la autenticación de usuarios.
- **Stripe**: Integrado para potenciales funcionalidades de pago o donaciones.
- **Resend**: Servicio para el envío de correos electrónicos.
- **Fly.io**: Plataforma de despliegue para aplicaciones distribuidas.

## Stack y Razones
- **Next.js**: Elegido por su capacidad para manejar tanto el frontend como el backend en una sola aplicación, facilitando la implementación de SSR y API.
- **TypeScript**: Proporciona seguridad de tipos, lo que reduce errores en tiempo de ejecución y mejora la calidad del código.
- **PostgreSQL**: Ofrece robustez y características avanzadas para manejar relaciones complejas entre entidades.
- **JWT**: Permite una autenticación segura y sin estado.

## Flujo de Solicitudes
1. **Autenticación**: El usuario se autentica mediante JWT al iniciar sesión.
2. **Deslizamiento de Ítems**: El frontend solicita ítems desde el backend, que se recuperan de PostgreSQL.
3. **Creación de Match**: Cuando un usuario desliza un ítem, se verifica si hay un match mutuo y se crea un registro en la tabla `Match`.
4. **Chat**: Si hay un match, se habilita un canal de chat anónimo entre los usuarios.
5. **Notificaciones**: Se envían correos electrónicos a través de Resend para notificar a los usuarios sobre nuevos matches o mensajes.