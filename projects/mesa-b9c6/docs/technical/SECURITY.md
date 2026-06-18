# Seguridad de Mesa

## Modelo de Amenazas
- **Acceso no autorizado**: Asegurar que solo usuarios autorizados puedan acceder a ciertas funcionalidades administrativas.
- **Manipulación de datos**: Proteger la integridad de los datos de reservas y turnos.
- **Exposición de datos sensibles**: Asegurar que la información personal de los comensales esté protegida.

## Matriz de Autorización
| Recurso | Acción | Rol | Autorización |
|---------|--------|-----|--------------|
| Reserva | Crear  | Público | Permitido |
| Turno   | Gestionar | Admin | Requiere autenticación |
| Mesa    | Gestionar | Admin | Requiere autenticación |

## RLS (Row-Level Security)
- Implementar políticas de seguridad a nivel de fila en PostgreSQL para asegurar que los usuarios solo puedan acceder a los datos relevantes para ellos.

## Limitación de Tasa
- Implementar limitación de tasa en el endpoint de creación de reservas para prevenir abusos.

## Manejo de Datos
- **Encriptación**: Asegurar que todos los datos sensibles se almacenen encriptados.
- **Transmisión Segura**: Utilizar HTTPS para todas las comunicaciones entre cliente y servidor.