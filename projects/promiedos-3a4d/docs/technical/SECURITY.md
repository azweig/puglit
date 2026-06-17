# Seguridad de Promiedos

## Modelo de Amenazas
- **Acceso no autorizado**: Uso de JWT para asegurar que solo usuarios autenticados puedan acceder a las API.
- **Inyección de SQL**: Uso de consultas preparadas para prevenir inyecciones.
- **Exposición de datos sensibles**: Encriptación de datos sensibles y uso de HTTPS.

## Matriz de Autorización
| Recurso       | Acción   | Rol Requerido |
|---------------|----------|---------------|
| /api/v1/live-football | GET      | Usuario Autenticado |

## Seguridad de Nivel de Fila (RLS)
- Implementar RLS en PostgreSQL para asegurar que los usuarios solo puedan acceder a los datos que les corresponden.

## Limitación de Tasa
- Implementar limitación de tasa para proteger contra abusos de API (100 solicitudes/hora por usuario).

## Manejo de Datos
- Los datos personales se manejan de acuerdo con las regulaciones de privacidad aplicables, asegurando la mínima exposición necesaria.