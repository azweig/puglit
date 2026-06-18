# Arquitectura del Sistema

## Descripción General

La plataforma "Loyalty Points Peru" es una aplicación web que permite a los usuarios en Perú encontrar descuentos y beneficios cercanos basados en su ubicación actual y su "Mi Billetera". La aplicación no requiere registro, lo que simplifica el acceso y uso para los usuarios.

## Mapa de Componentes/Módulos

- **Geo Module**: Se encarga de la geolocalización y cálculo de distancias entre la ubicación del usuario y los beneficios disponibles.
- **Engine Module**: Procesa las solicitudes para encontrar los beneficios más relevantes basados en la ubicación y el contenido de "Mi Billetera".
- **Profiling Module**: Maneja la lógica de perfilado de usuarios, aunque no se requiere autenticación, se utiliza para personalizar la experiencia basada en la entrada del usuario.

## Stack Tecnológico

- **Next.js 16**: Framework de React para el frontend, elegido por su capacidad de renderizado del lado del servidor y su facilidad de integración con TypeScript.
- **TypeScript**: Lenguaje de programación que añade tipos estáticos a JavaScript, mejorando la mantenibilidad y la detección de errores.
- **PostgreSQL via Pooler**: Base de datos relacional utilizada para almacenar datos de beneficios, ubicaciones, y elementos de billetera. El pooler mejora la eficiencia de las conexiones.
- **Auth JWT**: Aunque no se requiere autenticación para el endpoint principal, JWT se utiliza para cualquier futura expansión que requiera autenticación.
- **Stripe y Resend**: Integraciones previstas para futuras funcionalidades de pago y notificaciones.
- **Fly.io**: Plataforma de despliegue que permite escalar la aplicación de manera eficiente y geográficamente distribuida.

## Flujo de Solicitudes

1. **Solicitud de Beneficios Cercanos**: El usuario envía una solicitud POST a `/api/v1/benefits/nearby` con su ubicación actual y detalles de "Mi Billetera".
2. **Procesamiento**: El módulo Engine procesa la solicitud, utilizando el módulo Geo para calcular distancias y determinar beneficios cercanos.
3. **Respuesta**: Se devuelve una lista de beneficios relevantes, ordenados por puntuación de relevancia, al usuario.