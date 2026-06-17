# API de Descuentos Perú

## Endpoint: Obtener Descuentos Cercanos

### POST /api/v1/discounts/nearby

**Descripción**: Obtiene los descuentos disponibles en tiendas y restaurantes cercanos basándose en los programas de lealtad del usuario y su ubicación actual.

**Autenticación**: Requerida (Token Bearer)

**Gating**: El usuario debe tener al menos un programa de lealtad activo.

### Solicitud

- **Método**: POST
- **Encabezados**:
  - `Authorization`: `Bearer <token>`
- **Cuerpo**:
  ```json
  {
    "user_id": "string",
    "location": {
      "latitude": "float",
      "longitude": "float",
      "address": "string"
    }
  }
  ```

### Respuesta

- **200 OK**:
  ```json
  {
    "discounts": [
      {
        "store_name": "string",
        "discount_percentage": "float",
        "valid_until": "date",
        "location": {
          "latitude": "float",
          "longitude": "float",
          "address": "string"
        }
      }
    ]
  }
  ```

- **400 Bad Request**:
  ```json
  {
    "error": "string"
  }
  ```

- **401 Unauthorized**:
  ```json
  {
    "error": "string"
  }
  ```

### Ejemplo de Uso

```bash
curl -X POST https://api.descuentosperu.com/api/v1/discounts/nearby \
  -H "Authorization: Bearer <token>" \
  -d '{"user_id": "123", "location": {"latitude": -12.0464, "longitude": -77.0428, "address": "Lima, Peru"}}'
```
