# API de Descuentos Perú

## Endpoint: Obtener Descuentos

### Método: GET
- **Path**: `/api/v1/discounts`
- **Query Parameters**:
  - `latitude`: float (requerido)
  - `longitude`: float (requerido)
  - `memberships`: string[] (opcional, array de IDs de membresía)

### Autenticación
- Requiere token Bearer en el encabezado de autorización.

### Gating
- El usuario debe tener al menos una membresía válida en el sistema para acceder a los descuentos.

### Respuesta
- **Tipo**: `DiscountResponse`
- **Contenido**:
  ```json
  {
    "discounts": [
      {
        "description": "10% de descuento en restaurante X",
        "percentage": 10.0,
        "valid_until": "2023-12-31",
        "location": "Lima, Perú"
      }
    ]
  }
  ```
