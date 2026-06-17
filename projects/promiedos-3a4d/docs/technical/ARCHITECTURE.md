# Arquitectura de Promiedos

## Visión General del Sistema
Promiedos es una aplicación web que proporciona actualizaciones en vivo de partidos de fútbol argentino, incluyendo fixtures, tablas de posiciones, goleadores y resultados históricos. Los datos se obtienen mediante scraping y se actualizan automáticamente a través de tareas cron.

## Mapa de Componentes/Módulos
- **Next.js 16**: Framework de React para el frontend, utilizado por su capacidad de renderizado del lado del servidor y generación de sitios estáticos.
- **TypeScript**: Lenguaje de programación utilizado para garantizar la tipificación estática y mejorar la calidad del código.
- **PostgreSQL**: Base de datos relacional utilizada para almacenar datos de partidos, torneos, posiciones y goleadores.
- **Auth JWT**: Autenticación basada en tokens JSON Web Tokens para proteger las API.
- **Stripe**: Integración para pagos y suscripciones.
- **Resend**: Servicio para enviar correos electrónicos transaccionales.
- **Fly.io**: Plataforma de despliegue para aplicaciones distribuidas.

## Flujo de Solicitudes
1. **Usuario**: Realiza una solicitud a través de la interfaz web.
2. **Next.js Server**: Procesa la solicitud y consulta los datos necesarios desde PostgreSQL.
3. **PostgreSQL**: Recupera los datos solicitados y los envía de vuelta al servidor.
4. **Next.js Server**: Renderiza la página con los datos obtenidos y la envía al cliente.
5. **Cliente**: Muestra los datos al usuario final.

## Elección del Stack
- **Next.js**: Elegido por su capacidad para manejar aplicaciones de alto rendimiento con SSR y SSG.
- **TypeScript**: Proporciona seguridad de tipos y reduce errores en tiempo de ejecución.
- **PostgreSQL**: Ofrece robustez y características avanzadas para manejar datos relacionales complejos.
- **Fly.io**: Permite despliegues rápidos y escalables con soporte para múltiples regiones.