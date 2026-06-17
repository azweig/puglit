```typescript
// TypeScript Types

type LoyaltyProgram = {
  name: string;
  provider: string;
  membership_id: string;
  expiration_date: Date;
};

type Discount = {
  description: string;
  percentage: number;
  valid_until: Date;
  location: string;
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
 *   - memberships: string[] (optional, array of membership_ids)
 * Response: DiscountResponse
 * Auth: Required (Bearer Token)
 * Gating: User must have at least one valid membership in the system
 */

```

This contract defines the core feature of the Descuentos Perú webapp, which is to provide users with discounts based on their loyalty programs and current location. The endpoint `/api/v1/discounts` is designed to return relevant discounts for a user, filtered by their location and optional membership IDs. Authentication is required to access this endpoint, ensuring that only authorized users can retrieve personalized discount information.