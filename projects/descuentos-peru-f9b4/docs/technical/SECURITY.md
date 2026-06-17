# Seguridad de Descuentos Perú

## Modelo de Amenazas
- **Acceso no autorizado**: Uso de JWT para asegurar que solo usuarios autenticados puedan acceder a los endpoints.
- **Exposición de datos sensibles**: Encriptación de datos sensibles y uso de HTTPS para proteger la comunicación.
- **Abuso de API**: Implementación de limitación de tasa para prevenir abuso de endpoints.

## Matriz de Autorización
| Recurso | Acción | Rol Requerido |
|---------|--------|---------------|
| Descuentos | Ver | Usuario autenticado |
| Ubicación de Usuario | Actualizar | Usuario autenticado |

## Seguridad a Nivel de Fila (RLS)
- Aplicar políticas RLS en PostgreSQL para asegurar que los usuarios solo puedan acceder a sus propios datos de programas de lealtad y ubicaciones.

## Limitación de Tasa
- Implementar limitación de tasa para las solicitudes a `/api/v1/discounts/nearby` para prevenir el abuso y proteger la infraestructura.

## Manejo de Datos
- Encriptación de datos sensibles en tránsito y en reposo.
- Uso de políticas de retención de datos para eliminar datos antiguos que ya no son necesarios.