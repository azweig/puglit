# API de Mesa

## Endpoint Principal
### `POST /v1/restaurants/{restaurantId}/reservations`
Crea una reserva para un restaurante si hay disponibilidad.

#### Autenticación
- **Público** para comensales: no requiere autenticación obligatoria.
- Soporta sesión de usuario opcional.

#### Reglas de Negocio
- El restaurante debe existir.
- `party_size` debe ser al menos 1.
- `reserved_at` debe ser una fecha futura.
- Debe estar dentro de `opening_hours`.
- Debe haber un `Shift` activo que cubra `reserved_at`.
- Deben existir mesas suficientes con `status = "available"`.
- Responde con conflicto si no hay disponibilidad.
- Idempotencia recomendada vía header `Idempotency-Key`.

#### Solicitud
```ts
export interface CreateReservationRequest {
  customer_name: string;
  customer_phone: string;
  party_size: number;
  reserved_at: ISODateTime;
}
```

##### Ejemplo
```json
{
  "customer_name": "Ana García",
  "customer_phone": "+34600111222",
  "party_size": 4,
  "reserved_at": "2026-06-20T21:00:00Z"
}
```

#### Respuesta
##### `201 Created`
```ts
export interface CreateReservationResponse {
  reservation: Reservation;
  assigned_shift: Shift;
  assigned_tables: Table[];
}
```

##### Ejemplo
```json
{
  "reservation": {
    "id": "res_123",
    "restaurant_id": "rest_1",
    "customer_name": "Ana García",
    "customer_phone": "+34600111222",
    "party_size": 4,
    "reserved_at": "2026-06-20T21:00:00Z",
    "shift_id": "shift_9",
    "table_ids": ["table_12"],
    "status": "confirmed",
    "created_at": "2026-06-18T10:15:00Z"
  },
  "assigned_shift": {
    "id": "shift_9",
    "restaurant_id": "rest_1",
    "name": "Cena",
    "start_time": "2026-06-20T19:00:00Z",
    "end_time": "2026-06-20T23:00:00Z",
    "is_active": true,
    "created_at": "2026-06-01T09:00:00Z"
  },
  "assigned_tables": [
    {
      "id": "table_12",
      "restaurant_id": "rest_1",
      "name": "Mesa 12",
      "capacity": 4,
      "status": "available",
      "created_at": "2026-06-01T09:00:00Z"
    }
  ]
}
```

#### Errores
- `400 Bad Request`: Datos inválidos.
- `404 Not Found`: Restaurante no existe.
- `409 Conflict`: Sin disponibilidad para ese turno/horario.
- `422 Unprocessable Entity`: Fuera de horario o sin turno activo.