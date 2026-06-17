# Arquitectura de Noteflow

## Descripción General del Sistema
Noteflow es una aplicación de notas que permite a los usuarios crear notas con recordatorios y etiquetas. La aplicación está diseñada para ser altamente escalable y segura, utilizando una arquitectura moderna basada en microservicios.

## Mapa de Componentes/Módulos
- **Next.js 16**: Framework para el frontend, proporcionando SSR y optimización de rendimiento.
- **TypeScript**: Lenguaje de programación para asegurar tipado estático y reducir errores.
- **PostgreSQL**: Base de datos relacional utilizada para almacenar notas, recordatorios y etiquetas.
- **Pooler**: Manejador de conexiones para optimizar el acceso a la base de datos.
- **JWT (JSON Web Tokens)**: Autenticación basada en tokens para asegurar las solicitudes de API.
- **Stripe**: Integración para pagos y suscripciones.
- **Resend**: Servicio para el envío de correos electrónicos de notificaciones.
- **Fly.io**: Plataforma de despliegue para aplicaciones distribuidas.

## Por qué esta Pila
- **Next.js**: Elegido por su capacidad de renderizado del lado del servidor y su facilidad de uso con React.
- **TypeScript**: Proporciona seguridad de tipos, lo que es crucial para mantener un código base grande y colaborativo.
- **PostgreSQL**: Ofrece robustez y características avanzadas para manejar datos relacionales complejos.

## Flujo de Solicitudes
1. **Cliente**: El usuario realiza una solicitud para crear una nota.
2. **Servidor Next.js**: Procesa la solicitud y verifica la autenticación JWT.
3. **Base de Datos**: Utiliza pooler para manejar la conexión y almacenar la nota, recordatorio y etiquetas.
4. **Resend**: Envía notificaciones por correo electrónico si es necesario.
5. **Respuesta**: El servidor responde al cliente con los detalles de la nota creada.