# Seguridad en Truke

## Modelo de Amenazas
- **Acceso no autorizado**: Uso de JWT para asegurar que solo los usuarios autenticados puedan acceder a ciertas funcionalidades.
- **Intercepción de datos**: Uso de HTTPS para cifrar las comunicaciones entre el cliente y el servidor.
- **Manipulación de datos**: Validación de entrada y uso de consultas parametrizadas para prevenir inyecciones SQL.

## Matriz de Autorización
| Recurso       | Acción   | Rol Requerido |
|---------------|----------|---------------|
| /api/match    | POST     | Usuario       |
| /api/chat     | POST     | Usuario       |

## Row-Level Security (RLS)
- Implementado en la base de datos para asegurar que los usuarios solo puedan acceder a sus propios datos.

## Limitación de Tasa
- Implementación de políticas de limitación de tasa para prevenir abusos del sistema.

## Manejo de Datos
- Los datos sensibles son cifrados en tránsito y en reposo.
- Los registros de chat son anonimizados para proteger la privacidad del usuario.