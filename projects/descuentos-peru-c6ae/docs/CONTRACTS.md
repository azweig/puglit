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

type DiscountResponse = {
  discounts: Discount[];
};

// API Endpoint

/**
 * POST /api/v1/discounts/nearby
 * 
 * Description: Fetches discounts available at nearby stores and restaurants based on the user's loyalty programs and current location.
 * 
 * Request Body:
 * - user_id: string (The unique identifier for the user)
 * - location: UserLocation (The current location of the user)
 * 
 * Response:
 * - 200 OK: DiscountResponse (A list of discounts available at nearby locations)
 * - 400 Bad Request: { error: string } (If the request data is invalid)
 * - 401 Unauthorized: { error: string } (If the user is not authenticated)
 * 
 * Authentication: Required (Bearer Token)
 * Gating: User must have at least one active loyalty program
 */

interface FetchNearbyDiscountsRequest {
  user_id: string;
  location: UserLocation;
}

interface FetchNearbyDiscountsResponse {
  discounts: Discount[];
}
```

- **Method**: POST
- **Path**: `/api/v1/discounts/nearby`
- **Request**: `FetchNearbyDiscountsRequest`
- **Response**: `FetchNearbyDiscountsResponse`
- **Auth**: Bearer Token
- **Gating**: User must have at least one active loyalty program.