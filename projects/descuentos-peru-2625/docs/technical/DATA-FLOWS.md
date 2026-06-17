# Data Flows

## Key User/Data Flows

### Sequence Diagram for Discount Retrieval
```mermaid
sequenceDiagram
    participant User
    participant WebApp
    participant Database
    participant GeoModule
    participant AuthModule

    User->>WebApp: Request /api/v1/discounts with location & memberships
    WebApp->>AuthModule: Validate JWT
    AuthModule-->>WebApp: JWT Valid
    WebApp->>GeoModule: Process location data
    GeoModule-->>WebApp: Location processed
    WebApp->>Database: Query discounts with location & memberships
    Database-->>WebApp: Return matching discounts
    WebApp-->>User: Respond with discounts
```

This sequence diagram illustrates the flow of data when a user requests discounts based on their location and loyalty program memberships.