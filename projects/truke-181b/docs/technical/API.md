# API de Truke

## Crear Match
- **Método**: POST
- **Ruta**: `/api/matches`
- **Solicitud**:
  - Headers: 
    - `Authorization`: `Bearer <token>`
  - Cuerpo:
    ```json
    {
      "itemId": number,
      "userId": number
    }
    ```
- **Respuesta**:
  - Estado: 201 Created
  - Cuerpo:
    ```json
    {
      "matchId": number,
      "itemId": number,
      "userId": number,
      "matchedAt": string,
      "isActive": boolean
    }
    ```
- **Autenticación**: Requerida
- **Control de Acceso**: El usuario debe estar autenticado y autorizado para interactuar con el item especificado.