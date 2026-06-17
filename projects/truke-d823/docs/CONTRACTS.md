```typescript
// TypeScript Types

type Item = {
  id: number;
  title: string;
  description: string;
  image_url: string;
  created_at: string; // ISO 8601 format
  owner_id: number;
};

type Match = {
  id: number;
  item_id: number;
  matched_user_id: number;
  matched_at: string; // ISO 8601 format
};

type ChatMessage = {
  id: number;
  match_id: number;
  sender_id: number;
  message: string;
  sent_at: string; // ISO 8601 format
};

// API Endpoint

/**
 * POST /api/matches
 * 
 * Description: Create a new match between two users based on mutual interest in items.
 * 
 * Request Body:
 * - item_id: number (ID of the item the user is interested in)
 * - matched_user_id: number (ID of the user who owns the item)
 * 
 * Response:
 * - 201 Created
 *   - match: Match (The newly created match object)
 * 
 * Authentication: Required (Bearer Token)
 * Gating: Users can only create matches if they are authenticated and have not already matched on the same item with the same user.
 */
```