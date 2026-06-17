```mermaid
erDiagram
  Note {
    text title
    text body
    timestamptz created_at
    timestamptz updated_at
  }
  Reminder {
    integer note_id
    timestamptz reminder_time
    boolean is_completed
  }
  Tag {
    text name
    text color
  }
```