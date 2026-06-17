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
    boolean is_active
  }
  Chat {
    integer match_id
    text message
    timestamptz sent_at
    boolean is_sender
  }
```

## Descripción de Entidades y Relaciones

### Item
- **title**: Título del objeto.
- **description**: Descripción detallada del objeto.
- **image_url**: URL de la imagen del objeto.
- **condition**: Estado del objeto (nuevo, como nuevo, usado, para partes).

### Match
- **item_id**: ID del objeto que ha sido match.
- **user_id**: ID del usuario que ha hecho match con el objeto.
- **matched_at**: Fecha y hora en que se creó el match.
- **is_active**: Indica si el match está activo.

### Chat
- **match_id**: ID del match al que pertenece el chat.
- **message**: Contenido del mensaje enviado.
- **sent_at**: Fecha y hora en que se envió el mensaje.
- **is_sender**: Indica si el mensaje fue enviado por el usuario actual.