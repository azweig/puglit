# API de Truke

## Endpoint para Creación de Match

### POST /api/match
- **Método**: POST
- **Ruta**: /api/match
- **Autenticación**: Requerida (Token Bearer)
- **Cuerpo de la Solicitud**:
  ```json
  {
    "itemId": number,
    "userId": number
  }
  ```

### Respuesta
- **Estado**: 201 Created
- **Cuerpo de la Respuesta**:
  ```json
  {
    "matchId": number,
    "itemId": number,
    "userId": number,
    "matchedAt": Date,
    "isActive": boolean
  }
  ```

### Gating
- El usuario debe estar autenticado.
- El usuario solo puede crear un match si no ha hecho match previamente con el mismo ítem.