# Seguridad

## Modelo de Amenazas
- **Acceso no autorizado**: Uso de JWT para asegurar que solo los usuarios autenticados puedan acceder a las funcionalidades.
- **Intercepción de datos**: Uso de HTTPS para proteger los datos en tránsito.
- **Acceso a datos sensibles**: Implementación de políticas de control de acceso para asegurar que los usuarios solo puedan acceder a sus propios datos.

## Matriz de Autorización
| Recurso       | Acción         | Rol Requerido |
|---------------|----------------|---------------|
| Item          | Crear, Leer    | Usuario       |
| Match         | Crear, Leer    | Usuario       |
| ChatMessage   | Crear, Leer    | Usuario       |

## Row-Level Security (RLS)
Se implementa RLS en PostgreSQL para asegurar que los usuarios solo puedan acceder a sus propios ítems, matches y mensajes de chat.

## Limitación de Tasa
Se implementan políticas de limitación de tasa para prevenir abusos de la API, limitando la cantidad de solicitudes permitidas por usuario por minuto.

## Manejo de Datos
- **Encriptación**: Datos sensibles encriptados en la base de datos.
- **Retención de Datos**: Los datos se retienen solo mientras sean necesarios para el propósito de la aplicación.