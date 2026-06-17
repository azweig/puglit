# Documentación de la API

## Endpoint: Obtener Descuentos para el Usuario

### Método: GET
### Ruta: `/api/discounts`

### Solicitud
- **Headers**:
  - `Authorization`: Bearer <token>
- **Parámetros de Consulta**:
  - `latitude`: float
  - `longitude`: float

### Respuesta
- **Estado**: 200 OK
- **Cuerpo**:
  ```json
  {
    "discounts": [
      {
        "store": {
          "name": "string",
          "address": "string",
          "contact_email": "string"
        },
        "discount": {
          "description": "string",
          "location": "string",
          "valid_until": "Date"
        }
      }
    ]
  }
  ```

### Autenticación
- Requerida: Sí, mediante JWT.

### Gating
- El usuario debe tener al menos un programa de lealtad vinculado para acceder a los descuentos.