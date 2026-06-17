# API Documentation

## Endpoint: `/api/v1/discounts`

### Method: GET

### Request Query Parameters
- **latitude**: `float` (required) - The latitude of the user's current location.
- **longitude**: `float` (required) - The longitude of the user's current location.
- **memberships**: `string[]` (required) - An array of membership IDs the user holds.

### Response
- **DiscountResponse**: An object containing an array of `Discount` objects.

### Authentication
- **Bearer Token**: Required for accessing the endpoint. The token must be valid and associated with a user account.

### Gating
- Users must have at least one valid membership ID to receive discount information.