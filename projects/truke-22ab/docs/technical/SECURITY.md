# Seguridad de Truke

## Modelo de Amenazas
1. **Acceso no autorizado**: Uso de JWT para asegurar que solo los usuarios autenticados puedan acceder a las funcionalidades protegidas.
2. **Exposición de datos sensibles**: Minimización de datos personales en las respuestas de la API.
3. **Inyección SQL**: Uso de consultas parametrizadas y ORM para prevenir inyecciones SQL.

## Matriz de Autorización
| Recurso | Acción | Rol Requerido |
|---------|--------|---------------|
| Item    | Crear  | Usuario       |
| Match   | Crear  | Usuario       |
| Chat    | Enviar | Usuario       |

## RLS (Row-Level Security)
Se implementa RLS en PostgreSQL para asegurar que los usuarios solo puedan acceder a los datos que les pertenecen o que están autorizados a ver.

## Limitación de Tasa
Implementación de limitación de tasa para prevenir abusos de la API, asegurando que las solicitudes por usuario estén dentro de límites razonables.

## Manejo de Datos
- **Encriptación**: Los datos sensibles se almacenan encriptados.
- **Retención de Datos**: Los datos se retienen solo durante el tiempo necesario para cumplir con los propósitos del servicio.