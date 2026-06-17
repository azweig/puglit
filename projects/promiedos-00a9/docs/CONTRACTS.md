```typescript
// TypeScript Types

type Match = {
  match_date: string; // ISO 8601 format
  home_team: string;
  away_team: string;
  score: string; // Format: "home_score-away_score"
};

type Tournament = {
  id: number;
  name: string;
  start_date: string; // ISO 8601 format
  end_date: string; // ISO 8601 format
  type: 'league' | 'cup' | 'friendly';
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

// API Endpoint for Core Feature

/**
 * Get Live Matches and Tournament Data
 * 
 * Method: GET
 * Path: /api/v1/live-matches
 * Request: 
 *   - Query Parameters:
 *     - date: string (optional, ISO 8601 format, defaults to current date)
 * Response:
 *   - 200 OK
 *     - Content-Type: application/json
 *     - Body: {
 *         matches: Match[],
 *         tournaments: Tournament[],
 *         standings: Standings[],
 *         goalScorers: GoalScorer[]
 *       }
 *   - 400 Bad Request
 *     - Content-Type: application/json
 *     - Body: { error: string }
 *   - 500 Internal Server Error
 *     - Content-Type: application/json
 *     - Body: { error: string }
 * Auth: None
 * Gating: None
 */
```