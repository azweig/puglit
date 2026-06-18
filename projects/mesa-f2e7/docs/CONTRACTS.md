# Mesa — Core Contract

## Core feature
**Crear una reserva online** validando disponibilidad del restaurante/turno.

---

## TypeScript types

```ts
type ID = string;
type ISODateTime = string;

type TableStatus = "available" | "occupied" | "blocked";

export interface Restaurant {
  id: ID;
  name: string;
  phone: string;
  address: string;
  opening_hours: Record<string, unknown>;
  created_at: ISODateTime;
}

export interface Table {
  id: ID;
  restaurant_id: ID;
  name: string;
  capacity: number;
  status: TableStatus;
  created_at: ISODateTime;
}

export interface Shift {
  id: ID;
  restaurant_id: ID;
  name: string;
  start_time: ISODateTime;
  end_time: ISODateTime;
  is_active: boolean;
  created_at: ISODateTime;
}

export interface Reservation {
  id: ID;
  restaurant_id: ID;
  customer_name: string;
  customer_phone: string;
  party_size: number;
  reserved_at: ISODateTime;
  shift_id: ID | null;
  table_ids: ID[];
  status: "pending" | "confirmed" | "cancelled";
  created_at: ISODateTime;
}
```

---

## Single most important endpoint

## `POST /v1/restaurants/{restaurantId}/reservations`

Crea una reserva para un restaurante si existe disponibilidad para el horario solicitado.

### Auth
- **Público** para comensal: sin autenticación obligatoria.
- Opcionalmente soporta sesión de usuario si existe.

### Gating / business rules
- Restaurante debe existir.
- `party_size >= 1`.
- `reserved_at` debe ser fecha futura.
- Debe caer dentro de `opening_hours`.
- Debe existir un `Shift` activo que cubra `reserved_at`.
- Debe haber mesa(s) con capacidad suficiente y `status = "available"`.
- Si no hay disponibilidad, responde conflicto.
- Idempotencia recomendada vía header `Idempotency-Key`.

### Request

```ts
export interface CreateReservationRequest {
  customer_name: string;
  customer_phone: string;
  party_size: number;
  reserved_at: ISODateTime;
}
```

#### Example
```json
{
  "customer_name": "Ana García",
  "customer_phone": "+34600111222",
  "party_size": 4,
  "reserved_at": "2026-06-20T21:00:00Z"
}
```

### Response

#### `201 Created`
```ts
export interface CreateReservationResponse {
  reservation: Reservation;
  assigned_shift: Shift;
  assigned_tables: Table[];
}
```

#### Example
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

### Errors
- `400 Bad Request` — datos inválidos.
- `404 Not Found` — restaurante no existe.
- `409 Conflict` — sin disponibilidad para ese turno/horario.
- `422 Unprocessable Entity` — fuera de horario o sin turno activo.

---

## Notes
- La gestión interna del salón y turnos puede usar CRUD separado para `Table` y `Shift`, pero el **core contractual** es la creación de reserva con asignación de turno/mesa.