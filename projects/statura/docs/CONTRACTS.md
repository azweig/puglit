# Statura — Core Contract

## Core feature
**Public status page (no login)** that shows:
- current status of monitored HTTPS endpoints
- recent incident(s)
- uptime history / recent checks

---

## TypeScript types

```ts
type ID = string;
type ISODateTime = string;
type URLString = string;
type Slug = string;

type EndpointStatus = "operational" | "degraded" | "down" | "unknown";
type IncidentStatus = "investigating" | "identified" | "monitoring" | "resolved";

export interface StatusPage {
  id: ID;
  title: string;
  slug: Slug;
  custom_domain: URLString | null;
  is_public: boolean;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface Endpoint {
  id: ID;
  status_page_id: ID;
  name: string;
  url: URLString;
  current_status: EndpointStatus;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface Incident {
  id: ID;
  status_page_id: ID;
  title: string;
  description: string;
  status: IncidentStatus;
  started_at: ISODateTime;
  resolved_at: ISODateTime | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface UptimeCheck {
  id: ID;
  endpoint_id: ID;
  checked_at: ISODateTime;
  is_up: boolean;
  response_time_ms: number;
}

export interface PublicStatusPageResponse {
  status_page: {
    id: ID;
    title: string;
    slug: Slug;
    custom_domain: URLString | null;
  };
  overall_status: EndpointStatus;
  endpoints: Array<{
    id: ID;
    name: string;
    url: URLString;
    current_status: EndpointStatus;
    uptime_percentage_90d: number;
    last_checked_at: ISODateTime | null;
    recent_checks: Array<{
      checked_at: ISODateTime;
      is_up: boolean;
      response_time_ms: number;
    }>;
  }>;
  active_incidents: Array<{
    id: ID;
    title: string;
    description: string;
    status: IncidentStatus;
    started_at: ISODateTime;
  }>;
  resolved_incidents: Array<{
    id: ID;
    title: string;
    status: IncidentStatus; // typically "resolved"
    started_at: ISODateTime;
    resolved_at: ISODateTime | null;
  }>;
  generated_at: ISODateTime;
}
```

---

## Single most important API endpoint

### `GET /api/public/status-pages/:slug`

Fetches the full public status page by slug for unauthenticated visitors.

---

## Request

### Method
`GET`

### Path params
```ts
type GetPublicStatusPageParams = {
  slug: Slug;
};
```

### Query params
```ts
type GetPublicStatusPageQuery = {
  checks_limit?: number; // default 20, max 100
  incident_limit?: number; // default 10, max 50
};
```

### Headers
```ts
type GetPublicStatusPageHeaders = {
  host?: string; // used to resolve custom_domain if applicable
};
```

---

## Response

### `200 OK`
```ts
type GetPublicStatusPageResponse = PublicStatusPageResponse;
```

### `404 Not Found`
```ts
type ErrorResponse = {
  error: {
    code: "STATUS_PAGE_NOT_FOUND" | "STATUS_PAGE_NOT_PUBLIC";
    message: string;
  };
};
```

---

## Auth
**None.** Public endpoint.

---

## Gating / access rules
- Only returns pages where `is_public === true`.
- Resolve page by:
  1. `custom_domain` matching request host, else
  2. `slug` from path.
- Only include endpoints belonging to the resolved `status_page_id`.
- Only include incidents belonging to the resolved `status_page_id`.
- Only include uptime checks belonging to returned endpoints.
- Public response must **not** expose internal/private pages, monitor config, or ownership/account data.
- Optional rate limit: `60 req/min/IP`.

---

## Notes
- `overall_status` should be the worst derived status across endpoints.
- `recent_checks` is intended for sparkline/history rendering on the public page.
- This endpoint is sufficient to render a status page similar to `status.claude.com`.