```typescript
// TypeScript Types

type ItemCondition = 'new' | 'like new' | 'used' | 'for parts';

interface Item {
  id: number;
  title: string;
  description: string;
  image_url: string;
  condition: ItemCondition;
  owner_id: number;
}

interface Match {
  item_id: number;
  user_id: number;
  matched_at: string; // ISO 8601 format
  is_active: boolean;
}

interface ChatMessage {
  match_id: number;
  message: string;
  sent_at: string; // ISO 8601 format
  is_sender: boolean;
}

// API Endpoint for Core Feature: Create Match

/**
 * POST /api/matches
 * 
 * Request:
 * - Method: POST
 * - Path: /api/matches
 * - Auth: Required (Bearer Token)
 * - Body: 
 *   {
 *     item_id: number;
 *     user_id: number;
 *   }
 * 
 * Response:
 * - Status: 201 Created
 * - Body:
 *   {
 *     match: Match;
 *   }
 * 
 * Gating:
 * - User must be authenticated.
 * - User must not have an active match with the same item and user.
 */
```