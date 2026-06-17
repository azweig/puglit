# API de Noteflow

## Endpoint: Crear una Nota

### Método: POST
### Ruta: /api/notes
### Autenticación: Requerida (Token Bearer)
### Gating: El usuario debe estar autenticado

### Cuerpo de la Solicitud
```json
{
  "title": "string",
  "body": "string",
  "reminder_time": "string", // Opcional, formato ISO 8601
  "tags": [{ "name": "string", "color": "string" }] // Opcional
}
```

### Respuesta
```json
{
  "note": {
    "id": "number",
    "title": "string",
    "body": "string",
    "created_at": "string",
    "updated_at": "string"
  },
  "reminder": {
    "id": "number",
    "note_id": "number",
    "reminder_time": "string",
    "is_completed": "boolean"
  },
  "tags": [{ "id": "number", "name": "string", "color": "string" }]
}
```