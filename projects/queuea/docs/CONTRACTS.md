# QueueA Core Feature Contract

## TypeScript Types

```typescript
type Queue = {
  id: number;
  name: string;
  description: string;
  created_at: string; // ISO 8601 format
};

type Task = {
  id: number;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
  due_date: string; // YYYY-MM-DD format
  queue_id: number;
};

type User = {
  id: number;
  email: string;
  password_hash: string;
  created_at: string; // ISO 8601 format
};

type CreateQueueRequest = {
  name: string;
  description: string;
};

type CreateQueueResponse = {
  success: boolean;
  queue?: Queue;
  error?: string;
};
```

## API Endpoint

### Create Queue

- **Method**: POST
- **Path**: `/api/queues`
- **Request**: `CreateQueueRequest`
- **Response**: `CreateQueueResponse`
- **Auth**: Required (Bearer Token)
- **Gating**: User must be authenticated

This endpoint allows an authenticated user to create a new queue by providing a name and description. The response will indicate success and return the created queue object or an error message if the operation fails.