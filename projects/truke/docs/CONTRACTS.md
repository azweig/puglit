```typescript
// TypeScript Types

type Item = {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  location: string;
  isAvailable: boolean;
};

type Match = {
  id: number;
  itemId: number;
  userId1: number;
  userId2: number;
  matchDate: Date;
};

type ChatMessage = {
  matchId: number;
  senderId: number;
  message: string;
  timestamp: Date;
};

type User = {
  id: number;
  username: string;
  email: string;
  profilePicture: string;
  city: string;
};

// API Endpoint for Core Feature: Creating a Match

/**
 * POST /api/matches
 * 
 * Request:
 * - Method: POST
 * - Path: /api/matches
 * - Auth: Required (Bearer Token)
 * - Body: {
 *     itemId: number;
 *     userId: number; // The user initiating the match
 *   }
 * 
 * Response:
 * - Status: 201 Created
 * - Body: {
 *     matchId: number;
 *     itemId: number;
 *     userId1: number;
 *     userId2: number;
 *     matchDate: Date;
 *   }
 * 
 * Gating:
 * - User must be authenticated.
 * - The item must be available.
 * - The user cannot match with their own item.
 */
```