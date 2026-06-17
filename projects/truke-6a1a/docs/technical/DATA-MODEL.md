# Modelo de Datos de Truke

## Diagrama ER
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
    integer user_id
    timestamptz matched_at
  }
  Chat {
    integer match_id
    text message
    timestamptz sent_at
    boolean is_sender
  }
```

## Descripción de Entidades
- **Item**: Representa un objeto que un usuario desea intercambiar o regalar. Incluye título, descripción, URL de imagen y condición.
- **Match**: Representa un interés mutuo entre dos usuarios sobre un ítem. Incluye el ID del ítem, el ID del usuario y la fecha de creación del match.
- **Chat**: Representa un mensaje enviado en el contexto de un match. Incluye el ID del match, el contenido del mensaje, la fecha de envío y un indicador de si el usuario es el remitente.