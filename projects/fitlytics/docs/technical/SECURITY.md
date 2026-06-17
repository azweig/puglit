# Seguridad en Fitlytics

## Modelo de Amenazas
- **Acceso No Autorizado**: Uso de JWT para asegurar que solo usuarios autenticados puedan acceder a los datos.
- **Exposición de Datos Sensibles**: Implementación de RLS (Row-Level Security) para garantizar que los usuarios solo accedan a sus propios datos.
- **Ataques de Fuerza Bruta**: Protección mediante limitación de tasa de solicitudes.

## Matriz de Autorización
| Recurso       | Acción            | Permiso Necesario    |
|---------------|-------------------|----------------------|
| Predicciones  | Ver               | view_predictions     |
| Reportes      | Generar/Ver       | manage_reports       |

## RLS (Row-Level Security)
- **Predicciones**: Las políticas de RLS aseguran que un usuario solo pueda ver predicciones asociadas a sus miembros.

## Limitación de Tasa
- Implementación de límites de tasa para todas las API para prevenir abusos y ataques de denegación de servicio.

## Manejo de Datos
- **Cifrado**: Todos los datos sensibles se cifran en tránsito y en reposo.
- **Auditoría**: Registro de todas las acciones de usuario para auditoría y monitoreo de seguridad.
