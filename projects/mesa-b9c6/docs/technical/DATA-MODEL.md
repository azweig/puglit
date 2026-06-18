# Modelo de Datos

## Diagrama ER
```mermaid
erDiagram
  Restaurant {
    text name
    text phone
    text address
    text timezone
  }
  Table {
    text label
    integer capacity
    text area
    boolean is_active
  }
  Reservation {
    text guest_name
    text guest_phone
    varchar guest_email
    integer party_size
    timestamptz reserved_at
  }
  Shift {
    text name
    date service_date
    timestamptz start_time
    timestamptz end_time
    text status
  }
  Restaurant ||--o{ Table : has
  Restaurant ||--o{ Shift : has
  Restaurant ||--o{ Reservation : receives
  Table ||--o{ Reservation : assigned to
  Shift ||--o{ Reservation : during
```

## Descripción de Entidades y Relaciones
- **Restaurant**: Entidad principal que representa un restaurante. Relacionado con `Table`, `Shift` y `Reservation`.
- **Table**: Representa una mesa en un restaurante. Relacionada con `Reservation`.
- **Reservation**: Representa una reserva realizada por un comensal. Está asociada a un `Restaurant`, `Table` y `Shift`.
- **Shift**: Representa un turno de servicio en un restaurante. Relacionado con `Reservation`.