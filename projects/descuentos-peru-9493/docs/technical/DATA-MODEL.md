# Modelo de Datos

## Diagrama ER
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
    double precision percentage
    date valid_until
    text location
  }
  UserLocation {
    double precision latitude
    double precision longitude
    text address
  }
```

## Descripción de Entidades
- **LoyaltyProgram**: Representa un programa de lealtad al que un usuario está suscrito.
  - `name`: Nombre del programa de lealtad.
  - `provider`: Proveedor del programa.
  - `membership_id`: Identificador único de la membresía.
  - `expiration_date`: Fecha de expiración de la membresía.

- **Discount**: Detalla un descuento disponible en una ubicación específica.
  - `description`: Descripción del descuento.
  - `percentage`: Porcentaje de descuento ofrecido.
  - `valid_until`: Fecha hasta la cual el descuento es válido.
  - `location`: Ubicación donde el descuento es aplicable.

- **UserLocation**: Captura la ubicación actual del usuario.
  - `latitude`: Latitud de la ubicación del usuario.
  - `longitude`: Longitud de la ubicación del usuario.
  - `address`: Dirección textual de la ubicación del usuario.
