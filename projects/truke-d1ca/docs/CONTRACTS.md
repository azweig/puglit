```typescript
// TypeScript Types

type Item = {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  location: string;
  createdAt: Date;
};

type Match = {
  itemId: number;
  userId: number;
  matchedAt: Date;
  isActive: boolean;
};

type ChatMessage = {
  matchId: number;
  message: string;
  sentAt: Date;
  isRead: boolean;
};

type User = {
  id: number;
  username: string;
  email: string;
  createdAt: Date;
  profilePicture: string;
};

// API Endpoint for Core Feature: Match Creation

/**
 * POST /api/match
 * 
 * Request:
 * - Method: POST
 * - Path: /api/match
 * - Auth: Required (Bearer Token)
 * - Body: 
 *   {
 *     itemId: number;
 *     userId: number;
 *   }
 * 
 * Response:
 * - Status: 201 Created
 * - Body:
 *   {
 *     matchId: number;
 *     itemId: number;
 *     userId: number;
 *     matchedAt: Date;
 *     isActive: boolean;
 *   }
 * 
 * Gating: 
 * - User must be authenticated.
 * - User can only create a match if they have not already matched with the same item.
 */
```