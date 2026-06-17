# Modelo de Datos de Descuentos Perú

## Diagrama ER
```mermaid
erDiagram
  LoyaltyProgram {
    text program_name
    text provider
    text membership_id
    date expiration_date
  }
  Discount {
    text store_name
    double precision discount_percentage
    date valid_until
    jsonb location
  }
  UserLocation {
    double precision latitude
    double precision longitude
    text address
  }
  User {
    text user_id
    LoyaltyProgram[] loyalty_programs
    UserLocation location
  }
  LoyaltyProgram ||--o{ User : "pertenece a"
  Discount ||--o{ User : "aplicable a"
  UserLocation ||--o{ User : "tiene"
```

## Descripción de Entidades y Relaciones
- **LoyaltyProgram**: Representa un programa de lealtad al que un usuario está suscrito. Incluye el nombre del programa, el proveedor, el ID de membresía y la fecha de expiración.
- **Discount**: Detalla un descuento disponible, incluyendo el nombre de la tienda, el porcentaje de descuento, la fecha de validez y la ubicación.
- **UserLocation**: Contiene la información de ubicación del usuario, como latitud, longitud y dirección.
- **User**: Entidad que representa al usuario del sistema, incluyendo sus programas de lealtad y ubicación actual.

Las relaciones reflejan que un usuario puede tener múltiples programas de lealtad y una ubicación, y los descuentos son aplicables a los usuarios basados en estos programas y ubicaciones.