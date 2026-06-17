# Truke Core Feature Contract

## TypeScript Types

```typescript
type Item = {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  createdAt: string; // ISO 8601 format
};

type Match = {
  itemId: number;
  userId: number;
  matchedAt: string; // ISO 8601 format
};

type ChatMessage = {
  matchId: number;
  message: string;
  sentAt: string; // ISO 8601 format
};

type User = {
  id: number;
  username: string;
  // other user-related fields
};
```

## API Endpoint: Create Match

- **Method**: `POST`
- **Path**: `/api/matches`
- **Request**:
  - Headers: 
    - `Authorization`: `Bearer <token>`
  - Body:
    ```json
    {
      "itemId": number,
      "userId": number
    }
    ```
- **Response**:
  - Status: `201 Created`
  - Body:
    ```json
    {
      "match": {
        "itemId": number,
        "userId": number,
        "matchedAt": string
      }
    }
    ```
- **Auth**: Required (Bearer Token)
- **Gating**: User must be authenticated and authorized to create a match. Both users must have swiped right on each other's items for a match to be created.