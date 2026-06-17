# Seguridad en Truke

## Modelo de Amenazas
- **Acceso no autorizado**: Prevención mediante autenticación JWT.
- **Intercepción de datos**: Uso de HTTPS para cifrar las comunicaciones.
- **Manipulación de datos**: Validación y sanitización de entradas.

## Matriz de Autorización
| Recurso    | Acción     | Rol Requerido |
|------------|------------|---------------|
| Ítem       | Crear      | Usuario       |
| Ítem       | Modificar  | Propietario   |
| Match      | Crear      | Usuario       |
| Chat       | Enviar     | Usuario       |

## RLS (Row-Level Security)
- **Ítems**: Solo el propietario puede modificar.
- **Matches**: Solo los usuarios involucrados pueden ver.
- **Chats**: Solo los usuarios involucrados pueden enviar y ver mensajes.

## Limitación de Tasa
- Implementación de rate-limiting para prevenir abusos de API.

## Manejo de Datos
- **Cifrado**: Datos sensibles cifrados en tránsito.
- **Almacenamiento**: Uso de PostgreSQL para almacenamiento seguro de datos.