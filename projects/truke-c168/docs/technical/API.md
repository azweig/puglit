# Documentación de API

## Endpoint: Crear Match

### Solicitud
- **Método**: POST
- **Ruta**: /api/matches
- **Autenticación**: Requerida (Token Bearer)
- **Cuerpo**:
  ```json
  {
    "item_id": number,
    "user_id": number
  }
  ```

### Respuesta
- **Estado**: 201 Created
- **Cuerpo**:
  ```json
  {
    "match": {
      "item_id": number,
      "user_id": number,
      "matched_at": string,
      "is_active": boolean
    }
  }
  ```

### Gating
- El usuario debe estar autenticado.
- No debe existir un match activo con el mismo item y usuario.