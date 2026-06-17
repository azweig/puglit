# Arquitectura de Truke

## Visión General del Sistema
Truke es una aplicación web diseñada para facilitar el intercambio y regalo de objetos usados mediante una interfaz similar a Tinder. Los usuarios pueden deslizar fotos de objetos, publicar los suyos y, si hay un interés mutuo, iniciar un chat anónimo sobre los objetos que hicieron match.

## Mapa de Componentes/Módulos
- **Frontend**: Implementado con Next.js 16, proporcionando una interfaz de usuario interactiva y dinámica.
- **Backend**: Construido con TypeScript, maneja la lógica de negocio y las interacciones con la base de datos.
- **Base de Datos**: PostgreSQL, gestionado a través de un pooler para optimizar las conexiones.
- **Autenticación**: JWT para manejar la autenticación de usuarios de manera segura.
- **Pagos**: Stripe para cualquier funcionalidad futura relacionada con transacciones.
- **Notificaciones**: Resend para enviar notificaciones a los usuarios.
- **Despliegue**: Fly.io para el backend y Vercel para el frontend.

## Stack y Justificación
- **Next.js 16**: Elegido por su capacidad para renderizar en el lado del servidor y su facilidad de uso con React.
- **TypeScript**: Proporciona tipado estático, lo que ayuda a prevenir errores comunes en el desarrollo.
- **PostgreSQL**: Base de datos relacional robusta y escalable, ideal para manejar las relaciones entre entidades como Items y Matches.
- **JWT**: Proporciona un método seguro y escalable para la autenticación de usuarios.
- **Fly.io y Vercel**: Ofrecen un entorno de despliegue ágil y escalable.

## Flujo de Solicitudes
1. **Usuario inicia sesión**: El usuario se autentica mediante JWT.
2. **Deslizar objetos**: Las solicitudes se envían al backend para obtener nuevos objetos.
3. **Crear un match**: Cuando dos usuarios muestran interés mutuo, se crea un match en la base de datos.
4. **Iniciar chat**: Los usuarios pueden enviar mensajes a través de un canal de chat anónimo.

Este flujo asegura que las interacciones sean rápidas y seguras, manteniendo la privacidad de los usuarios.