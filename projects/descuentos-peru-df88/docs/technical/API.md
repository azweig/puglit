# API

## Endpoints

### Get Discounts Based on User Location and Active Loyalty Programs

- **Method**: GET
- **Path**: `/api/discounts`
- **Request Query Parameters**:
  - `latitude`: float (required)
  - `longitude`: float (required)
  - `membership_ids`: string[] (optional, comma-separated list of active membership IDs)

- **Response**:
  - **200 OK**
    - Content-Type: application/json
    - Body: `{ discounts: Discount[] }`
  - **400 Bad Request**
    - Content-Type: application/json
    - Body: `{ error: string }`

- **Auth**: Required (Bearer Token)
- **Gating**: User must have at least one active loyalty program

## Example Request
```
GET /api/discounts?latitude=-12.0464&longitude=-77.0428&membership_ids=123,456
Authorization: Bearer <token>
```

## Example Response
```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "discounts": [
    {
      "description": "10% off at Restaurant X",
      "location": "Lima, Peru",
      "valid_until": "2023-12-31",
      "loyalty_program_id": 1
    }
  ]
}
```
