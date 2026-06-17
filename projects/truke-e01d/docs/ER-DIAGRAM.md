```mermaid
erDiagram
  Item {
    text title
    text description
    text condition
    text location
    text image_url
  }
  Match {
    integer item_id
    integer user_id
    timestamptz matched_at
    boolean is_active
  }
  Chat {
    integer match_id
    text message
    timestamptz sent_at
    boolean is_read
  }
  User {
    text username
    varchar email
    text profile_picture
    timestamptz created_at
  }
```