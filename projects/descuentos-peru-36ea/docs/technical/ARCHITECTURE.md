# Architecture

## System Overview
Descuentos Perú es una aplicación web diseñada para ayudar a los usuarios a encontrar descuentos en restaurantes y tiendas cercanas basados en sus programas de lealtad y ubicación actual. La aplicación utiliza scraping para obtener datos de programas de lealtad peruanos y los combina con la ubicación del usuario para mostrar descuentos relevantes.

## Component/Module Map
- **Frontend**: Construido con Next.js 16 y TypeScript para una experiencia de usuario interactiva y eficiente.
- **Backend**: Implementado en Node.js con TypeScript, manejando la lógica de negocio y la comunicación con la base de datos.
- **Database**: PostgreSQL, accesible a través de un pooler para optimizar las conexiones.
- **Authentication**: JWT para la autenticación de usuarios.
- **Payments**: Stripe para la gestión de pagos y suscripciones.
- **Email**: Resend para el envío de correos electrónicos.
- **Deployment**: Fly.io para el despliegue de la aplicación.

## Technology Stack
- **Next.js 16**: Framework para React que permite la generación de sitios estáticos y aplicaciones del lado del servidor.
- **TypeScript**: Lenguaje de programación que añade tipado estático a JavaScript.
- **PostgreSQL**: Base de datos relacional utilizada para almacenar datos de programas de lealtad y descuentos.
- **JWT**: JSON Web Tokens para la autenticación segura de usuarios.
- **Stripe**: Plataforma de pagos utilizada para gestionar suscripciones y pagos.
- **Resend**: Servicio de envío de correos electrónicos.
- **Fly.io**: Plataforma de despliegue que permite ejecutar aplicaciones cerca de los usuarios.

## Request Flow
1. **Usuario inicia sesión**: El usuario se autentica mediante JWT.
2. **Solicitud de descuentos**: El usuario envía una solicitud a `/api/v1/user-discounts` con sus programas de lealtad y ubicación actual.
3. **Procesamiento en el backend**: El backend valida la solicitud, verifica los programas de lealtad y consulta la base de datos para encontrar descuentos relevantes.
4. **Respuesta al usuario**: El backend responde con una lista de descuentos que se muestran al usuario en la interfaz.