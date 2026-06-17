# Arquitectura de Descuentos Perú

## Descripción General del Sistema
Descuentos Perú es una aplicación web diseñada para ayudar a los usuarios a encontrar descuentos en restaurantes y tiendas cercanas basados en sus programas de lealtad y ubicación actual. La aplicación utiliza scraping para obtener datos de programas de lealtad peruanos como BCP, Interbank, Movistar, Claro, CMR, Bonus, etc.

## Mapa de Componentes/Módulos
- **Frontend**: Construido con Next.js 16 y TypeScript para una experiencia de usuario dinámica y moderna.
- **Backend**: Implementado con Node.js y TypeScript, gestionando la lógica de negocio y la interacción con la base de datos.
- **Base de Datos**: PostgreSQL gestionado a través de un pooler para optimizar las conexiones.
- **Autenticación**: Utiliza JWT para la autenticación de usuarios.
- **Pagos**: Integración con Stripe para manejar pagos y suscripciones.
- **Notificaciones**: Resend se utiliza para enviar notificaciones a los usuarios.
- **Despliegue**: Fly.io se utiliza para el despliegue de la aplicación.

## La Pila Tecnológica y Por Qué
- **Next.js 16**: Elegido por su capacidad de renderizado del lado del servidor y su integración con React, lo que mejora el rendimiento y la SEO.
- **TypeScript**: Proporciona tipado estático, lo que ayuda a reducir errores y mejorar la mantenibilidad del código.
- **PostgreSQL**: Elegido por su robustez y capacidad de manejar consultas complejas necesarias para la lógica de descuentos.
- **JWT**: Proporciona un método seguro y escalable para la autenticación de usuarios.
- **Stripe**: Facilita la gestión de pagos de manera segura.
- **Resend**: Permite el envío eficiente de correos electrónicos y notificaciones.
- **Fly.io**: Ofrece un entorno de despliegue escalable y fácil de usar.

## Flujo de Solicitudes
1. **Inicio de Sesión del Usuario**: El usuario inicia sesión y se autentica mediante JWT.
2. **Solicitud de Descuentos Cercanos**: El usuario envía una solicitud POST a `/api/v1/discounts/nearby` con sus programas de lealtad y ubicación actual.
3. **Procesamiento en el Backend**: El backend valida la solicitud, verifica la autenticación y consulta la base de datos para encontrar descuentos aplicables.
4. **Respuesta al Usuario**: El backend responde con una lista de descuentos disponibles o un mensaje de error si la solicitud no es válida.
5. **Notificaciones**: Opcionalmente, se envían notificaciones al usuario sobre nuevos descuentos o cambios en sus programas de lealtad.