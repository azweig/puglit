# Data Model

## ER Diagram
```mermaid
erDiagram
  Endpoint {
    text name
    text url
    integer check_interval_minutes
    boolean is_active
  }
  Incident {
    text title
    text description
    text status
    timestamptz started_at
    timestamptz resolved_at
  }
  StatusCheck {
    timestamptz checked_at
    text status
    integer response_time_ms
    integer status_code
  }
  StatusPage {
    text name
    text slug
    text custom_domain
    boolean is_public
  }
  StatusPage ||--o{ Endpoint : contains
  StatusPage ||--o{ Incident : reports
  Endpoint ||--o{ StatusCheck : logs
```

## Entity Descriptions
- **Endpoint**: Represents a monitored HTTPS endpoint with details like name, URL, check interval, and active status.
- **Incident**: Describes an incident affecting an endpoint or the entire status page, including title, description, status, and timestamps.
- **StatusCheck**: Logs the result of a status check on an endpoint, including the time of check, status, response time, and HTTP status code.
- **StatusPage**: Represents a public status page, including its name, slug, custom domain, and visibility status.