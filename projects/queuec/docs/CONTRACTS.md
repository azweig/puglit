# QueueC Core Feature Contract

## TypeScript Types

```typescript
type QueueStatus = 'active' | 'inactive';

interface Queue {
  queue_name: string;
  created_at: Date;
  status: QueueStatus;
}

type TaskPriority = 'low' | 'medium' | 'high';

interface Task {
  task_name: string;
  description: string;
  due_date: Date;
  priority: TaskPriority;
}

interface User {
  email: string;
  full_name: string;
  joined_at: Date;
}
```

## API Endpoint

### Create a New Queue

- **Method**: POST
- **Path**: `/api/queues`
- **Request**:
  - Headers: 
    - `Content-Type: application/json`
    - `Authorization: Bearer <token>`
  - Body:
    ```json
    {
      "queue_name": "string",
      "status": "active" | "inactive"
    }
    ```
- **Response**:
  - Status: 201 Created
  - Body:
    ```json
    {
      "queue_name": "string",
      "created_at": "string (ISO 8601 datetime)",
      "status": "active" | "inactive"
    }
    ```
- **Auth**: Required (Bearer Token)
- **Gating**: User must be authenticated and authorized to create queues.