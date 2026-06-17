# Data Model

## ER Diagram
```mermaid
erDiagram
  LoyaltyProgram {
    text name
    text provider
    text membership_id
    date expiration_date
  }
  Discount {
    text description
    double precision amount
    date valid_until
    text location
  }
  UserLocation {
    double precision latitude
    double precision longitude
    text address
  }
```

## Entity Descriptions

### LoyaltyProgram
- **name**: Nombre del programa de lealtad.
- **provider**: Proveedor del programa de lealtad.
- **membership_id**: Identificador único del usuario en el programa.
- **expiration_date**: Fecha de expiración de la membresía.

### Discount
- **description**: Descripción del descuento.
- **amount**: Monto del descuento.
- **valid_until**: Fecha hasta la cual el descuento es válido.
- **location**: Ubicación donde el descuento es aplicable.

### UserLocation
- **latitude**: Latitud de la ubicación del usuario.
- **longitude**: Longitud de la ubicación del usuario.
- **address**: Dirección textual de la ubicación del usuario.