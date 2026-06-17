# Seguridad en Descuentos Perú

## Modelo de Amenazas
- **Acceso no autorizado**: Uso de JWT para asegurar que solo usuarios autenticados accedan a los endpoints.
- **Exposición de datos sensibles**: Los datos de ubicación y programas de lealtad están protegidos mediante autenticación y autorización adecuadas.

## Matriz de Autorización
| Recurso       | Acción   | Rol Requerido |
|---------------|----------|---------------|
| /api/discounts| GET      | Usuario       |

## Row-Level Security (RLS)
- Implementado en PostgreSQL para asegurar que los usuarios solo puedan acceder a sus propios datos de programas de lealtad y descuentos.

## Limitación de Tasa
- Implementación de limitación de tasa en el endpoint `/api/discounts` para prevenir abusos y ataques de denegación de servicio.

## Manejo de Datos
- Los datos de usuario, incluyendo la ubicación y programas de lealtad, son manejados con cuidado para asegurar la privacidad y seguridad.
- Los tokens JWT son almacenados de manera segura y se invalidan después de un tiempo de expiración o al cerrar sesión.