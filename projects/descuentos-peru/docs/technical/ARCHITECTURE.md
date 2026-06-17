# Architecture

## System Overview
Descuentos Perú es una aplicación web que permite a los usuarios encontrar descuentos en restaurantes y tiendas cercanas basados en los programas de lealtad que poseen y su ubicación actual. La aplicación scrapea información de varios programas de lealtad peruanos y la utiliza para ofrecer descuentos personalizados.

## Component/Module Map
- **Next.js 16**: Framework utilizado para la interfaz de usuario y el servidor de aplicaciones.
- **TypeScript**: Lenguaje de programación utilizado para garantizar la tipificación estática.
- **PostgreSQL**: Base de datos utilizada para almacenar información de usuarios, programas de lealtad y descuentos.
- **JWT (JSON Web Tokens)**: Utilizado para la autenticación de usuarios.
- **Stripe**: Integración para manejar pagos (si es necesario en el futuro).
- **Resend**: Servicio para el envío de correos electrónicos.
- **Fly.io**: Plataforma de despliegue de la aplicación.

## Stack and Why
- **Next.js**: Elegido por su capacidad para manejar aplicaciones de React con renderizado del lado del servidor, lo cual es crucial para la optimización de SEO y tiempos de carga.
- **TypeScript**: Proporciona seguridad de tipos, lo que reduce errores en tiempo de ejecución.
- **PostgreSQL**: Base de datos relacional robusta y escalable.
- **JWT**: Proporciona un método seguro y estándar para la autenticación de usuarios.

## How Requests Flow
1. **Usuario inicia sesión**: Se autentica con JWT.
2. **Solicitud de descuentos**: El cliente envía una solicitud GET a `/api/discounts` con la ubicación actual.
3. **Procesamiento en el servidor**:
   - Verifica el token JWT.
   - Consulta la base de datos para obtener los programas de lealtad del usuario.
   - Filtra descuentos aplicables basados en la ubicación y programas de lealtad.
4. **Respuesta**: Devuelve los descuentos aplicables al cliente.