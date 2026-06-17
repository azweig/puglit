# Arquitectura de Descuentos Perú

## Descripción General del Sistema
Descuentos Perú es una aplicación web que permite a los usuarios encontrar descuentos en tiendas y restaurantes cercanos basados en sus programas de lealtad y ubicación actual. La aplicación está construida sobre la pila Puglit/TodoAstros, que incluye Next.js 16, TypeScript, PostgreSQL, autenticación JWT, Stripe, Resend y Fly.io.

## Mapa de Componentes/Módulos
- **Next.js 16**: Framework de React para la construcción de interfaces de usuario y manejo del enrutamiento del lado del servidor.
- **TypeScript**: Lenguaje de programación que añade tipos estáticos a JavaScript, mejorando la mantenibilidad y escalabilidad del código.
- **PostgreSQL**: Base de datos relacional utilizada para almacenar información sobre programas de lealtad, descuentos y ubicaciones de usuarios.
- **JWT (JSON Web Tokens)**: Utilizado para la autenticación de usuarios.
- **Stripe**: Integrado para manejar pagos y suscripciones, aunque no es el foco principal de la aplicación.
- **Resend**: Servicio para el envío de correos electrónicos transaccionales.
- **Fly.io**: Plataforma de despliegue que permite ejecutar aplicaciones cerca de los usuarios finales para mejorar el rendimiento.

## Flujo de Solicitudes
1. **Autenticación**: El usuario inicia sesión y se le proporciona un token JWT.
2. **Solicitud de Descuentos**: El cliente envía una solicitud GET a `/api/discounts` con su ubicación actual.
3. **Validación**: El servidor verifica el token JWT y asegura que el usuario tiene al menos un programa de lealtad válido.
4. **Procesamiento**: El servidor consulta la base de datos para encontrar descuentos relevantes basados en la ubicación y programas de lealtad del usuario.
5. **Respuesta**: El servidor responde con una lista de descuentos aplicables.

## Justificación de la Pila
- **Next.js**: Elegido por su capacidad para manejar el renderizado del lado del servidor, lo cual es crucial para mejorar el SEO y el rendimiento de la aplicación.
- **TypeScript**: Aumenta la seguridad del código y facilita la colaboración en equipos grandes.
- **PostgreSQL**: Ofrece un sistema robusto para manejar relaciones complejas entre entidades como programas de lealtad y descuentos.
- **JWT**: Proporciona un método seguro y escalable para manejar la autenticación de usuarios.
- **Fly.io**: Permite desplegar la aplicación en múltiples regiones, reduciendo la latencia para los usuarios finales.
