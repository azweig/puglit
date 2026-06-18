# Modelo de Datos

## Diagrama ER

```mermaid
erDiagram
    Restaurant {
        string id
        text name
        text phone
        text address
        jsonb opening_hours
        string created_at
    }
    Table {
        string id
        string restaurant_id
        text name
        integer capacity
        text zone
        string created_at
    }
    Shift {
        string id
        string restaurant_id
        text name
        timestamptz start_time
        timestamptz end_time
        text status
        string created_at
    }
    Reservation {
        string id
        string restaurant_id
        string shift_id
        string table_id
        text guest_name
        text guest_phone
        varchar guest_email
        timestamptz reservation_at
        integer party_size
        text status
        string created_at
    }
    Restaurant ||--o{ Table : ""
    Restaurant ||--o{ Shift : ""
    Restaurant ||--o{ Reservation : ""
    Shift ||--o{ Reservation : ""
    Table ||--o{ Reservation : ""
```

## Descripción de Entidades y Relaciones

- **Restaurant**: Representa un restaurante con sus detalles de contacto y horarios de apertura.
- **Table**: Define las mesas disponibles en un restaurante, incluyendo su capacidad y zona.
- **Shift**: Describe un turno operativo de un restaurante, con un estado que puede ser "draft", "open" o "closed".
- **Reservation**: Detalla una reserva realizada por un comensal, incluyendo información de contacto y el turno reservado.

Las relaciones entre las entidades permiten gestionar las reservas en función de la disponibilidad de mesas y turnos en un restaurante.