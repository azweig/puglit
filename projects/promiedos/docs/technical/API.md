# API Documentation

## Endpoints

### Get Live Football Data
- **Method**: GET
- **Path**: `/api/v1/live-football-data`
- **Query Parameters**:
  - `date` (optional): string, ISO 8601 format, defaults to current date
- **Response**:
  - **200 OK**
    - Content-Type: application/json
    - Body: `{ matches: Match[], tournaments: Tournament[], standings: Standings[], goalScorers: GoalScorer[] }`
  - **400 Bad Request**
    - Content-Type: application/json
    - Body: `{ error: string }`
- **Auth**: None
- **Gating**: None

## Request/Response Example
### Request
```
GET /api/v1/live-football-data?date=2023-10-15
```
### Response
```
200 OK
{
  "matches": [...],
  "tournaments": [...],
  "standings": [...],
  "goalScorers": [...]
}
```