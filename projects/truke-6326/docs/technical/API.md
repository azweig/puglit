# API de Truke

## Endpoint: Crear Match
- **Método**: POST
- **Ruta**: `/api/matches`
- **Solicitud**:
  - Encabezados:
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
      "match": {
        "itemId": number,
        "userId": number,
        "matchedAt": string
      }
    }
    ```
- **Autenticación**: Requerida (Token Bearer)
- **Control de Acceso**: El usuario debe estar autenticado y autorizado para crear un match. El item debe pertenecer a otro usuario.