# Data Flows

## Key User/Data Flows

### User Requests Discounts
```mermaid
sequenceDiagram
    participant User
    participant Client
    participant Server
    participant Database

    User->>Client: Open App
    Client->>Server: GET /api/discounts?latitude=xx&longitude=yy
    Server->>Server: Validate JWT
    Server->>Database: Query User's Loyalty Programs
    Database-->>Server: Return Loyalty Programs
    Server->>Database: Query Discounts based on Location and Programs
    Database-->>Server: Return Discounts
    Server-->>Client: 200 OK (Discounts)
    Client-->>User: Display Discounts
```

This flow demonstrates how a user interacts with the application to receive personalized discounts based on their location and loyalty programs.