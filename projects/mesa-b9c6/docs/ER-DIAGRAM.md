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
```