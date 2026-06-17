# API Documentation

## Get Discounts for User

### Endpoint
- **Method**: GET
- **Path**: `/api/discounts`

### Request
- **Headers**:
  - `Authorization`: Bearer `<token>`
- **Query Parameters**:
  - `latitude`: float (required)
  - `longitude`: float (required)

### Response
- **200 OK**: Returns `DiscountResponse`
  ```json
  {
    "discounts": [
      {
        "description": "10% off at Starbucks",
        "amount": 10.0,
        "valid_until": "2023-12-31",
        "location": "Lima"
      }
    ]
  }
  ```
- **401 Unauthorized**: 
  ```json
  { "error": "Invalid token" }
  ```
- **400 Bad Request**: 
  ```json
  { "error": "Missing latitude or longitude" }
  ```

### Auth
- **Required**: Bearer Token

### Gating
- User must have at least one valid `LoyaltyProgram`.