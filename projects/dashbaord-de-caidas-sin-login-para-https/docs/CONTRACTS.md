# Contract — Core Feature

## TypeScript Types

```ts
export type ISODateTime = string;
export type URLString = string;
export type EmailString = string;

export type HealthStatus = "up" | "down" | "timeout" | "error";
export type AlertEventType = "downtime_detected" | "recovery";

export interface MonitoredEndpoint {
  id: string;
  name: string;
  url: URLString;
  check_interval_minutes: number;
  is_active: boolean;
}

export interface HealthCheck {
  id: string;
  endpoint_id: string;
  checked_at: ISODateTime;
  status: HealthStatus;
  http_status_code: number | null;
  response_time_ms: number | null;
  failure_reason: string | null;
}

export interface AlertEvent {
  id: string;
  endpoint_id: string;
  event_type: AlertEventType;
  triggered_at: ISODateTime;
  email_recipient: EmailString;
  email_sent: boolean;
  message: string;
}

export interface PublicDashboardStatus {
  endpoint: MonitoredEndpoint;
  current_status: HealthStatus;
  last_checked_at: ISODateTime | null;
  last_http_status_code: number | null;
  last_response_time_ms: number | null;
  uptime_percentage_24h: number;
  total_checks_24h: number;
  failed_checks_24h: number;
  active_incident: {
    started_at: ISODateTime;
    latest_failure_reason: string | null;
  } | null;
  recent_checks: HealthCheck[];
  recent_alerts: AlertEvent[];
}
```

---

## Core API Endpoint

### `GET /api/public/status`

Public endpoint for the no-login dashboard showing the current status and basic metrics of the monitored URL.

### Auth
- **None**
- Publicly accessible

### Gating
- Returns data only for the single configured public monitored endpoint:
  `https://addi.meetgravity.io/sign-in`
- Read-only
- No tenant/user scoping
- Rate limit recommended: `60 requests/minute per IP`

---

## Request

### Query Params
None

### Example
```http
GET /api/public/status
```

---

## Response

### `200 OK`
```ts
export interface GetPublicStatusResponse {
  data: PublicDashboardStatus;
}
```

### Example
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

---

## Error Responses

### `503 Service Unavailable`
Dashboard data temporarily unavailable.

```ts
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
  };
}
```

Example:
```json
{
  "error": {
    "code": "STATUS_UNAVAILABLE",
    "message": "Public status is temporarily unavailable."
  }
}
```