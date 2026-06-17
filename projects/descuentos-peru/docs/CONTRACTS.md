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
  amount: number;
  valid_until: Date;
  location: string;
};

type UserLocation = {
  latitude: number;
  longitude: number;
  address: string;
};

type User = {
  id: string;
  loyaltyPrograms: LoyaltyProgram[];
  location: UserLocation;
};

type DiscountResponse = {
  discounts: Discount[];
};

// API Endpoint

/**
 * Get Discounts for User
 * Method: GET
 * Path: /api/discounts
 * Request: 
 *   - Headers: 
 *       Authorization: Bearer <token>
 *   - Query Parameters:
 *       latitude: float (required)
 *       longitude: float (required)
 * Response: 
 *   - 200 OK: DiscountResponse
 *   - 401 Unauthorized: { error: string }
 *   - 400 Bad Request: { error: string }
 * Auth: Required (Bearer Token)
 * Gating: User must have at least one valid LoyaltyProgram
 */
```
