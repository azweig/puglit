# API

## Endpoints

### `GET /api/v1/status-pages/:slug`
Fetch the public status page by slug, including current endpoint status, uptime summary, recent incidents, and recent checks/history.

#### Request
- **Path Parameters**:
  - `slug`: The unique identifier for the status page.
- **Query Parameters**:
  - `history_hours`: Optional, default 24, max 720.
  - `checks_per_endpoint`: Optional, default 50, max 500.
  - `incidents_limit`: Optional, default 10, max 100.

#### Response
- **200 OK**: Returns the status page data.
- **403 Forbidden**: If the status page is not public.
- **404 Not Found**: If the slug does not exist.
- **422 Validation Error**: If query parameters are invalid.

#### Response Structure
```json
{
  "status_page": {
    "id": "sp_123",
    "name": "Acme API Status",
    "slug": "acme",
    "custom_domain": "https://status.acme.com"
  },
  "overall_status": "operational",
  "endpoints": [
    {
      "id": "ep_1",
      "name": "Public API",
      "url": "https://api.acme.com/health",
      "current_status": "operational",
      "check_interval_minutes": 5,
      "last_checked_at": "2026-06-18T10:00:00Z",
      "last_response_time_ms": 182,
      "last_status_code": 200,
      "uptime_percentage_24h": 99.95,
      "checks": [
        {
          "checked_at": "2026-06-18T10:00:00Z",
          "status": "operational",
          "response_time_ms": 182,
          "status_code": 200
        }
      ]
    }
  ],
  "active_incidents": [],
  "recent_incidents": [
    {
      "id": "inc_1",
      "status_page_id": "sp_123",
      "endpoint_id": "ep_1",
      "title": "Elevated API latency",
      "description": "We observed increased response times.",
      "status": "resolved",
      "started_at": "2026-06-17T08:00:00Z",
      "resolved_at": "2026-06-17T09:15:00Z"
    }
  ],
  "generated_at": "2026-06-18T10:00:01Z"
}
```

## Auth
- **No auth required**
- Publicly accessible only when `status_page.is_public === true`

## Gating / Access Rules
- Return `404` if slug does not exist
- Return `403` if status page exists but is not public
- Only expose data for:
  - active endpoints: `endpoint.is_active === true`
  - incidents belonging to the page
- If custom domain routing is used, the same payload may be served by domain lookup instead of slug, but **canonical contract** is slug-based endpoint above.