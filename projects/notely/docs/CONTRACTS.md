```typescript
// TypeScript Types

type Note = {
  id: number;
  title: string;
  body: string;
  created_at: string; // ISO 8601 format
  updated_at: string; // ISO 8601 format
};

type Reminder = {
  id: number;
  note_id: number;
  reminder_time: string; // ISO 8601 format
  is_completed: boolean;
};

type Tag = {
  id: number;
  name: string;
  color: string; // Hex color code
};

type CreateNoteRequest = {
  title: string;
  body: string;
  tags?: Tag[];
  reminder?: Omit<Reminder, 'id' | 'is_completed'>;
};

type CreateNoteResponse = {
  note: Note;
  tags: Tag[];
  reminder?: Reminder;
};

// API Endpoint

/**
 * Create a new note with optional tags and a reminder.
 * 
 * Method: POST
 * Path: /api/notes
 * Request: CreateNoteRequest
 * Response: CreateNoteResponse
 * Auth: Required (Bearer Token)
 * Gating: User must have an active account
 */
```
