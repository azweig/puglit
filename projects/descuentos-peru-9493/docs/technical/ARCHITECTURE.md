# Arquitectura de Descuentos Perú

## Descripción General del Sistema
Descuentos Perú es una aplicación web diseñada para ayudar a los usuarios a encontrar descuentos en restaurantes y tiendas cercanas basados en sus programas de lealtad y ubicación actual. La aplicación se conecta a múltiples fuentes de programas de lealtad peruanos, como BCP, Interbank, Movistar, Claro, CMR, y Bonus, para proporcionar información personalizada sobre descuentos.

## Mapa de Componentes/Módulos
- **Frontend**: Construido con Next.js 16, proporciona una interfaz de usuario interactiva y dinámica.
- **Backend**: Implementado en TypeScript, maneja la lógica de negocio y las interacciones con la base de datos.
- **Base de Datos**: PostgreSQL, utilizada para almacenar datos de programas de lealtad, descuentos y ubicaciones de usuario.
- **Autenticación**: JWT (JSON Web Tokens) para la autenticación de usuarios.
- **Pagos**: Stripe para manejar cualquier funcionalidad de pago futuro.
- **Email**: Resend para enviar notificaciones por correo electrónico.
- **Despliegue**: Fly.io para el backend y Vercel para el frontend.

## Justificación del Stack
- **Next.js**: Elegido por su capacidad para renderizar del lado del servidor y su integración con React, lo que mejora la experiencia del usuario.
- **TypeScript**: Proporciona tipado estático que ayuda a prevenir errores en tiempo de compilación.
- **PostgreSQL**: Ofrece robustez y escalabilidad para manejar consultas complejas y grandes volúmenes de datos.
- **JWT**: Proporciona un método seguro y estándar para la autenticación de usuarios.

## Flujo de Solicitudes
1. **Usuario inicia sesión**: Se autentica usando JWT.
2. **Solicitud de descuentos**: El usuario envía una solicitud POST a `/api/v1/discounts` con sus programas de lealtad y ubicación actual.
3. **Procesamiento del backend**: El servidor valida la solicitud, verifica la autenticación y busca descuentos aplicables.
4. **Respuesta**: Se devuelve una lista de descuentos al usuario.
