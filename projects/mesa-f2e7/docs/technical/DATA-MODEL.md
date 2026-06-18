# Modelo de Datos de Mesa

## Diagrama ER
```mermaid
erDiagram
  Restaurant {
    text name
    text phone
    text address
    jsonb opening_hours
  }
  Table {
    text restaurant_id
    text name
    integer capacity
    text status
  }
  Reservation {
    text restaurant_id
    text customer_name
    text customer_phone
    integer party_size
    timestamptz reserved_at
  }
  Shift {
    text restaurant_id
    text name
    timestamptz start_time
    timestamptz end_time
    boolean is_active
  }

  Restaurant ||--o{ Table : "tiene"
  Restaurant ||--o{ Shift : "tiene"
  Restaurant ||--o{ Reservation : "tiene"
  Table ||--o{ Reservation : "asignada a"
  Shift ||--o{ Reservation : "asignada a"
```

## Descripción de Entidades y Relaciones
- **Restaurant**: Representa un restaurante con sus datos de contacto y horarios de apertura.
- **Table**: Mesas disponibles en un restaurante, con capacidad y estado.
- **Reservation**: Detalles de una reserva, incluyendo cliente, tamaño del grupo y hora reservada.
- **Shift**: Turnos de operación de un restaurante, indicando si están activos.

Las relaciones muestran que un restaurante puede tener múltiples mesas, turnos y reservas. Las reservas están asociadas a mesas y turnos específicos.