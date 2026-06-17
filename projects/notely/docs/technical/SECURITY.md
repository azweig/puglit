# Seguridad de Notely

## Modelo de Amenazas
- **Acceso no autorizado**: Protegido mediante autenticación JWT.
- **Inyección SQL**: Mitigado mediante consultas parametrizadas.
- **Exposición de datos sensibles**: Uso de HTTPS para cifrado en tránsito.

## Matriz de Autorización
| Recurso    | Acción    | Rol Requerido |
|------------|-----------|---------------|
| Nota       | Crear     | Usuario       |
| Nota       | Leer      | Usuario       |
| Nota       | Actualizar| Usuario       |
| Nota       | Eliminar  | Usuario       |

## RLS (Row-Level Security)
- Implementado para asegurar que los usuarios solo puedan acceder a sus propias notas y recordatorios.

## Limitación de Tasa
- Implementación de limitación de tasa para evitar abusos de API.

## Manejo de Datos
- Los datos sensibles se manejan con cuidado, asegurando que no se expongan más allá de lo necesario.
