```typescript
// TypeScript Types

type Match = {
  id: number;
  date: Date;
  team_home: string;
  team_away: string;
  score_home: number;
  score_away: number;
};

type Tournament = {
  id: number;
  name: string;
  start_date: Date;
  end_date: Date;
  current_round: number;
};

type Standings = {
  tournament_id: number;
  team_name: string;
  points: number;
  matches_played: number;
};

type GoalScorer = {
  match_id: number;
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
 *     - date (optional): string (ISO 8601 format) - Filter matches by date
 * Response: 
 *   - 200 OK: Array of Match
 *   - 401 Unauthorized: If authentication fails
 *   - 500 Internal Server Error: If there is a server-side issue
 * Auth: Required (Bearer Token)
 * Gating: Rate limiting to prevent abuse
 */

interface GetLiveMatchesRequest {
  date?: string; // ISO 8601 format
}

interface GetLiveMatchesResponse {
  matches: Match[];
}
```

- **Method**: `GET`
- **Path**: `/api/live-matches`
- **Request**: Optional query parameter `date` to filter matches by a specific day.
- **Response**: Returns an array of `Match` objects.
- **Auth**: Requires Bearer Token for authentication.
- **Gating**: Implements rate limiting to prevent abuse and ensure fair usage.