# API de Descuentos Perú

## Endpoints

### POST /api/v1/discounts

- **Descripción**: Devuelve una lista de descuentos aplicables basados en los programas de lealtad del usuario y su ubicación.
- **Autenticación**: Requiere un token JWT válido.
- **Gating**: El usuario debe tener al menos un programa de lealtad válido.

#### Solicitud
- **Headers**:
  - `Authorization`: Bearer token para autenticación del usuario.
- **Body**:
  ```json
  {
    "loyaltyPrograms": [
      {
        "name": "string",
        "provider": "string",
        "membership_id": "string",
        "expiration_date": "Date"
      }
    ],
    "userLocation": {
      "latitude": "float",
      "longitude": "float",
      "address": "string"
    }
  }
  ```

#### Respuesta
- **200 OK**:
  ```json
  {
    "discounts": [
      {
        "description": "string",
        "percentage": "float",
        "valid_until": "Date",
        "location": "string"
      }
    ]
  }
  ```
- **401 Unauthorized**:
  ```json
  {
    "error": "string"
  }
  ```
- **400 Bad Request**:
  ```json
  {
    "error": "string"
  }
  ```
