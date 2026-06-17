```typescript
// TypeScript Types

type LoyaltyProgram = {
  name: string;
  provider: string;
  membership_number: string;
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

type UserDiscountsRequest = {
  loyaltyPrograms: LoyaltyProgram[];
  userLocation: UserLocation;
};

type UserDiscountsResponse = {
  discounts: Discount[];
};

// API Endpoint

/**
 * Get User Discounts
 * Method: POST
 * Path: /api/v1/user-discounts
 * Request Body: UserDiscountsRequest
 * Response: UserDiscountsResponse
 * Auth: Required (Bearer Token)
 * Gating: User must have at least one valid loyalty program
 */
```
