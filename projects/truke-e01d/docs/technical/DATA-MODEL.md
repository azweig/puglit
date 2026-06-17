# Modelo de Datos

## Diagrama ER
```mermaid
erDiagram
  Item {
    text title
    text description
    text condition
    text location
    text image_url
  }
  Match {
    integer item_id
    integer user_id
    timestamptz matched_at
    boolean is_active
  }
  Chat {
    integer match_id
    text message
    timestamptz sent_at
    boolean is_read
  }
  User {
    text username
    varchar email
    text profile_picture
    timestamptz created_at
  }

  User ||--o{ Item : "publica"
  User ||--o{ Match : "participa"
  Item ||--o{ Match : "tiene"
  Match ||--o{ Chat : "genera"
```

## Descripción de Entidades y Relaciones
- **Item**: Representa un objeto que un usuario desea intercambiar o regalar. Incluye título, descripción, condición, ubicación y URL de imagen.
- **Match**: Indica que dos usuarios han mostrado interés mutuo en los ítems del otro. Contiene referencias a `item_id` y `user_id`, junto con la fecha de match y su estado activo.
- **Chat**: Permite a los usuarios comunicarse sobre un ítem que ha hecho match. Incluye el `match_id`, el mensaje, la fecha de envío y si ha sido leído.
- **User**: Representa a un usuario de la aplicación, con nombre de usuario, correo electrónico, foto de perfil y fecha de creación.