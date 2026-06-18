# Mesa — Core Contract

## Core feature
Crear una **reserva online** validando disponibilidad del restaurante en un turno.

---

## TypeScript types

```ts
type ID = string;
type ISODateTime = string; // ISO 8601
type Email = string;

type ShiftStatus = "draft" | "open" | "closed";

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
  zone: string;
  created_at: ISODateTime;
}

export interface Shift {
  id: ID;
  restaurant_id: ID;
  name: string;
  start_time: ISODateTime;
  end_time: ISODateTime;
  status: ShiftStatus;
  created_at: ISODateTime;
}

export interface Reservation {
  id: ID;
  restaurant_id: ID;
  shift_id: ID;
  table_id?: ID | null;
  guest_name: string;
  guest_phone: string;
  guest_email: Email;
  reservation_at: ISODateTime;
  party_size: number;
  status: "pending" | "confirmed" | "cancelled";
  created_at: ISODateTime;
}
```

---

## Single most important endpoint

## `POST /public/restaurants/:restaurantId/reservations`

Crea una reserva para un comensal en un restaurante.

### Auth
- **Pública**
- Sin sesión obligatoria
- Rate-limited por IP + restaurante

### Gating / business rules
- El `restaurantId` debe existir
- Debe existir un `Shift` del restaurante con:
  - `status = "open"`
  - `reservation_at` dentro de `start_time <= reservation_at < end_time`
- `party_size >= 1`
- Debe haber mesa compatible disponible para esa hora/capacidad
- Si no hay disponibilidad, responder conflicto
- El restaurante puede deshabilitar reservas públicas a nivel de configuración futura

### Request

```ts
export interface CreateReservationRequest {
  guest_name: string;
  guest_phone: string;
  guest_email: Email;
  reservation_at: ISODateTime;
  party_size: number;
}
```

#### Example JSON
```json
{
  "guest_name": "Lucía Pérez",
  "guest_phone": "+34600111222",
  "guest_email": "lucia@example.com",
  "reservation_at": "2026-06-20T21:00:00Z",
  "party_size": 4
}
```

### Response

**201 Created**

```ts
export interface CreateReservationResponse {
  reservation: Reservation;
}
```

#### Example JSON
```json
{
  "reservation": {
    "id": "res_123",
    "restaurant_id": "rest_1",
    "shift_id": "shift_7",
    "table_id": "table_12",
    "guest_name": "Lucía Pérez",
    "guest_phone": "+34600111222",
    "guest_email": "lucia@example.com",
    "reservation_at": "2026-06-20T21:00:00Z",
    "party_size": 4,
    "status": "confirmed",
    "created_at": "2026-06-18T10:15:00Z"
  }
}
```

### Errors
- `400 Bad Request` — payload inválido
- `404 Not Found` — restaurante no existe
- `409 Conflict` — sin disponibilidad / turno no válido
- `429 Too Many Requests` — rate limit
