```typescript
// TypeScript Types

type Match = {
  id: number;
  dateTime: string; // ISO 8601 format
  teamHome: string;
  teamAway: string;
  scoreHome: number;
  scoreAway: number;
};

type Tournament = {
  id: number;
  name: string;
  startDate: string; // ISO 8601 format
  endDate: string; // ISO 8601 format
  currentRound: number;
};

type Standings = {
  tournamentId: number;
  teamName: string;
  points: number;
  matchesPlayed: number;
};

type GoalScorer = {
  matchId: number;
  playerName: string;
  goals: number;
};

// API Endpoint

/**
 * Get Live Football Data
 * Method: GET
 * Path: /api/v1/live-football-data
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
 * Auth: None
 * Gating: None
 */
```