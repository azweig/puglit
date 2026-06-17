```typescript
// TypeScript Types

type URL = string;
type DateTime = string; // ISO 8601 format
type Text = string;
type EnumSize = 'small' | 'medium' | 'large';

interface Link {
  original_url: URL;
  shortened_url: URL;
  created_at: DateTime;
  click_count: number;
}

interface Click {
  link_id: number;
  clicked_at: DateTime;
  referrer: Text;
  user_agent: Text;
}

interface QRCode {
  link_id: number;
  generated_at: DateTime;
  size: EnumSize;
}

// API Endpoint for Core Feature: Create Shortened URL

/**
 * Method: POST
 * Path: /api/links
 * Auth: Required (Bearer Token)
 * Gating: Rate limiting per user
 * 
 * Request Body:
 * {
 *   "original_url": URL
 * }
 * 
 * Response:
 * 201 Created
 * {
 *   "link": Link
 * }
 * 
 * 400 Bad Request
 * {
 *   "error": "Invalid URL format"
 * }
 * 
 * 401 Unauthorized
 * {
 *   "error": "Authentication required"
 * }
 * 
 * 429 Too Many Requests
 * {
 *   "error": "Rate limit exceeded"
 * }
 */
```