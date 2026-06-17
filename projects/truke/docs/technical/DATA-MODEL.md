# Modelo de Datos

## Diagrama ER
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

  User ||--o{ Item : "publica"
  User ||--o{ Match : "participa"
  Item ||--o{ Match : "es parte de"
  Match ||--o{ Chat : "tiene"
```

## Descripción de Entidades y Relaciones
- **Item**: Representa un objeto que un usuario desea intercambiar. Incluye título, descripción, imagen, ubicación y disponibilidad.
- **Match**: Representa una coincidencia entre dos usuarios interesados en el mismo item. Incluye referencias a los usuarios y el item.
- **Chat**: Contiene mensajes intercambiados entre usuarios que han hecho match.
- **User**: Representa a un usuario de la aplicación, con información de contacto y ubicación.

Las relaciones definen cómo los usuarios interactúan con los items y entre sí a través de matches y chats.