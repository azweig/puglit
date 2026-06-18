```mermaid
erDiagram
  Benefit {
    text title
    text description
    text provider_type
    text category
    text terms_url
  }
  Location {
    text name
    text address
    text city
    double precision latitude
    double precision longitude
  }
  WalletItem {
    text provider_name
    text provider_type
    text product_name
    boolean is_active
  }
  Merchant {
    text name
    text category
    text website_url
    boolean is_featured
  }
```