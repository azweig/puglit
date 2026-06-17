```mermaid
erDiagram
  Item {
    text title
    text description
    text image_url
    text location
    timestamptz created_at
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
    timestamptz created_at
    text profile_picture
  }
```