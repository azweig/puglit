```typescript
// TypeScript Types

type LoyaltyProgram = {
  name: string;
  provider: string;
  membership_id: string;
};

type Discount = {
  description: string;
  location: string;
  valid_until: Date;
};

type UserLocation = {
  latitude: number;
  longitude: number;
  address: string;
};

type DiscountResponse = {
  discounts: Discount[];
};

// API Endpoint

/**
 * Method: GET
 * Path: /api/v1/discounts
 * Request Query Parameters:
 *   - latitude: float (required)
 *   - longitude: float (required)
 *   - memberships: string[] (required) - Array of membership IDs
 * Response: DiscountResponse
 * Auth: Required (Bearer Token)
 * Gating: User must have at least one valid membership ID
 */

```

This contract defines the core feature of the "Descuentos Perú" web application, which is to provide users with discounts based on their loyalty programs and current location. The endpoint `/api/v1/discounts` requires authentication and checks for valid membership IDs to return relevant discounts.