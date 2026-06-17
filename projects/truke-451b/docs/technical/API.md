# API de Truke

## Endpoints

### Crear un Match
- **Endpoint**: POST /api/match
- **Descripción**: Crea un match entre dos usuarios basado en el interés mutuo en items.
- **Cuerpo de la Solicitud**:
  ```json
  {
    "itemId": number,
    "userId": number
  }
  ```
- **Respuesta**:
  - **201 Created**: Devuelve el objeto Match creado.
- **Autenticación**: Requerida (el usuario debe estar autenticado).
- **Gating**: El usuario solo puede hacer match si no existe un match previo con el mismo item y usuario.