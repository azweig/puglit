```typescript
// TypeScript Types

type Match = {
  date_time: string; // ISO 8601 format
  team_home: string;
  team_away: string;
  score_home: number;
  score_away: number;
};

type Tournament = {
  name: string;
  start_date: string; // ISO 8601 format
  end_date: string; // ISO 8601 format
  current_round: number;
};

type Standings = {
  tournament_id: number;
  team_name: string;
  points: number;
  matches_played: number;
};

type Scorer = {
  tournament_id: number;
  player_name: string;
  goals: number;
};

// API Endpoint

/**
 * Get Live Matches
 * Method: GET
 * Path: /api/live-matches
 * Request: 
 *   - Query Parameters: 
 *     - date (optional): string (ISO 8601 format) to filter matches by date
 * Response:
 *   - 200 OK: Array of Match
 *   - 401 Unauthorized: If authentication fails
 * Authentication: Required (API Key)
 * Gating: Rate limiting to prevent abuse
 */

interface LiveMatchesRequest {
  date?: string; // Optional date filter in ISO 8601 format
}

interface LiveMatchesResponse {
  matches: Match[];
}
```

- **Method**: `GET`
- **Path**: `/api/live-matches`
- **Request**: Optional query parameter `date` to filter matches by a specific date.
- **Response**: Returns an array of `Match` objects.
- **Auth**: Requires an API Key for authentication.
- **Gating**: Implement rate limiting to manage API usage and prevent abuse.