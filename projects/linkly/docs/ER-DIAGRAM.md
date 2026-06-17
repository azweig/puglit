```mermaid
erDiagram
  Link {
    text original_url
    text shortened_url
    timestamptz created_at
    integer click_count
  }
  Click {
    integer link_id
    timestamptz clicked_at
    text referrer
    text user_agent
  }
  QRCode {
    integer link_id
    timestamptz generated_at
    text size
  }
```