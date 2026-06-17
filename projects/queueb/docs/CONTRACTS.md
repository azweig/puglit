# QueueB Core Feature Contract

## TypeScript Types

```typescript
type Queue = {
  id: string;
  name: string;
  description: string;
  created_at: string; // ISO 8601 format
  is_active: boolean;
};

type Task = {
  id: string;
  queue_id: string;
  title: string;
  details: string;
  due_date: string; // ISO 8601 format
  status: 'pending' | 'in_progress' | 'completed';
};

type User = {
  id: string;
  email: string;
  full_name: string;
  joined_at: string; // ISO 8601 format
};
```

## API Endpoint

### Method: `POST`

### Path: `/api/queues/:queueId/tasks`

### Request

- **Headers**: 
  - `Authorization`: `Bearer <token>`

- **Path Parameters**:
  - `queueId`: `string` (The ID of the queue to which the task will be added)

- **Body**:
  ```json
  {
    "title": "string",
    "details": "string",
    "due_date": "string" // ISO 8601 format
  }
  ```

### Response

- **Status**: `201 Created`

- **Body**:
  ```json
  {
    "id": "string",
    "queue_id": "string",
    "title": "string",
    "details": "string",
    "due_date": "string", // ISO 8601 format
    "status": "pending"
  }
  ```

### Authentication

- **Type**: Bearer Token

### Gating

- **Access Control**: Only authenticated users can create tasks within a queue. The user must have permissions to access the specified queue.