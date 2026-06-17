```mermaid
erDiagram
  Item {
    text title
    text description
    text image_url
    text location
    boolean is_available
  }
  Match {
    integer item_id
    integer user_id_1
    integer user_id_2
    timestamptz match_date
  }
  Chat {
    integer match_id
    integer sender_id
    text message
    timestamptz timestamp
  }
  User {
    text username
    varchar email
    text profile_picture
    text city
  }
```