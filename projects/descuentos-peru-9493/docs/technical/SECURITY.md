# Seguridad de Descuentos Perú

## Modelo de Amenazas
- **Acceso no autorizado**: Uso de JWT para asegurar que solo usuarios autenticados accedan a los endpoints.
- **Exposición de datos sensibles**: Encriptación de datos sensibles y uso de HTTPS para proteger la transmisión de datos.
- **Inyección de SQL**: Uso de consultas preparadas y ORM para prevenir inyecciones.

## Matriz de Autorización
| Recurso         | Acción         | Rol Requerido |
|-----------------|----------------|---------------|
| /api/v1/discounts | POST           | Usuario       |

## Seguridad a Nivel de Fila (RLS)
- Implementación de políticas RLS en PostgreSQL para asegurar que los usuarios solo accedan a sus propios datos de programas de lealtad.

## Limitación de Tasa
- Implementación de limitación de tasa para proteger contra abusos de API.

## Manejo de Datos
- **Almacenamiento seguro**: Datos en reposo encriptados.
- **Transmisión segura**: Uso de HTTPS para todas las comunicaciones.
