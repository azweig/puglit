# Seguridad

## Modelo de Amenazas
- **Acceso no autorizado**: Mitigado mediante JWT para autenticación.
- **Intercepción de datos**: Uso de HTTPS para cifrar datos en tránsito.
- **Manipulación de datos**: Validación y sanitización de entradas.

## Matriz de Autorización
- **Usuarios autenticados**: Pueden crear y ver matches, enviar y recibir mensajes.
- **Usuarios no autenticados**: Acceso denegado a funciones protegidas.

## RLS (Row-Level Security)
- Implementado para asegurar que los usuarios solo puedan acceder a sus propios datos.

## Limitación de Tasa
- Aplicada para prevenir abusos en la creación de matches y mensajes.

## Manejo de Datos
- Datos sensibles como contraseñas se almacenan encriptados.
- Los tokens JWT tienen una expiración definida para minimizar riesgos.