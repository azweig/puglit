```mermaid
erDiagram
  Item {
    text title
    text description
    text image_url
    timestamptz created_at
  }
  Match {
    integer item_id
    integer user_id
    timestamptz matched_at
  }
  Chat {
    integer match_id
    text message
    timestamptz sent_at
  }
```