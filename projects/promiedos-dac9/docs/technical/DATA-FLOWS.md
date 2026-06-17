# Data Flows

## Key User/Data Flows

### Live Match Retrieval
```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Database

    User->>Frontend: Request live matches
    Frontend->>Backend: GET /api/live-matches
    Backend->>Database: Query matches
    Database-->>Backend: Return match data
    Backend-->>Frontend: Return match data
    Frontend-->>User: Display matches
```

### Authentication Flow
```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant AuthService

    User->>Frontend: Login request
    Frontend->>Backend: POST /api/auth/login
    Backend->>AuthService: Validate credentials
    AuthService-->>Backend: Return JWT
    Backend-->>Frontend: Return JWT
    Frontend-->>User: Store JWT
```

### Data Scraping and Update
```mermaid
sequenceDiagram
    participant CronJob
    participant Scraper
    participant Database

    CronJob->>Scraper: Trigger data scrape
    Scraper->>Database: Update match data
    Database-->>Scraper: Acknowledge update
```

These flows illustrate the interactions between users, the frontend, backend, and database, ensuring data is retrieved, authenticated, and updated efficiently.