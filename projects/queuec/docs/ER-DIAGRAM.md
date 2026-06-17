```mermaid
erDiagram
  Queue {
    text queue_name
    timestamptz created_at
    text status
  }
  Task {
    text task_name
    text description
    date due_date
    text priority
  }
  User {
    varchar email
    text full_name
    timestamptz joined_at
  }
```