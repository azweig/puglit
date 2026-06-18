# Seguridad en Mesa

## Modelo de Amenazas
- **Acceso no autorizado**: Asegurado mediante JWT para endpoints que requieren autenticación.
- **Inyección SQL**: Mitigado mediante consultas parametrizadas en PostgreSQL.
- **Exposición de Datos Sensibles**: Datos personales y de pago protegidos mediante cifrado y acceso controlado.

## Matriz de Autorización
| Recurso        | Acción         | Rol         |
|----------------|----------------|-------------|
| Restaurante    | Ver            | Público     |
| Reserva        | Crear          | Público     |
| Turno          | Administrar    | Restaurante |
| Mesa           | Administrar    | Restaurante |

## Seguridad de Nivel de Fila (RLS)
- Implementado para asegurar que los restaurantes solo puedan acceder a sus propios datos.

## Limitación de Tasa
- Implementado para prevenir abusos de API, limitando el número de solicitudes por IP.

## Manejo de Datos
- **Datos Personales**: Cifrados y accesibles solo a usuarios autorizados.
- **Datos de Pago**: Procesados y almacenados mediante Stripe, cumpliendo con PCI DSS.