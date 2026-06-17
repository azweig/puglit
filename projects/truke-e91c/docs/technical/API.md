# API de Truke

## Endpoint: Crear Match

### POST /api/match
- **Método**: POST
- **Ruta**: /api/match
- **Cuerpo de la Solicitud**:
  ```json
  {
    "item_id": number,
    "user_id": number
  }
  ```
- **Respuesta**:
  - **Código 201 Created**
  ```json
  {
    "match": {
      "item_id": number,
      "user_id": number,
      "matched_at": "string"
    }
  }
  ```
- **Autenticación**: Requerida (Token Bearer)
- **Control de Acceso**: El usuario debe estar autenticado y autorizado para interactuar con el item.