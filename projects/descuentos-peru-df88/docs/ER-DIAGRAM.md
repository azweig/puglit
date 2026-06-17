```mermaid
erDiagram
  LoyaltyProgram {
    text name
    text provider
    text membership_id
    boolean is_active
  }
  Discount {
    text description
    text location
    date valid_until
    integer loyalty_program_id
  }
  UserLocation {
    double precision latitude
    double precision longitude
    text address
    timestamptz created_at
  }
```