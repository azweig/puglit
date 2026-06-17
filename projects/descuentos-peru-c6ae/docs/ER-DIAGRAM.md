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
```