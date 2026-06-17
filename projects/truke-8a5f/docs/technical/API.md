# API de Truke

## Endpoint: Crear Match
- **Método**: `POST`
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
  - Estado: `201 Created`
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
- **Gating**: El usuario debe estar autenticado y autorizado para crear un match. Ambos usuarios deben haber deslizado a la derecha en los ítems del otro para que se cree un match.

## Endpoint: Iniciar Chat
- **Método**: `POST`
- **Ruta**: `/api/chats`
- **Solicitud**:
  - Headers: 
    - `Authorization`: `Bearer <token>`
  - Cuerpo:
    ```json
    {
      "matchId": number,
      "message": string
    }
    ```
- **Respuesta**:
  - Estado: `201 Created`
  - Cuerpo:
    ```json
    {
      "chat": {
        "matchId": number,
        "message": string,
        "sentAt": string
      }
    }
    ```
- **Autenticación**: Requerida (Token Bearer)
- **Gating**: El usuario debe estar autenticado y autorizado para enviar mensajes en un chat de match.
