# API de Truke

## Endpoint: Creación de Match

### POST /api/match

**Request Body**:
- `itemId`: number (ID del item de interés)
- `userId`: number (ID del usuario que realiza la solicitud)

**Response**:
- `200 OK`
  - `match`: Match (Detalles del match si es exitoso)
- `400 Bad Request`
  - `error`: string (Descripción del error)

**Autenticación**:
- Requerido: Token Bearer

**Gating**:
- El usuario debe estar autenticado.
- El usuario no debe ser el propietario del item.
- El item debe estar disponible para hacer match.