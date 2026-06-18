# API de Mesa

## Endpoints

### `POST /public/restaurants/{restaurantId}/reservations`
Crea una reserva en línea para un comensal en un restaurante.

#### Autenticación
Endpoint **público**. No se requiere autenticación de usuario.

#### Solicitud
```ts
type PathParams = {
  restaurantId: ID;
};

type Body = CreateReservationRequest;
```

Ejemplo:
```json
{
  "shift_id": "shf_123",
  "guest_name": "Ana López",
  "guest_phone": "+34600111222",
  "guest_email": "ana@example.com",
  "party_size": 4,
  "reserved_at": "2026-06-20T21:00:00+02:00"
}
```

#### Respuesta
**201 Created**
```ts
type ResponseBody = CreateReservationResponse;
```

Ejemplo:
```json
{
  "reservation": {
    "id": "res_123",
    "restaurant_id": "rst_123",
    "shift_id": "shf_123",
    "table_id": "tbl_12",
    "guest_name": "Ana López",
    "guest_phone": "+34600111222",
    "guest_email": "ana@example.com",
    "party_size": 4,
    "reserved_at": "2026-06-20T21:00:00+02:00",
    "status": "confirmed",
    "created_at": "2026-06-18T10:00:00Z"
  }
}
```

#### Reglas de Negocio
- `restaurantId` debe existir.
- `shift_id` debe pertenecer a `restaurantId`.
- El turno debe estar `open`.
- `reserved_at` debe estar dentro de `[start_time, end_time]` en la zona horaria del restaurante.
- `party_size` debe ser `>= 1`.
- Solo mesas con `Table.is_active = true` son elegibles.
- Una mesa puede ser asignada solo si `capacity >= party_size`.
- La mesa asignada no debe estar ocupada por otra reserva no cancelada que se superponga en el mismo tiempo/turno.
- Si no hay mesa disponible, retornar `409 NO_AVAILABILITY`.
- En caso de éxito, la reserva se crea como `confirmed` con `table_id` asignado; si la asignación de mesa se difiere por política, permitir `table_id = null` y `status = "pending"`.

#### Respuestas de Error
- `400 VALIDATION_ERROR`
- `403 FORBIDDEN`
- `404 NOT_FOUND`
- `409 SHIFT_NOT_OPEN`
- `409 OUTSIDE_SHIFT_HOURS`
- `409 NO_AVAILABILITY`
- `409 CONFLICT`

---

## Notas
- `reserved_at`, `Shift.start_time`, y `Shift.end_time` deben almacenarse/transmitirse como datetimes ISO 8601.
- `Shift.service_date` es la fecha del calendario local del restaurante utilizada para operaciones/informes.
- La gestión de salones/turnos en el backoffice puede construirse alrededor de las mismas entidades, pero el endpoint de creación de reservas es el contrato público principal.