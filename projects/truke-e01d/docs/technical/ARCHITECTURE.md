# Arquitectura de Truke

## Descripción General del Sistema
Truke es una aplicación similar a Tinder para el intercambio y regalo de objetos usados. Los usuarios pueden deslizar fotos de objetos, publicar los suyos y, si hay un match mutuo, chatear de forma anónima solo sobre los ítems que hicieron match.

## Mapa de Componentes/Módulos
- **Next.js 16**: Framework para la construcción de la interfaz de usuario.
- **TypeScript**: Lenguaje de programación utilizado para el desarrollo del frontend y backend.
- **PostgreSQL via Pooler**: Base de datos relacional utilizada para almacenar datos de usuarios, ítems, matches y chats.
- **Auth JWT**: Mecanismo de autenticación basado en tokens JSON Web Tokens.
- **Stripe**: Integrado para posibles futuras funcionalidades de pago.
- **Resend**: Servicio para el envío de correos electrónicos.
- **Fly.io**: Plataforma de despliegue para la aplicación.

## Por qué esta pila
- **Next.js**: Ofrece un rendimiento excelente y capacidades de renderizado del lado del servidor.
- **TypeScript**: Proporciona tipado estático, lo que ayuda a prevenir errores en tiempo de desarrollo.
- **PostgreSQL**: Conocida por su robustez y características avanzadas de gestión de datos.
- **JWT**: Permite una autenticación segura y sin estado.
- **Fly.io**: Facilita el despliegue global y escalabilidad.

## Flujo de Solicitudes
1. **Inicio de Sesión**: El usuario inicia sesión, se genera un JWT que se utiliza para autenticar futuras solicitudes.
2. **Deslizar Ítems**: El usuario ve una lista de ítems y desliza para indicar interés.
3. **Match**: Si ambos usuarios muestran interés en los ítems del otro, se crea un match.
4. **Chat**: Los usuarios pueden chatear sobre los ítems que hicieron match.
5. **Despliegue**: Las solicitudes se manejan a través de Fly.io, que distribuye la carga y asegura el tiempo de actividad.