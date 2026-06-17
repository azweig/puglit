# API Documentation

## Get Live Matches and Tournament Data

### Endpoint
- **Method**: GET
- **Path**: `/api/v1/live-matches`

### Request
- **Query Parameters**:
  - `date` (optional): string, ISO 8601 format, defaults to the current date.

### Response
- **200 OK**
  - **Content-Type**: application/json
  - **Body**:
    ```json
    {
      "matches": Match[],
      "tournaments": Tournament[],
      "standings": Standings[],
      "goalScorers": GoalScorer[]
    }
    ```
- **400 Bad Request**
  - **Content-Type**: application/json
  - **Body**: `{ "error": "string" }`
- **500 Internal Server Error**
  - **Content-Type**: application/json
  - **Body**: `{ "error": "string" }`

### Authentication
- None required.

### Gating
- None applied.