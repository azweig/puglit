# Arquitectura de Notely

## Descripción General del Sistema
Notely es una aplicación de notas que permite a los usuarios crear, organizar y gestionar notas con recordatorios y etiquetas. La aplicación está diseñada para ser escalable y segura, utilizando tecnologías modernas para ofrecer una experiencia de usuario fluida.

## Mapa de Componentes/Módulos
- **Next.js 16**: Framework de React para el frontend, que soporta renderizado del lado del servidor y generación de sitios estáticos.
- **TypeScript**: Lenguaje de programación que añade tipado estático a JavaScript, mejorando la mantenibilidad y la detección de errores.
- **PostgreSQL**: Base de datos relacional utilizada para almacenar notas, recordatorios y etiquetas.
- **JWT (JSON Web Tokens)**: Utilizado para la autenticación de usuarios.
- **Stripe**: Integrado para manejar pagos y suscripciones.
- **Resend**: Servicio para el envío de correos electrónicos.
- **Fly.io**: Plataforma de despliegue para aplicaciones distribuidas.

## Por qué esta Pila
- **Next.js**: Ofrece un excelente soporte para aplicaciones React con SSR, mejorando el SEO y el tiempo de carga inicial.
- **TypeScript**: Reduce errores en tiempo de desarrollo y mejora la calidad del código.
- **PostgreSQL**: Proporciona robustez y flexibilidad en la gestión de datos relacionales.
- **JWT**: Permite un manejo seguro y escalable de la autenticación.

## Flujo de Solicitudes
1. **Cliente**: El usuario interactúa con la aplicación a través de una interfaz web construida con Next.js.
2. **Servidor**: Las solicitudes se envían al servidor Next.js, que maneja la lógica de negocio y las interacciones con la base de datos PostgreSQL.
3. **Base de Datos**: Las operaciones CRUD se realizan en PostgreSQL, utilizando un pool de conexiones para eficiencia.
4. **Autenticación**: Las solicitudes protegidas requieren un JWT válido.
5. **Servicios Externos**: Stripe se utiliza para pagos y Resend para notificaciones por correo.
