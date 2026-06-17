```mermaid
erDiagram
  Book {
    text title
    text author
    text isbn
    boolean available
  }
  Reservation {
    integer book_id
    integer user_id
    timestamptz reservation_date
    text status
  }
  Notification {
    integer reservation_id
    timestamptz notification_date
    text message
    boolean is_read
  }
  ReadingHistory {
    integer book_id
    integer user_id
    date read_date
    integer rating
  }
```