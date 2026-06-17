# Seguridad en Truke

## Modelo de Amenazas
- **Acceso no autorizado**: Protección mediante JWT para asegurar que solo usuarios autenticados accedan a recursos restringidos.
- **Manipulación de datos**: Validación en el servidor para prevenir la modificación no autorizada de datos.
- **Exposición de datos sensibles**: Uso de HTTPS para proteger la transmisión de datos.

## Matriz de Autorización
| Recurso | Acción | Rol | Condiciones |
|---------|--------|-----|-------------|
| Item    | Ver    | Usuario autenticado | Ninguna |
| Match   | Crear  | Usuario autenticado | Item disponible, no propio |
| Chat    | Enviar | Usuario autenticado | Match existente |

## RLS (Row-Level Security)
- Implementado para asegurar que los usuarios solo puedan acceder a sus propios datos de chat y matches.

## Limitación de Tasa
- Implementación de limitación de tasa para prevenir abusos en la creación de matches y envío de mensajes.

## Manejo de Datos
- Datos personales como correos electrónicos están encriptados en la base de datos.
- Se utiliza Resend para manejar de forma segura las notificaciones por correo electrónico.