# Seguridad de Truke

## Modelo de Amenazas
- **Acceso no autorizado**: Mitigado mediante autenticación JWT.
- **Exposición de datos sensibles**: Minimizado mediante el uso de HTTPS y encriptación de datos sensibles.
- **Ataques de fuerza bruta**: Mitigado mediante rate-limiting en endpoints críticos.

## Matriz de Autorización
| Recurso | Acción | Rol | Autorización |
|---------|--------|-----|--------------|
| Item    | Crear  | Usuario | Autenticado |
| Match   | Crear  | Usuario | Autenticado y autorizado |
| Chat    | Enviar | Usuario | Autenticado y autorizado |

## RLS (Row-Level Security)
- Aplicado en la base de datos para asegurar que los usuarios solo puedan acceder a sus propios ítems, matches y chats.

## Rate-Limiting
- Implementado en todos los endpoints para prevenir abusos y ataques de denegación de servicio.

## Manejo de Datos
- Los datos sensibles son encriptados y se almacenan de manera segura.
