# Data Model

## Entity-Relationship Diagram
```mermaid
erDiagram
  MonitoredEndpoint {
    text name
    text url
    integer check_interval_minutes
    boolean is_active
  }
  HealthCheck {
    timestamptz checked_at
    text status
    integer http_status_code
    integer response_time_ms
    text failure_reason
  }
  AlertEvent {
    text event_type
    timestamptz triggered_at
    varchar email_recipient
    boolean email_sent
    text message
  }

  MonitoredEndpoint ||--o{ HealthCheck : "has"
  MonitoredEndpoint ||--o{ AlertEvent : "triggers"
```

## Entity Descriptions
- **MonitoredEndpoint**: Represents a URL that is being monitored. Contains the name, URL, check interval, and active status.
- **HealthCheck**: Records the result of each check performed on a monitored endpoint, including the status, HTTP status code, response time, and any failure reason.
- **AlertEvent**: Logs events related to downtimes, including the type of event (e.g., downtime detected, recovery), the time it was triggered, the recipient of the alert email, and whether the email was sent.