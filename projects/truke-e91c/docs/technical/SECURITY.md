# Seguridad de Truke

## Modelo de Amenazas
- **Acceso no autorizado**: Uso de JWT para asegurar que solo usuarios autenticados puedan acceder a las funcionalidades.
- **Manipulación de datos**: Validaciones en el backend para asegurar la integridad de los datos.
- **Exposición de datos sensibles**: Uso de HTTPS para proteger la transmisión de datos.

## Matriz de Autorización
| Recurso | Acción | Rol | Autorización |
|---------|--------|-----|--------------|
| Item    | Ver    | Usuario autenticado | Sí |
| Match   | Crear  | Usuario autenticado | Sí |
| Chat    | Enviar | Usuario autenticado | Sí |

## RLS (Row Level Security)
- Implementación de políticas de seguridad a nivel de fila en PostgreSQL para asegurar que los usuarios solo puedan acceder a sus propios datos.

## Limitación de Tasa
- Implementación de limitación de tasa para prevenir abusos del sistema de chat y match.

## Manejo de Datos
- Cifrado de datos sensibles y uso de prácticas seguras para el almacenamiento y manejo de información de usuario.