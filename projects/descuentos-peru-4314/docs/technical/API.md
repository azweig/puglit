# API de Descuentos Perú

## Endpoint: Obtener Descuentos

### Método: GET

### Ruta: `/api/discounts`

### Solicitud
- **Headers**:
  - `Authorization`: Bearer `<token>`
- **Parámetros de Consulta**:
  - `latitude`: float (requerido)
  - `longitude`: float (requerido)

### Respuesta
- **Estado**: 200 OK
- **Cuerpo**:
  ```json
  {
    "discounts": [
      {
        "store_name": "string",
        "discount_percentage": "number",
        "valid_until": "Date",
        "location": {
          "latitude": "number",
          "longitude": "number",
          "address": "string"
        }
      }
    ]
  }
  ```

### Autenticación
- Requiere autenticación mediante un token Bearer.

### Gating
- El usuario debe tener al menos un programa de lealtad válido para acceder a los descuentos.