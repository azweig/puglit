# Seguridad de Truke

## Modelo de Amenazas
- **Autenticación**: Uso de JWT para asegurar que solo usuarios autenticados puedan acceder a funcionalidades protegidas.
- **Autorización**: Verificación de que los usuarios solo puedan interactuar con sus propios datos y matches.
- **RLS (Row-Level Security)**: Implementado en PostgreSQL para asegurar que los usuarios solo puedan acceder a sus propios registros.

## Matriz de Autorización
| Recurso | Acción | Rol |
|---------|--------|-----|
| Item | Crear/Ver | Usuario |
| Match | Crear/Ver | Usuario |
| Chat | Enviar/Ver | Usuario |

## Rate Limiting
- Implementación de límites de tasa para prevenir abuso de endpoints.

## Manejo de Datos
- Cifrado de datos sensibles en tránsito usando HTTPS.
- Almacenamiento seguro de JWT en el lado del cliente.