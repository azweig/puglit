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
- **LoyaltyProgram**: Representa un programa de lealtad con nombre, proveedor, ID de membresía y fecha de expiración.
- **Discount**: Contiene la descripción del descuento, porcentaje, fecha de validez y ubicación.
- **UserLocation**: Guarda la latitud, longitud y dirección del usuario para determinar su ubicación actual.

## Relaciones
- No hay relaciones directas entre las entidades en el modelo actual, pero se utilizan en conjunto para determinar los descuentos aplicables a un usuario basado en su ubicación y programas de lealtad.
