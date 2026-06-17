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
    integer matched_user_id
    timestamptz match_date
  }
  Chat {
    integer match_id
    text message
    timestamptz sent_at
    boolean is_sender_user
  }
```