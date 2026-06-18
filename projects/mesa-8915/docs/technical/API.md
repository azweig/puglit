# API de Mesa

## Endpoint Principal

### `POST /public/restaurants/:restaurantId/reservations`

Crea una reserva para un comensal en un restaurante.

#### Autenticación
- **Pública**
- Sin sesión obligatoria
- Rate-limited por IP + restaurante

#### Reglas de Negocio
- El `restaurantId` debe existir
- Debe existir un `Shift` del restaurante con:
  - `status = "open"`
  - `reservation_at` dentro de `start_time <= reservation_at < end_time`
- `party_size >= 1`
- Debe haber mesa compatible disponible para esa hora/capacidad
- Si no hay disponibilidad, responder conflicto

#### Solicitud

```ts
export interface CreateReservationRequest {
  guest_name: string;
  guest_phone: string;
  guest_email: Email;
  reservation_at: ISODateTime;
  party_size: number;
}
```

##### Ejemplo JSON
```json
{
  "guest_name": "Lucía Pérez",
  "guest_phone": "+34600111222",
  "guest_email": "lucia@example.com",
  "reservation_at": "2026-06-20T21:00:00Z",
  "party_size": 4
}
```

#### Respuesta

**201 Created**

```ts
export interface CreateReservationResponse {
  reservation: Reservation;
}
```

##### Ejemplo JSON
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

#### Errores
- `400 Bad Request` — payload inválido
- `404 Not Found` — restaurante no existe
- `409 Conflict` — sin disponibilidad / turno no válido
- `429 Too Many Requests` — rate limit

Este endpoint es crucial para la funcionalidad principal de la aplicación, permitiendo a los comensales realizar reservas en línea.