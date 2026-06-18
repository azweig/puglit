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
    text zone
  }
  Reservation {
    text restaurant_id
    text guest_name
    text guest_phone
    varchar guest_email
    timestamptz reservation_at
  }
  Shift {
    text restaurant_id
    text name
    timestamptz start_time
    timestamptz end_time
    text status
  }
```