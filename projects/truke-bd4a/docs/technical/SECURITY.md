# Seguridad de Truke

## Modelo de Amenazas
- **Autenticación**: Uso de JWT para asegurar que solo usuarios autenticados puedan acceder a funcionalidades.
- **Autorización**: Verificación de que los usuarios no puedan hacer match con sus propios items.
- **Comunicación Segura**: Uso de HTTPS para proteger la transmisión de datos.

## Matriz de Autorización
| Recurso | Acción | Rol |
|---------|--------|-----|
| Item    | Ver    | Usuario autenticado |
| Match   | Crear  | Usuario autenticado |
| Chat    | Enviar | Usuario autenticado |

## Row-Level Security (RLS)
- Implementado en PostgreSQL para asegurar que los usuarios solo puedan acceder a sus propios datos.

## Limitación de Tasa
- Implementación de rate-limiting para prevenir abuso de endpoints.

## Manejo de Datos
- Los datos sensibles son encriptados y se asegura el mínimo acceso necesario.