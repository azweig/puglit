```mermaid
erDiagram
  Queue {
    text name
    text description
    timestamptz created_at
    boolean is_active
  }
  Task {
    text title
    text details
    date due_date
    text status
  }
  User {
    varchar email
    text full_name
    timestamptz joined_at
  }
```