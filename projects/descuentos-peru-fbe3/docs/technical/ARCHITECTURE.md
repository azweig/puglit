# Arquitectura de Descuentos Perú

## Descripción General del Sistema
Descuentos Perú es una aplicación web diseñada para ayudar a los usuarios a encontrar descuentos en restaurantes y tiendas cercanas, basándose en los programas de lealtad a los que están suscritos y su ubicación actual.

## Mapa de Componentes/Módulos
- **Frontend**: Construido con Next.js 16 y TypeScript, proporciona la interfaz de usuario interactiva.
- **Backend**: Implementado en Node.js con Express, maneja la lógica de negocio y las interacciones con la base de datos.
- **Base de Datos**: PostgreSQL, gestionada a través de un pooler para optimizar las conexiones.
- **Autenticación**: JWT para la autenticación de usuarios.
- **Pagos**: Stripe para cualquier funcionalidad de pago futuro.
- **Email**: Resend para el envío de correos electrónicos.
- **Despliegue**: Fly.io para el backend y Vercel para el frontend.

## La Pila Tecnológica y su Elección
- **Next.js 16**: Elegido por su capacidad para renderizar en el lado del servidor y su excelente soporte para TypeScript.
- **TypeScript**: Proporciona tipado estático, lo que ayuda a reducir errores en el código.
- **PostgreSQL**: Base de datos relacional robusta y escalable, ideal para manejar las relaciones entre programas de lealtad y descuentos.
- **JWT**: Proporciona un método seguro y estándar para la autenticación de usuarios.

## Flujo de Solicitudes
1. **Autenticación**: El usuario inicia sesión y recibe un token JWT.
2. **Solicitud de Descuentos**: El cliente envía una solicitud GET a `/api/discounts` con el token JWT y la ubicación actual.
3. **Procesamiento en el Servidor**: El backend verifica la autenticación, consulta la base de datos para encontrar descuentos relevantes y devuelve la respuesta.
4. **Respuesta al Cliente**: El cliente recibe y muestra los descuentos disponibles en la interfaz de usuario.