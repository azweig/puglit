# Mesa — Core Contract

## Core feature
**Create a reservation online for a restaurant during an active shift, assigning a table if capacity/availability allows.**

---

## TypeScript types

```ts
type ID = string;
type ISODate = string; // YYYY-MM-DD
type ISODateTime = string; // ISO 8601
type E164Phone = string;
type Email = string;

type ShiftStatus = "draft" | "open" | "closed" | "cancelled";

interface Restaurant {
  id: ID;
  name: string;
  phone: E164Phone;
  address: string;
  timezone: string; // IANA TZ, e.g. "Europe/Madrid"
  created_at: ISODateTime;
}

interface Table {
  id: ID;
  restaurant_id: ID;
  label: string;
  capacity: number;
  area: string;
  is_active: boolean;
  created_at: ISODateTime;
}

interface Shift {
  id: ID;
  restaurant_id: ID;
  name: string;
  service_date: ISODate; // local to restaurant timezone
  start_time: ISODateTime;
  end_time: ISODateTime;
  status: ShiftStatus;
  created_at: ISODateTime;
}

type ReservationStatus =
  | "pending"
  | "confirmed"
  | "seated"
  | "completed"
  | "cancelled"
  | "no_show";

interface Reservation {
  id: ID;
  restaurant_id: ID;
  shift_id: ID;
  table_id: ID | null;
  guest_name: string;
  guest_phone: E164Phone;
  guest_email: Email;
  party_size: number;
  reserved_at: ISODateTime;
  status: ReservationStatus;
  created_at: ISODateTime;
}

interface CreateReservationRequest {
  shift_id: ID;
  guest_name: string;
  guest_phone: E164Phone;
  guest_email: Email;
  party_size: number;
  reserved_at: ISODateTime;
}

interface CreateReservationResponse {
  reservation: Reservation;
}

interface ErrorResponse {
  error: {
    code:
      | "UNAUTHORIZED"
      | "FORBIDDEN"
      | "NOT_FOUND"
      | "VALIDATION_ERROR"
      | "SHIFT_NOT_OPEN"
      | "OUTSIDE_SHIFT_HOURS"
      | "NO_AVAILABILITY"
      | "CONFLICT";
    message: string;
    details?: Record<string, unknown>;
  };
}
```

---

## Single most important endpoint

## `POST /public/restaurants/{restaurantId}/reservations`

Creates an online reservation for a guest in a restaurant.

### Auth
**Public** endpoint. No user auth required.

### Request
```ts
type PathParams = {
  restaurantId: ID;
};

type Body = CreateReservationRequest;
```

Example:
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

### Response
**201 Created**
```ts
type ResponseBody = CreateReservationResponse;
```

Example:
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

### Gating / business rules
- `restaurantId` must exist.
- `shift_id` must belong to `restaurantId`.
- Shift must be `open`.
- `reserved_at` must fall within `[start_time, end_time]` in the restaurant timezone.
- `party_size` must be `>= 1`.
- Only `Table.is_active = true` tables are eligible.
- A table may be assigned only if `capacity >= party_size`.
- Assigned table must not already be occupied by another non-cancelled reservation overlapping the same time/turn.
- If no table is available, return `409 NO_AVAILABILITY`.
- On success, reservation is created as `confirmed` with assigned `table_id`; if table assignment is deferred by policy, allow `table_id = null` and `status = "pending"`.

### Error responses
- `400 VALIDATION_ERROR`
- `403 FORBIDDEN`
- `404 NOT_FOUND`
- `409 SHIFT_NOT_OPEN`
- `409 OUTSIDE_SHIFT_HOURS`
- `409 NO_AVAILABILITY`
- `409 CONFLICT`

--- 

## Notes
- `reserved_at`, `Shift.start_time`, and `Shift.end_time` should be stored/transmitted as ISO 8601 datetimes.
- `Shift.service_date` is the restaurant-local calendar date used for operations/reporting.
- Backoffice salon/turno management can be built around the same entities, but the reservation-creation endpoint is the core public contract.