# Truke Core Feature Contract

## TypeScript Types

```typescript
type Condition = 'new' | 'like new' | 'used' | 'for parts';

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
}

interface ChatMessage {
  matchId: number;
  message: string;
  sentAt: Date;
  senderId: number;
}
```

## API Endpoint: Create Match

- **Method**: POST
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
  - Status: 201 Created
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
- **Gating**: User must be authenticated and authorized to create a match. The item must belong to another user.