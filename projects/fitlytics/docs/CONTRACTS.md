```typescript
// TypeScript Types

type MemberStatus = 'active' | 'inactive' | 'cancelled';

interface Member {
  id: number;
  name: string;
  email: string;
  join_date: string; // ISO 8601 date format
  status: MemberStatus;
}

interface Report {
  id: number;
  title: string;
  generated_date: string; // ISO 8601 datetime format
  data: string; // JSON stringified data
}

interface Prediction {
  id: number;
  member_id: number;
  predicted_date: string; // ISO 8601 date format
  likelihood: number; // Probability between 0 and 1
}

// API Endpoint

/**
 * GET /api/v1/members/:id/predictions
 * 
 * Description: Retrieve predictions for a specific gym member.
 * 
 * Method: GET
 * Path: /api/v1/members/:id/predictions
 * 
 * Request:
 * - Path Parameters:
 *   - id: number (Member ID)
 * 
 * Response:
 * - Status: 200 OK
 * - Body: Array of Prediction objects
 * 
 * Authentication: Required (Bearer Token)
 * Gating: User must have 'view_predictions' permission
 */
```