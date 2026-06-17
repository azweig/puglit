```typescript
// TypeScript Types

type LoyaltyProgram = {
  name: string;
  provider: string;
  membership_number: string;
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
  updated_at: Date;
};

// API Endpoint

/**
 * POST /api/v1/discounts/nearby
 * 
 * Description: Retrieves a list of discounts available at nearby restaurants and stores based on the user's loyalty programs and current location.
 * 
 * Request Body:
 * - loyaltyPrograms: LoyaltyProgram[] (List of user's loyalty programs)
 * - userLocation: UserLocation (Current location of the user)
 * 
 * Response:
 * - 200 OK: { discounts: Discount[] } (List of applicable discounts)
 * - 400 Bad Request: { error: string } (Invalid request data)
 * - 401 Unauthorized: { error: string } (User authentication required)
 * - 500 Internal Server Error: { error: string } (Unexpected server error)
 * 
 * Authentication: Required (Bearer Token)
 * Gating: User must have at least one valid loyalty program
 */
```