# API de Notely

## Endpoint: Crear Nota

### Descripción
Crea una nueva nota con la opción de añadir etiquetas y un recordatorio.

### Método
POST

### Ruta
/api/notes

### Solicitud
**Tipo**: `CreateNoteRequest`
```json
{
  "title": "string",
  "body": "string",
  "tags": [
    {
      "name": "string",
      "color": "string"
    }
  ],
  "reminder": {
    "note_id": "number",
    "reminder_time": "string"
  }
}
```

### Respuesta
**Tipo**: `CreateNoteResponse`
```json
{
  "note": {
    "id": "number",
    "title": "string",
    "body": "string",
    "created_at": "string",
    "updated_at": "string"
  },
  "tags": [
    {
      "id": "number",
      "name": "string",
      "color": "string"
    }
  ],
  "reminder": {
    "id": "number",
    "note_id": "number",
    "reminder_time": "string",
    "is_completed": "boolean"
  }
}
```

### Autenticación
Requiere un token Bearer válido.

### Requisitos de Acceso
El usuario debe tener una cuenta activa.
