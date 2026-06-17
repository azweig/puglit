```typescript
// TypeScript Types

type Condition = 'new' | 'like new' | 'used' | 'heavily used';

interface Item {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  condition: Condition;
  ownerId: number;
}

interface Match {
  itemId: number;
  userId: number;
  matchedAt: Date;
  isActive: boolean;
}

interface ChatMessage {
  matchId: number;
  message: string;
  sentAt: Date;
  senderId: number;
}

// API Endpoint for Core Feature: Matching Items

/**
 * POST /api/match
 * 
 * Request Body:
 * - itemId: number (ID of the item the user is interested in)
 * - userId: number (ID of the user making the request)
 * 
 * Response:
 * - 200 OK
 *   - match: Match (Details of the match if successful)
 * - 400 Bad Request
 *   - error: string (Description of the error)
 * 
 * Authentication:
 * - Required: Bearer Token
 * 
 * Gating:
 * - User must be authenticated.
 * - User must not be the owner of the item.
 * - Item must be available for matching.
 */
```