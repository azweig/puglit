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

type Store = {
  name: string;
  address: string;
  contact_email: string;
};

type UserLocation = {
  latitude: number;
  longitude: number;
  last_updated: Date;
};

type User = {
  id: string;
  loyaltyPrograms: LoyaltyProgram[];
  location: UserLocation;
};

// API Endpoint

/**
 * Get Discounts for User
 * Method: GET
 * Path: /api/discounts
 * Request: 
 *   Headers: 
 *     Authorization: Bearer <token>
 *   Query Parameters:
 *     latitude: float
 *     longitude: float
 * Response:
 *   Status: 200 OK
 *   Body: {
 *     discounts: {
 *       store: Store;
 *       discount: Discount;
 *     }[];
 *   }
 * Auth: Required
 * Gating: User must have at least one loyalty program linked
 */
```

This contract defines the core feature of the Descuentos Perú webapp, focusing on retrieving discounts based on the user's loyalty programs and current location. The endpoint requires authentication and checks that the user has linked at least one loyalty program to access the discounts.