# Documentación de la API de Truke

## Endpoint de Creación de Match

### POST /api/match

**Descripción**: Crea un match entre dos usuarios si ambos han mostrado interés en los objetos del otro.

**Cuerpo de la Solicitud**:
- `itemId`: número (ID del objeto en el que el usuario actual está interesado)
- `matchedUserId`: número (ID del usuario que posee el objeto)

**Respuesta**:
- **201 Created**
  - `match`: Match (Detalles del match creado)
- **400 Bad Request**
  - `error`: string (Descripción del error)
- **401 Unauthorized**
  - `error`: string (Descripción del error)

**Autenticación**: Requerida (Token Bearer)

**Control de Acceso**: El usuario debe estar autenticado y autorizado para crear un match.