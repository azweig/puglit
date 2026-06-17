# Seguridad en Truke

## Modelo de Amenazas
- **Acceso no autorizado**: Uso de JWT para asegurar que solo usuarios autenticados puedan acceder a ciertas funcionalidades.
- **Exposición de datos sensibles**: Uso de HTTPS para cifrar datos en tránsito.
- **Manipulación de datos**: Validación y sanitización de entradas para prevenir inyecciones SQL y XSS.

## Matriz de Autorización
| Recurso | Acción | Rol Permitido |
|---------|--------|---------------|
| Item    | Crear  | Usuario       |
| Match   | Crear  | Usuario       |
| Chat    | Enviar | Usuario       |

## RLS (Row-Level Security)
- Implementar políticas de RLS en PostgreSQL para asegurar que los usuarios solo puedan acceder a sus propios datos.

## Limitación de Tasa
- Implementar limitación de tasa para prevenir abusos de la API.

## Manejo de Datos
- Almacenar contraseñas de forma segura utilizando hashing.
- Minimizar la retención de datos personales.