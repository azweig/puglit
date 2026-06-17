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
  UserLocation {
    double precision latitude
    double precision longitude
    text address
  }
```