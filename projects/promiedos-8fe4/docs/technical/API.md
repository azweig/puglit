# API

## Endpoints

### Get Live Matches
- **Method**: `GET`
- **Path**: `/api/live-matches`
- **Request**:
  - **Query Parameters**:
    - `date` (optional): string (ISO 8601 format) to filter matches by date
- **Response**:
  - **200 OK**: Returns an array of `Match` objects
  - **401 Unauthorized**: If authentication fails
- **Authentication**: Requires an API Key
- **Gating**: Rate limiting to prevent abuse

## Request/Response Example

### Request
```http
GET /api/live-matches?date=2023-10-10 HTTP/1.1
Host: api.promiedos.com
Authorization: Bearer <API_KEY>
```

### Response
```json
{
  "matches": [
    {
      "date_time": "2023-10-10T15:00:00Z",
      "team_home": "Team A",
      "team_away": "Team B",
      "score_home": 1,
      "score_away": 2
    }
  ]
}
```