```typescript
// TypeScript Types

type LoyaltyProgram = {
  program_name: string;
  provider: string;
  membership_id: string;
  expiration_date: Date;
};

type Discount = {
  store_name: string;
  discount_percentage: number;
  valid_until: Date;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
};

type UserLocation = {
  latitude: number;
  longitude: number;
  address: string;
};

type User = {
  user_id: string;
  loyalty_programs: LoyaltyProgram[];
  location: UserLocation;
};

// API Endpoint

/**
 * Get Discounts
 * Method: GET
 * Path: /api/discounts
 * Request: 
 *   Headers: 
 *     Authorization: Bearer <token>
 *   Query Parameters:
 *     latitude: float (required)
 *     longitude: float (required)
 * Response:
 *   Status: 200 OK
 *   Body: {
 *     discounts: Discount[]
 *   }
 * Auth: Required (Bearer Token)
 * Gating: User must have at least one valid loyalty program
 */
```

This contract defines the core feature of the Descuentos Perú webapp, focusing on retrieving discounts based on the user's location and loyalty programs. The endpoint requires authentication and checks that the user has at least one valid loyalty program to access the discounts.