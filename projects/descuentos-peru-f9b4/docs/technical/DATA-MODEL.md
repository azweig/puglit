# Modelo de Datos

## Diagrama ER
```mermaid
erDiagram
  LoyaltyProgram {
    text name
    text provider
    text membership_number
    date expiration_date
  }
  Discount {
    text description
    double precision percentage
    date valid_until
    text location
  }
  UserLocation {
    double precision latitude
    double precision longitude
    text address
    timestamptz updated_at
  }
```

## Descripción de Entidades y Relaciones

### LoyaltyProgram
- **name**: Nombre del programa de lealtad.
- **provider**: Proveedor del programa de lealtad.
- **membership_number**: Número de membresía del usuario.
- **expiration_date**: Fecha de expiración del programa de lealtad.

### Discount
- **description**: Descripción del descuento.
- **percentage**: Porcentaje de descuento ofrecido.
- **valid_until**: Fecha hasta la cual el descuento es válido.
- **location**: Ubicación donde el descuento es aplicable.

### UserLocation
- **latitude**: Latitud de la ubicación del usuario.
- **longitude**: Longitud de la ubicación del usuario.
- **address**: Dirección textual de la ubicación del usuario.
- **updated_at**: Fecha y hora de la última actualización de la ubicación del usuario.