```typescript
// TypeScript Types

type Match = {
  date: Date;
  team_home: string;
  team_away: string;
  score_home: number;
  score_away: number;
};

type Tournament = {
  name: string;
  season: string;
  start_date: Date;
  end_date: Date;
};

type Standings = {
  tournament_id: number;
  team_name: string;
  points: number;
  matches_played: number;
};

type GoalScorer = {
  player_name: string;
  team_name: string;
  goals: number;
  tournament_id: number;
};

// API Endpoint

/**
 * Get Live Matches
 * Method: GET
 * Path: /api/live-matches
 * Request: 
 *   - Query Parameters: 
 *     - date (optional): string (ISO 8601 date format) to filter matches by a specific day
 * Response: 
 *   - 200 OK: Array of Match
 *   - 401 Unauthorized: If authentication fails
 *   - 500 Internal Server Error: If there is an issue with fetching data
 * Auth: Required (Bearer Token)
 * Gating: None
 */

interface GetLiveMatchesRequest {
  date?: string; // ISO 8601 date format
}

interface GetLiveMatchesResponse {
  matches: Match[];
}

// Example API call
// GET /api/live-matches?date=2023-10-05
```
