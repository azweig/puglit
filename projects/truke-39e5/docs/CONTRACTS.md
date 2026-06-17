```typescript
// TypeScript Types

type ItemCondition = 'new' | 'like new' | 'used' | 'for parts';

interface Item {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  condition: ItemCondition;
  ownerId: number;
}

interface Match {
  itemId: number;
  matchedUserId: number;
  matchDate: string; // ISO 8601 format
}

interface ChatMessage {
  matchId: number;
  message: string;
  sentAt: string; // ISO 8601 format
  isSenderUser: boolean;
}

// API Endpoint for Core Feature

/**
 * POST /api/match
 * 
 * Description: Create a match between two users if both have shown interest in each other's items.
 * 
 * Request Body:
 * - itemId: number (ID of the item the current user is interested in)
 * - matchedUserId: number (ID of the user who owns the item)
 * 
 * Response:
 * - 201 Created
 *   - match: Match (Details of the created match)
 * - 400 Bad Request
 *   - error: string (Description of the error)
 * - 401 Unauthorized
 *   - error: string (Description of the error)
 * 
 * Authentication: Required (Bearer Token)
 * Gating: User must be authenticated and authorized to create a match.
 */
```