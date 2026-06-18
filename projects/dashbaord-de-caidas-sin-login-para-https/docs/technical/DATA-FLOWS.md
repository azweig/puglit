# Data Flows

## Health Check Execution
```mermaid
sequenceDiagram
    participant Engine
    participant Database
    participant Resend
    participant PublicDashboard

    Engine->>Database: Schedule Health Check
    loop Every 5 minutes
        Engine->>Database: Execute Health Check
        alt Status is down
            Engine->>Database: Record Failure
            Engine->>Resend: Send Alert Email
        else Status is up
            Engine->>Database: Record Success
        end
    end
```

## Public Dashboard Access
```mermaid
sequenceDiagram
    participant User
    participant PublicDashboard
    participant Database

    User->>PublicDashboard: GET /api/public/status
    PublicDashboard->>Database: Fetch Latest Status
    Database-->>PublicDashboard: Return Status Data
    PublicDashboard-->>User: Display Status and Metrics
```

These flows illustrate the periodic execution of health checks and how the public dashboard retrieves and displays the latest status information.