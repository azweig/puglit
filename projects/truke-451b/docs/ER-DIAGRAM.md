```mermaid
erDiagram
  Item {
    text title
    text description
    text image_url
    text condition
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