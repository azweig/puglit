# Truke Core Feature Contract

## TypeScript Types

```typescript
type Condition = 'new' | 'like new' | 'used' | 'for parts';

interface Item {
  title: string;
  description: string;
  condition: Condition;
  location: string;
  image_url: string;
}

interface Match {
  item_id: number;
  user_id: number;
  matched_at: Date;
  is_active: boolean;
}

interface Chat {
  match_id: number;
  message: string;
  sent_at: Date;
  is_read: boolean;
}

interface User {
  username: string;
  email: string;
  profile_picture: string;
  created_at: Date;
}
```

## API Endpoint for Core Feature

### Method: POST

- **Path:** `/api/match`

- **Request:**
  - **Headers:**
    - `Authorization: Bearer <token>`
  - **Body:**
    ```json
    {
      "item_id": number,
      "user_id": number
    }
    ```

- **Response:**
  - **Status 200:**
    ```json
    {
      "match_id": number,
      "matched_at": string,
      "is_active": boolean
    }
    ```
  - **Status 400:**
    ```json
    {
      "error": "Invalid request data"
    }
    ```
  - **Status 401:**
    ```json
    {
      "error": "Unauthorized"
    }
    ```

- **Auth:** Required (Bearer Token)

- **Gating:** User must be authenticated and authorized to interact with the item. Both users must have swiped right on each other's items to create a match.