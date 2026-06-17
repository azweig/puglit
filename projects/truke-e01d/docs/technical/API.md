# API de Truke

## Endpoint: Crear Match

### Método: POST

- **Path:** `/api/match`

- **Request:**
  - **Headers:**
    - `Authorization: Bearer <token>`
  - **Body:**
    ```json
    {
      "item_id": number,
      "user_id": number
    }
    ```

- **Response:**
  - **Status 200:**
    ```json
    {
      "match_id": number,
      "matched_at": string,
      "is_active": boolean
    }
    ```
  - **Status 400:**
    ```json
    {
      "error": "Invalid request data"
    }
    ```
  - **Status 401:**
    ```json
    {
      "error": "Unauthorized"
    }
    ```

- **Auth:** Requerido (Token Bearer)

- **Gating:** El usuario debe estar autenticado y autorizado para interactuar con el ítem. Ambos usuarios deben haber deslizado a la derecha en los ítems del otro para crear un match.