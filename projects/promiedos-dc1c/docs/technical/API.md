# API Documentation

## Endpoints

### Get Live Matches
- **Method**: GET
- **Path**: `/api/live-matches`
- **Request**:
  - **Query Parameters**:
    - `date` (optional): string (ISO 8601 format) - Filter matches by date
    - `leagueId` (optional): number - Filter matches by league
- **Response**:
  - **200 OK**:
    - **Content-Type**: application/json
    - **Body**:
      ```json
      {
        "matches": [
          {
            "id": 1,
            "dateTime": "2023-10-10T15:00:00Z",
            "teamHome": "Team A",
            "teamAway": "Team B",
            "scoreHome": 2,
            "scoreAway": 1
          }
        ],
        "fixtures": [
          {
            "matchId": 1,
            "date": "2023-10-10",
            "leagueId": 1,
            "status": "Scheduled"
          }
        ],
        "leagues": [
          {
            "id": 1,
            "name": "League 1",
            "country": "Argentina",
            "season": "2023",
            "currentRound": 5
          }
        ]
      }
      ```
- **Auth**: None required
- **Gating**:
  - Rate limiting: 100 requests per minute per IP