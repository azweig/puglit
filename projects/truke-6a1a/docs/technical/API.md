# API de Truke

## Endpoint: Crear Match
- **Método**: POST
- **Ruta**: `/api/matches`
- **Request**:
  - Headers: 
    - `Authorization`: `Bearer <token>`
  - Body:
    ```json
    {
      "itemId": number,
      "userId": number
    }
    ```
- **Response**:
  - Status: 201 Created
  - Body:
    ```json
    {
      "match": {
        "itemId": number,
        "userId": number,
        "matchedAt": string
      }
    }
    ```
- **Auth**: Requerida (Token Bearer)
- **Gating**: El usuario debe estar autenticado y autorizado para interactuar con el ítem especificado.

## Endpoint: Enviar Mensaje en Chat
- **Método**: POST
- **Ruta**: `/api/chats`
- **Request**:
  - Headers: 
    - `Authorization`: `Bearer <token>`
  - Body:
    ```json
    {
      "matchId": number,
      "message": string
    }
    ```
- **Response**:
  - Status: 201 Created
  - Body:
    ```json
    {
      "chat": {
        "matchId": number,
        "message": string,
        "sentAt": string,
        "isSender": boolean
      }
    }
    ```
- **Auth**: Requerida (Token Bearer)
- **Gating**: El usuario debe estar autenticado y autorizado para enviar mensajes en el match especificado.