# API Documentation

## Endpoints

### Get User Discounts
- **Method**: POST
- **Path**: `/api/v1/user-discounts`
- **Request Body**: `UserDiscountsRequest`
  ```typescript
  type UserDiscountsRequest = {
    loyaltyPrograms: LoyaltyProgram[];
    userLocation: UserLocation;
  };
  ```
- **Response**: `UserDiscountsResponse`
  ```typescript
  type UserDiscountsResponse = {
    discounts: Discount[];
  };
  ```
- **Auth**: Required (Bearer Token)
- **Gating**: User must have at least one valid loyalty program

## Request/Response Example

### Request
```json
{
  "loyaltyPrograms": [
    {"name": "BCP", "provider": "Banco de Crédito del Perú", "membership_number": "123456"}
  ],
  "userLocation": {
    "latitude": -12.0464,
    "longitude": -77.0428,
    "address": "Lima, Perú"
  }
}
```

### Response
```json
{
  "discounts": [
    {"description": "10% off at Restaurant X", "location": "Lima", "valid_until": "2023-12-31"}
  ]
}
```