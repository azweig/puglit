# StatusPe — Core Contract

## Core feature
Public status page (no login required) that shows:
- current status of monitored HTTPS endpoints
- recent uptime/history
- incidents

---

## TypeScript types

```ts
type ID = string;
type ISODateTime = string;
type URLString = string;

type EndpointStatus = "operational" | "degraded" | "outage" | "paused";
type IncidentStatus = "investigating" | "identified" | "monitoring" | "resolved";

export interface Endpoint {
  id: ID;
  status_page_id: ID;
  name: string;
  url: URLString;
  check_interval_minutes: number;
  is_active: boolean;

  // derived/current state for public page
  current_status: EndpointStatus;
  last_checked_at: ISODateTime | null;
  last_response_time_ms: number | null;
  last_status_code: number | null;
}

export interface Incident {
  id: ID;
  status_page_id: ID;
  endpoint_id: ID | null; // null = page-wide incident
  title: string;
  description: string;
  status: IncidentStatus;
  started_at: ISODateTime;
  resolved_at: ISODateTime | null;
}

export interface StatusCheck {
  id: ID;
  endpoint_id: ID;
  checked_at: ISODateTime;
  status: EndpointStatus;
  response_time_ms: number | null;
  status_code: number | null;
}

export interface StatusPage {
  id: ID;
  name: string;
  slug: string;
  custom_domain: URLString | null;
  is_public: boolean;
}
```

---

## Public API surface for core feature

### Endpoint
`GET /api/v1/status-pages/:slug`

Fetch the public status page by slug, including current endpoint status, uptime summary, recent incidents, and recent checks/history.

---

## Auth
- **No auth required**
- Publicly accessible only when `status_page.is_public === true`

---

## Gating / access rules
- Return `404` if slug does not exist
- Return `403` if status page exists but is not public
- Only expose data for:
  - active endpoints: `endpoint.is_active === true`
  - incidents belonging to the page
- If custom domain routing is used, the same payload may be served by domain lookup instead of slug, but **canonical contract** is slug-based endpoint above

---

## Request

### Path params
```ts
interface GetStatusPageParams {
  slug: string;
}
```

### Query params
```ts
interface GetStatusPageQuery {
  history_hours?: number;     // default 24, max 720
  checks_per_endpoint?: number; // default 50, max 500
  incidents_limit?: number;   // default 10, max 100
}
```

---

## Response

```ts
export interface GetStatusPageResponse {
  status_page: {
    id: ID;
    name: string;
    slug: string;
    custom_domain: URLString | null;
  };

  overall_status: EndpointStatus;

  endpoints: Array<{
    id: ID;
    name: string;
    url: URLString;
    current_status: EndpointStatus;
    check_interval_minutes: number;
    last_checked_at: ISODateTime | null;
    last_response_time_ms: number | null;
    last_status_code: number | null;

    uptime_percentage_24h: number | null; // 0-100
    checks: Array<{
      checked_at: ISODateTime;
      status: EndpointStatus;
      response_time_ms: number | null;
      status_code: number | null;
    }>;
  }>;

  active_incidents: Incident[];
  recent_incidents: Incident[];

  generated_at: ISODateTime;
}
```

---

## Success example

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

---

## Error responses

```ts
interface ErrorResponse {
  error: {
    code: "not_found" | "forbidden" | "validation_error";
    message: string;
  };
}
```

### Status codes
- `200` OK
- `403` Forbidden
- `404` Not Found
- `422` Validation Error

---

## Most important contract decision
The **single core endpoint** is a **read-optimized public aggregate**:
- one request
- no auth
- renders the full public status page
- includes current status + history + incidents

This keeps the public status page fast and simple for clients.