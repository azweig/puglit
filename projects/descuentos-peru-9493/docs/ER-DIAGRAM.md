```mermaid
erDiagram
  LoyaltyProgram {
    text name
    text provider
    text membership_id
    date expiration_date
  }
  Discount {
    text description
    double precision percentage
    date valid_until
    text location
  }
  UserLocation {
    double precision latitude
    double precision longitude
    text address
  }
```