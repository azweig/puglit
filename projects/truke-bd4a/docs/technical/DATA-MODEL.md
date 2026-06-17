# Modelo de Datos

## Diagrama ER
```mermaid
erDiagram
  Item {
    int id
    text title
    text description
    text image_url
    text condition
    int ownerId
  }
  Match {
    int item_id
    int user_id
    datetime matched_at
    bool is_active
  }
  Chat {
    int match_id
    text message
    datetime sent_at
    int sender_id
  }

  Item ||--o{ Match : ""
  Match ||--o{ Chat : ""
```

## Descripción de Entidades y Relaciones
- **Item**: Representa un objeto que un usuario desea intercambiar o regalar. Contiene título, descripción, URL de imagen, condición y el ID del propietario.
- **Match**: Representa un interés mutuo entre dos usuarios sobre un item. Incluye el ID del item, el ID del usuario, la fecha de creación del match y si está activo.
- **Chat**: Contiene los mensajes intercambiados entre usuarios que han hecho match. Incluye el ID del match, el mensaje, la fecha de envío y el ID del remitente.