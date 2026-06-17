# Modelo de Datos

## Diagrama ER
```mermaid
erDiagram
  Note {
    text title
    text body
    timestamptz created_at
    timestamptz updated_at
  }
  Reminder {
    integer note_id
    timestamptz reminder_time
    boolean is_completed
  }
  Tag {
    text name
    text color
  }
  Note ||--o{ Reminder : "tiene"
  Note ||--o{ Tag : "etiquetado con"
```

## Descripción de Entidades y Relaciones

- **Note**: Representa una nota creada por un usuario. Contiene un título, cuerpo, y marcas de tiempo de creación y actualización.
- **Reminder**: Asociado a una nota, indica un recordatorio con una hora específica y un estado de completado.
- **Tag**: Representa una etiqueta que puede ser asociada a una o más notas, con un nombre y un color para identificación visual.
- **Relaciones**:
  - Una **Note** puede tener múltiples **Reminders**.
  - Una **Note** puede estar asociada a múltiples **Tags**.
