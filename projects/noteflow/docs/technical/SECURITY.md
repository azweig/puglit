# Seguridad en Noteflow

## Modelo de Amenazas
- **Acceso no autorizado**: Uso de JWT para asegurar que solo usuarios autenticados accedan a la API.
- **Exposición de datos**: Uso de HTTPS para cifrar datos en tránsito.
- **Inyección SQL**: Uso de consultas parametrizadas para prevenir inyecciones.

## Matriz de Autorización
- **Usuarios autenticados**: Pueden crear, leer, actualizar y eliminar sus propias notas, recordatorios y etiquetas.

## RLS (Row-Level Security)
- Implementado en PostgreSQL para asegurar que los usuarios solo accedan a sus propios datos.

## Limitación de Tasa
- Implementación de limitación de tasa para prevenir abuso de API.

## Manejo de Datos
- **Datos en tránsito**: Cifrados con TLS.
- **Datos en reposo**: Cifrados en la base de datos.