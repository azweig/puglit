# Truke Core Feature Contract

## TypeScript Types

```typescript
type ItemCondition = 'new' | 'like_new' | 'used' | 'for_parts';

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
  isActive: boolean;
}

interface ChatMessage {
  matchId: number;
  message: string;
  sentAt: Date;
  isSender: boolean;
}
```

## API Endpoint

### Create Match

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
      "matchId": number,
      "itemId": number,
      "userId": number,
      "matchedAt": string,
      "isActive": boolean
    }
    ```
- **Auth**: Required
- **Gating**: User must be authenticated and authorized to interact with the specified item.