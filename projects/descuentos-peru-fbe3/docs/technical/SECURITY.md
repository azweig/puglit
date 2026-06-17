# Seguridad

## Modelo de Amenazas
- **Exposición de Datos**: Protegido mediante JWT para autenticación y HTTPS para la transmisión de datos.
- **Acceso No Autorizado**: Implementación de controles de acceso basados en roles (RLS) y verificación de programas de lealtad vinculados.
- **Ataques de Fuerza Bruta**: Uso de rate-limiting para limitar el número de intentos de autenticación.

## Matriz de Autorización
- **Usuarios Autenticados**: Pueden acceder a sus propios datos de ubicación y descuentos relacionados.
- **Administradores**: Acceso a la gestión de programas de lealtad y descuentos.

## Rate-Limiting
- Implementado para proteger contra abusos en los endpoints de autenticación y obtención de descuentos.

## Manejo de Datos
- **Datos Personales**: Encriptados en reposo y en tránsito.
- **Ubicación del Usuario**: Solo se almacena la última ubicación conocida, minimizando la retención de datos.