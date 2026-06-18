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
```