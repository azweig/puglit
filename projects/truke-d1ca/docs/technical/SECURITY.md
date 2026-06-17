# Seguridad de Truke

## Modelo de Amenazas
- **Acceso no autorizado**: Mitigado mediante autenticación JWT.
- **Exposición de datos sensibles**: Los datos personales están protegidos y solo accesibles mediante endpoints autenticados.
- **Ataques de fuerza bruta**: Limitación de intentos de inicio de sesión mediante rate-limiting.

## Matriz de Autorización
| Recurso | Acción | Rol | Condición |
|---------|--------|-----|-----------|
| Item    | Ver    | Usuario autenticado | Ninguna |
| Match   | Crear  | Usuario autenticado | No existe match previo |
| Chat    | Enviar | Usuario autenticado | Match activo |

## RLS (Row-Level Security)
- Se implementa RLS en PostgreSQL para asegurar que los usuarios solo puedan acceder a sus propios datos.

## Rate-Limiting
- Se implementa rate-limiting en los endpoints críticos para prevenir abusos y ataques de denegación de servicio.

## Manejo de Datos
- Los datos personales se almacenan de forma segura y se accede a ellos solo cuando es necesario para la funcionalidad de la aplicación.