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

type League = {
  id: number;
  name: string;
  country: string;
  season: string;
  currentRound: number;
};

type Player = {
  id: number;
  name: string;
  team: string;
  goals: number;
  position: 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Forward';
};

type Fixture = {
  matchId: number;
  date: string; // ISO 8601 format
  leagueId: number;
  status: 'Scheduled' | 'Ongoing' | 'Completed';
};

// API Endpoint

/**
 * Get Live Matches
 * Method: GET
 * Path: /api/live-matches
 * Request: 
 *   - Query Parameters: 
 *     - date (optional): string (ISO 8601 format) - Filter matches by date
 *     - leagueId (optional): number - Filter matches by league
 * Response:
 *   - 200 OK: 
 *     - Content-Type: application/json
 *     - Body: {
 *         matches: Match[];
 *         fixtures: Fixture[];
 *         leagues: League[];
 *       }
 * Auth: 
 *   - None required
 * Gating:
 *   - Rate limiting: 100 requests per minute per IP
 */
```

This contract defines the core feature of the Promiedos clone, focusing on providing live match updates, fixtures, and league information. The endpoint `/api/live-matches` allows users to retrieve live match data, optionally filtered by date or league. The response includes arrays of matches, fixtures, and leagues, providing comprehensive real-time football information.