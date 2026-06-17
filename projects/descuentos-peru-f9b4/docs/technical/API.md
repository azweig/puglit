# API de Descuentos Perú

## Endpoints

### POST /api/v1/discounts/nearby

**Descripción**: Recupera una lista de descuentos disponibles en restaurantes y tiendas cercanas basados en los programas de lealtad del usuario y su ubicación actual.

**Cuerpo de la Solicitud**:
- `loyaltyPrograms`: `LoyaltyProgram[]` (Lista de programas de lealtad del usuario)
- `userLocation`: `UserLocation` (Ubicación actual del usuario)

**Respuesta**:
- **200 OK**: `{ discounts: Discount[] }` (Lista de descuentos aplicables)
- **400 Bad Request**: `{ error: string }` (Datos de solicitud no válidos)
- **401 Unauthorized**: `{ error: string }` (Se requiere autenticación del usuario)
- **500 Internal Server Error**: `{ error: string }` (Error inesperado del servidor)

**Autenticación**: Requerida (Token Bearer)

**Gating**: El usuario debe tener al menos un programa de lealtad válido.