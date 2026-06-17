```mermaid
erDiagram
  Member {
    text name
    varchar email
    date join_date
    text status
  }
  Report {
    text title
    timestamptz generated_date
    text data
  }
  Prediction {
    integer member_id
    date predicted_date
    double precision likelihood
  }
```