# Seguridad de Truke

## Modelo de Amenazas
- **Acceso No Autorizado**: Uso de JWT para asegurar que solo usuarios autenticados puedan acceder a la API.
- **Inyección SQL**: Uso de consultas parametrizadas para prevenir inyecciones.
- **Exposición de Datos Sensibles**: Minimizar datos sensibles en respuestas y logs.

## Matriz de Autorización
| Recurso | Acción | Rol Requerido |
|---------|--------|---------------|
| Item    | Crear  | Usuario       |
| Match   | Crear  | Usuario       |
| Chat    | Enviar | Usuario       |

## Row-Level Security (RLS)
- Implementado en PostgreSQL para asegurar que los usuarios solo puedan acceder a sus propios datos.

## Limitación de Tasa
- Implementar limitación de tasa a nivel de API para prevenir abusos.

## Manejo de Datos
- Encriptación de datos sensibles en tránsito usando HTTPS.
- Almacenamiento seguro de JWT en el cliente.