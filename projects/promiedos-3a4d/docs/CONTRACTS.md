```typescript
// TypeScript Types

type Match = {
  dateTime: string; // ISO 8601 format
  teamHome: string;
  teamAway: string;
  scoreHome: number;
  scoreAway: number;
};

type Tournament = {
  name: string;
  startDate: string; // ISO 8601 format
  endDate: string; // ISO 8601 format
  currentStage: string;
};

type Standings = {
  tournamentId: number;
  teamName: string;
  points: number;
  matchesPlayed: number;
  goalDifference: number;
};

type Scorer = {
  playerName: string;
  teamName: string;
  goals: number;
  tournamentId: number;
};

// API Endpoint

/**
 * Get Live Football Data
 * Method: GET
 * Path: /api/v1/live-football
 * Request: 
 *   - Query Parameters: 
 *     - date (optional): string (ISO 8601 format) - Filter matches by date
 *     - tournament (optional): string - Filter by tournament name
 * Response:
 *   - 200 OK: {
 *       matches: Match[];
 *       tournaments: Tournament[];
 *       standings: Standings[];
 *       topScorers: Scorer[];
 *     }
 *   - 400 Bad Request: { error: string }
 *   - 401 Unauthorized: { error: string }
 * Auth: Required (Bearer Token)
 * Gating: Rate limiting (e.g., 100 requests per hour per user)
 */
```