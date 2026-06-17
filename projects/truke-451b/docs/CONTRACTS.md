```typescript
// TypeScript Types

type ItemCondition = 'new' | 'like new' | 'good' | 'fair' | 'poor';

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
  userId: number;
  matchedAt: Date;
}

interface ChatMessage {
  matchId: number;
  message: string;
  sentAt: Date;
  senderId: number;
}

// API Endpoint for Core Feature: Match and Chat

/**
 * POST /api/match
 * Description: Create a match between two users based on mutual interest in items.
 * Request Body: 
 *  - itemId: number (ID of the item the user is interested in)
 *  - userId: number (ID of the user who owns the item)
 * Response:
 *  - 201 Created
 *  - Body: Match (The created match object)
 * Authentication: Required (User must be logged in)
 * Gating: User can only match if they have not already matched with the same item and user.
 */
```