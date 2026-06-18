# API Documentation

## Core API Endpoint

### `GET /api/public/status`
Public endpoint for the no-login dashboard showing the current status and basic metrics of the monitored URL.

### Authentication
- **None**: This endpoint is publicly accessible without authentication.

### Gating
- Returns data only for the single configured public monitored endpoint: `https://addi.meetgravity.io/sign-in`
- Read-only access
- No tenant/user scoping
- Rate limit recommended: `60 requests/minute per IP`

### Request
- **Query Params**: None

#### Example Request
```http
GET /api/public/status
```

### Response
- **200 OK**: Returns the current status and metrics.

#### Example Response
```json
{
  "data": {
    "endpoint": {
      "id": "ep_1",
      "name": "Addi Sign In",
      "url": "https://addi.meetgravity.io/sign-in",
      "check_interval_minutes": 5,
      "is_active": true
    },
    "current_status": "up",
    "last_checked_at": "2026-06-18T14:05:00Z",
    "last_http_status_code": 200,
    "last_response_time_ms": 482,
    "uptime_percentage_24h": 99.58,
    "total_checks_24h": 288,
    "failed_checks_24h": 1,
    "active_incident": null,
    "recent_checks": [
      {
        "id": "hc_123",
        "endpoint_id": "ep_1",
        "checked_at": "2026-06-18T14:05:00Z",
        "status": "up",
        "http_status_code": 200,
        "response_time_ms": 482,
        "failure_reason": null
      }
    ],
    "recent_alerts": [
      {
        "id": "ae_45",
        "endpoint_id": "ep_1",
        "event_type": "recovery",
        "triggered_at": "2026-06-18T13:40:00Z",
        "email_recipient": "ops@example.com",
        "email_sent": true,
        "message": "Service recovered for https://addi.meetgravity.io/sign-in"
      }
    ]
  }
}
```

### Error Responses
- **503 Service Unavailable**: Dashboard data temporarily unavailable.

#### Example Error Response
```json
{
  "error": {
    "code": "STATUS_UNAVAILABLE",
    "message": "Public status is temporarily unavailable."
  }
}
```