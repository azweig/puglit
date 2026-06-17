# Seguridad en Truke

## Modelo de Amenazas
- **Acceso No Autorizado**: Uso de JWT para asegurar que solo los usuarios autenticados puedan acceder a los endpoints protegidos.
- **Inyección SQL**: Uso de consultas parametrizadas para prevenir inyecciones.
- **Exposición de Datos Sensibles**: Cifrado de datos sensibles y uso de HTTPS para todas las comunicaciones.

## Matriz de Autorización
| Recurso | Acción | Rol Requerido |
|---------|--------|---------------|
| Item    | Crear  | Usuario       |
| Match   | Crear  | Usuario       |
| Chat    | Enviar | Usuario       |

## Row Level Security (RLS)
- Implementación de RLS en PostgreSQL para asegurar que los usuarios solo puedan acceder a sus propios datos.

## Limitación de Tasa
- Implementación de limitación de tasa para prevenir abusos y ataques de denegación de servicio.

## Manejo de Datos
- Los datos personales se manejan de acuerdo con las mejores prácticas de privacidad y protección de datos.