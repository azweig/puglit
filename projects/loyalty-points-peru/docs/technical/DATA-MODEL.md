# Modelo de Datos

## Diagrama ER

```mermaid
erDiagram
  Benefit {
    string id
    text title
    longtext description
    enum provider_type
    text category
    url terms_url
  }
  Location {
    string id
    text name
    text address
    text city
    float latitude
    float longitude
  }
  WalletItem {
    string id
    text provider_name
    enum provider_type
    text product_name
    boolean is_active
  }
  Merchant {
    string id
    text name
    text category
    url website_url
    boolean is_featured
  }

  Benefit ||--|| Location : "is available at"
  Benefit ||--|| Merchant : "is offered by"
  WalletItem ||--o{ Benefit : "can be used for"
```

## Descripción de Entidades y Relaciones

- **Benefit**: Representa un descuento o beneficio disponible. Está asociado a una ubicación y un comerciante.
- **Location**: Detalla la ubicación física donde un beneficio está disponible.
- **WalletItem**: Representa un producto de "Mi Billetera" del usuario, como una tarjeta de crédito o un plan telefónico.
- **Merchant**: Representa al comerciante que ofrece el beneficio.

Las relaciones entre estas entidades permiten determinar qué beneficios están disponibles en qué ubicaciones y cuáles son aplicables a los elementos de la billetera del usuario.