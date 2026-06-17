# API Documentation

## Endpoints

### Get Live Matches
- **Method**: `GET`
- **Path**: `/api/live-matches`
- **Request**:
  - Query Parameters:
    - `date` (optional): string (ISO 8601 format) - Filter matches by date
- **Response**:
  - **200 OK**: Array of `Match`
  - **401 Unauthorized**: If authentication fails
  - **500 Internal Server Error**: If there is a server-side issue
- **Auth**: Required (Bearer Token)
- **Gating**: Rate limiting to prevent abuse

### Request Example
```http
GET /api/live-matches?date=2023-10-01 HTTP/1.1
Authorization: Bearer <token>
```

### Response Example
```json
{
  "matches": [
    {
      "id": 1,
      "date": "2023-10-01T15:00:00Z",
      "team_home": "Team A",
      "team_away": "Team B",
      "score_home": 2,
      "score_away": 1
    }
  ]
}
```

This API endpoint allows clients to retrieve live match data, filtered by date if specified, ensuring secure access through JWT authentication and controlled usage via rate limiting.