# API Documentation

## Get Live Matches

### Endpoint
- **Method**: GET
- **Path**: `/api/live-matches`

### Request
- **Query Parameters**:
  - `date` (optional): string (ISO 8601 date format) to filter matches by a specific day

### Response
- **200 OK**: Returns an array of `Match` objects
- **401 Unauthorized**: If authentication fails
- **500 Internal Server Error**: If there is an issue with fetching data

### Authentication
- **Required**: Bearer Token

### Gating
- **None**

### Example
```http
GET /api/live-matches?date=2023-10-05
Authorization: Bearer <token>
```

### Response Example
```json
{
  "matches": [
    {
      "date": "2023-10-05T15:00:00Z",
      "team_home": "Team A",
      "team_away": "Team B",
      "score_home": 2,
      "score_away": 1
    }
  ]
}
```