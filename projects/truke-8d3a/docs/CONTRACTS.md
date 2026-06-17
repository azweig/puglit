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
  userId: number;
  matchedAt: string; // ISO 8601 format
  isActive: boolean;
}

interface ChatMessage {
  matchId: number;
  message: string;
  sentAt: string; // ISO 8601 format
  isSender: boolean;
}

// API Endpoint for Core Feature: Create a Match

/**
 * POST /api/matches
 * 
 * Request:
 * - Method: POST
 * - Path: /api/matches
 * - Auth: Required (Bearer Token)
 * - Gating: User must be authenticated
 * 
 * Request Body:
 * {
 *   itemId: number;
 *   userId: number;
 * }
 * 
 * Response:
 * - Status: 201 Created
 * - Body: Match
 * {
 *   itemId: number;
 *   userId: number;
 *   matchedAt: string; // ISO 8601 format
 *   isActive: boolean;
 * }
 */
```