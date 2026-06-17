# Seguridad de Descuentos Perú

## Modelo de Amenazas
- **Acceso No Autorizado**: Uso de JWT para asegurar que solo usuarios autenticados accedan a la API.
- **Exposición de Datos Sensibles**: Los datos de usuario y descuentos están protegidos mediante cifrado en tránsito.

## Matriz de Autorización
| Recurso          | Acción  | Rol Requerido |
|------------------|---------|---------------|
| /api/v1/discounts| GET     | Usuario       |

## Row-Level Security (RLS)
- Implementado en PostgreSQL para asegurar que los usuarios solo puedan acceder a sus propios datos de membresía.

## Limitación de Tasa
- Se implementa limitación de tasa para prevenir abuso del endpoint de descuentos.

## Manejo de Datos
- Los datos personales se manejan conforme a las regulaciones de protección de datos locales.
