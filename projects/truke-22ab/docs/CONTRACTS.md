```typescript
// TypeScript Types

type Item = {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  location: string;
  ownerId: number;
};

type Match = {
  id: number;
  itemId: number;
  matchedUserId: number;
  matchDate: Date;
};

type ChatMessage = {
  matchId: number;
  senderId: number;
  message: string;
  timestamp: Date;
};

// API Endpoint for Core Feature: Create a Match

/**
 * POST /api/match
 * 
 * Request Body:
 * {
 *   itemId: number;
 *   matchedUserId: number;
 * }
 * 
 * Response:
 * {
 *   matchId: number;
 *   itemId: number;
 *   matchedUserId: number;
 *   matchDate: Date;
 * }
 * 
 * Authentication: Required (User must be logged in)
 * Gating: User can only create a match if they have swiped right on the item and the item owner has swiped right on their item.
 */

interface CreateMatchRequest {
  itemId: number;
  matchedUserId: number;
}

interface CreateMatchResponse {
  matchId: number;
  itemId: number;
  matchedUserId: number;
  matchDate: Date;
}
```

- **Method**: POST
- **Path**: /api/match
- **Request**: `CreateMatchRequest`
- **Response**: `CreateMatchResponse`
- **Auth**: Required (User must be logged in)
- **Gating**: Mutual swipe right required for match creation.