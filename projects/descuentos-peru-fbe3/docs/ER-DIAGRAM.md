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
  Store {
    text name
    text address
    varchar contact_email
  }
  UserLocation {
    double precision latitude
    double precision longitude
    timestamptz last_updated
  }
```