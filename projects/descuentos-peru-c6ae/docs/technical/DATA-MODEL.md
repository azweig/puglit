# Modelo de Datos

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
    string user_id
    LoyaltyProgram[] loyalty_programs
    UserLocation location
  }
  User ||--o{ LoyaltyProgram : "tiene"
  User ||--|| UserLocation : "ubicado en"
  Discount ||--o{ UserLocation : "aplica a"
```

## Descripción de Entidades y Relaciones

- **LoyaltyProgram**: Representa un programa de lealtad al que el usuario está suscrito. Incluye el nombre del programa, el proveedor, el ID de membresía y la fecha de expiración.
- **Discount**: Representa un descuento disponible en una tienda o restaurante. Incluye el nombre de la tienda, el porcentaje de descuento, la fecha de validez y la ubicación.
- **UserLocation**: Representa la ubicación actual del usuario, incluyendo latitud, longitud y dirección.
- **User**: Representa al usuario de la aplicación, incluyendo su ID único, los programas de lealtad a los que pertenece y su ubicación actual.

Las relaciones entre las entidades permiten asociar a los usuarios con sus programas de lealtad y ubicaciones, y los descuentos con las ubicaciones donde son válidos.
