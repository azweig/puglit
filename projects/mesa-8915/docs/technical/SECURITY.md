# Seguridad de Mesa

## Modelo de Amenazas

- **Acceso no autorizado**: Uso de JWT para asegurar que solo usuarios autenticados puedan acceder a ciertas funcionalidades.
- **Inyección SQL**: Uso de consultas parametrizadas para prevenir inyecciones SQL.
- **Exposición de Datos Sensibles**: Encriptación de datos sensibles y uso de HTTPS para proteger la transmisión de datos.
- **Ataques de Denegación de Servicio (DoS)**: Implementación de límites de tasa (rate-limiting) para prevenir abusos.

## Matriz de Autorización

| Recurso         | Acción          | Usuario Autorizado |
|-----------------|-----------------|--------------------|
| Restaurante     | Ver             | Público            |
| Reserva         | Crear           | Público            |
| Turno           | Gestionar       | Administrador      |
| Mesa            | Gestionar       | Administrador      |

## Row-Level Security (RLS)

- **Reservas**: Solo los administradores del restaurante pueden ver y gestionar todas las reservas.
- **Turnos**: Solo los administradores del restaurante pueden modificar los turnos.

## Limitación de Tasa

- **Reservas**: Limitación por IP y restaurante para prevenir abusos en la creación de reservas.

## Manejo de Datos

- **Encriptación**: Datos sensibles como contraseñas y detalles de pago se encriptan antes de almacenarse.
- **Retención de Datos**: Los datos se retienen solo el tiempo necesario para cumplir con las obligaciones legales y de negocio.

Estas medidas aseguran que la aplicación Mesa sea segura y confiable para todos los usuarios.