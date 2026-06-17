```mermaid
erDiagram
  Queue {
    text name
    text description
    timestamptz created_at
  }
  Task {
    text title
    text status
    date due_date
    integer queue_id
  }
  User {
    varchar email
    text password_hash
    timestamptz created_at
  }
```