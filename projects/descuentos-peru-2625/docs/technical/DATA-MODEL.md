# Data Model

## ER Diagram
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

## Entity Descriptions

- **LoyaltyProgram**: Represents the loyalty programs available to users, including the name, provider, and unique membership ID.
- **Discount**: Details the discounts available, including a description, location, and expiration date.
- **UserLocation**: Captures the user's geographical data, including latitude, longitude, and address.