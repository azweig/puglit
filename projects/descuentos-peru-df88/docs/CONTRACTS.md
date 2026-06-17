```typescript
// TypeScript Types

type LoyaltyProgram = {
  name: string;
  provider: string;
  membership_id: string;
  is_active: boolean;
};

type Discount = {
  description: string;
  location: string;
  valid_until: Date;
  loyalty_program_id: number;
};

type UserLocation = {
  latitude: number;
  longitude: number;
  address: string;
  created_at: Date;
};

// API Endpoint

/**
 * Get Discounts Based on User Location and Active Loyalty Programs
 * 
 * Method: GET
 * Path: /api/discounts
 * Request Query Parameters:
 *  - latitude: float (required)
 *  - longitude: float (required)
 *  - membership_ids: string[] (optional, comma-separated list of active membership IDs)
 * 
 * Response: 
 *  - 200 OK
 *    Content-Type: application/json
 *    Body: {
 *      discounts: Discount[]
 *    }
 *  - 400 Bad Request
 *    Content-Type: application/json
 *    Body: {
 *      error: string
 *    }
 * 
 * Auth: Required (Bearer Token)
 * Gating: User must have at least one active loyalty program
 */
```