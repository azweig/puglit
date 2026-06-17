# Modelo de Datos

## Diagrama ER
```mermaid
erDiagram
  LoyaltyProgram {
    text name
    text provider
    text membership_id
  }
  Discount {
    text description
    text location
    date valid_until
  }
  Store {
    text name
    text address
    varchar contact_email
  }
  UserLocation {
    double precision latitude
    double precision longitude
    timestamptz last_updated
  }
```

## Descripción de Entidades y Relaciones
- **LoyaltyProgram**: Representa un programa de lealtad al que un usuario puede estar suscrito. Incluye el nombre del programa, el proveedor y un ID de membresía.
- **Discount**: Detalla un descuento disponible, incluyendo su descripción, ubicación y fecha de validez.
- **Store**: Información sobre las tiendas que ofrecen descuentos, incluyendo nombre, dirección y correo de contacto.
- **UserLocation**: Almacena la ubicación actual del usuario, con latitud, longitud y la última actualización.