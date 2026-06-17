# Arquitectura de Truke

## Descripción General del Sistema
Truke es una aplicación tipo Tinder para el intercambio y regalo de objetos usados. Los usuarios pueden deslizar fotos de objetos, publicar los suyos y, si hay un match mutuo, chatear de forma anónima sobre los items que hicieron match.

## Mapa de Componentes/Módulos
- **Next.js 16**: Framework para el frontend, permite SSR y SSG, mejorando el rendimiento y SEO.
- **TypeScript**: Asegura tipado estático, reduciendo errores en tiempo de ejecución.
- **PostgreSQL**: Base de datos relacional, gestionada a través de un pooler para optimizar conexiones.
- **JWT para Autenticación**: Proporciona tokens seguros para la autenticación de usuarios.
- **Stripe**: Integración para posibles transacciones futuras.
- **Resend**: Servicio para el envío de correos electrónicos.
- **Fly.io**: Plataforma de despliegue para aplicaciones distribuidas.

## Flujo de Solicitudes
1. **Autenticación**: El usuario inicia sesión y recibe un JWT.
2. **Navegación de Items**: El usuario desliza items, enviando solicitudes al backend para obtener más items.
3. **Creación de Match**: Cuando dos usuarios muestran interés mutuo, se crea un match.
4. **Chat**: Los usuarios pueden chatear sobre los items que hicieron match.

Cada solicitud pasa por un middleware de autenticación que verifica el JWT antes de proceder.