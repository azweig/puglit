```typescript
// TypeScript Types

type Condition = 'new' | 'like new' | 'used' | 'worn';

interface Item {
  id: number;
  title: string;
  description: string;
  image_url: string;
  condition: Condition;
  owner_id: number;
}

interface Match {
  item_id: number;
  user_id: number;
  matched_at: string; // ISO 8601 format
}

interface ChatMessage {
  match_id: number;
  message: string;
  sent_at: string; // ISO 8601 format
  sender_id: number;
}

// API Endpoint for Core Feature: Matching Items

/**
 * POST /api/match
 * 
 * Method: POST
 * Path: /api/match
 * Request Body: 
 * {
 *   item_id: number;
 *   user_id: number;
 * }
 * 
 * Response:
 * 201 Created
 * {
 *   match: Match;
 * }
 * 
 * Authentication: Required (Bearer Token)
 * Gating: User must be authenticated and authorized to interact with the item.
 */
```