-- Statura — bespoke app schema (run after the spine's 001/002/003).

CREATE TABLE IF NOT EXISTS status_pages (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_text TEXT,
  custom_domain TEXT UNIQUE,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  sms_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  slack_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  webhook_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS component_groups (
  id BIGSERIAL PRIMARY KEY,
  status_page_id BIGINT NOT NULL REFERENCES status_pages(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  position INT NOT NULL DEFAULT 0,
  collapsed_by_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS components (
  id BIGSERIAL PRIMARY KEY,
  status_page_id BIGINT NOT NULL REFERENCES status_pages(id) ON DELETE CASCADE,
  group_id BIGINT REFERENCES component_groups(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  current_status TEXT NOT NULL DEFAULT 'operational' CHECK (current_status IN ('operational','degraded_performance','partial_outage','major_outage','under_maintenance')),
  position INT NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS endpoints (
  id BIGSERIAL PRIMARY KEY,
  status_page_id BIGINT NOT NULL REFERENCES status_pages(id) ON DELETE CASCADE,
  component_id BIGINT NOT NULL REFERENCES components(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL CHECK (url LIKE 'https://%'),
  method TEXT NOT NULL DEFAULT 'GET' CHECK (method IN ('GET','HEAD')),
  current_status TEXT NOT NULL DEFAULT 'unknown' CHECK (current_status IN ('operational','degraded','down','unknown')),
  expected_status_min INT NOT NULL DEFAULT 200,
  expected_status_max INT NOT NULL DEFAULT 399,
  degraded_threshold_ms INT NOT NULL DEFAULT 1500,
  timeout_ms INT NOT NULL DEFAULT 10000,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS uptime_checks (
  id BIGSERIAL PRIMARY KEY,
  endpoint_id BIGINT NOT NULL REFERENCES endpoints(id) ON DELETE CASCADE,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_up BOOLEAN NOT NULL,
  response_time_ms INT NOT NULL DEFAULT 0,
  status_code INT,
  error_message TEXT
);
CREATE INDEX IF NOT EXISTS idx_uptime_checks_endpoint_checked ON uptime_checks(endpoint_id, checked_at DESC);

CREATE TABLE IF NOT EXISTS uptime_days (
  id BIGSERIAL PRIMARY KEY,
  component_id BIGINT NOT NULL REFERENCES components(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  uptime_percentage NUMERIC(6,3) NOT NULL DEFAULT 100,
  status TEXT NOT NULL DEFAULT 'operational' CHECK (status IN ('operational','degraded_performance','partial_outage','major_outage','under_maintenance','no_data')),
  checks_count INT NOT NULL DEFAULT 0,
  down_minutes INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(component_id, day)
);

CREATE TABLE IF NOT EXISTS incidents (
  id BIGSERIAL PRIMARY KEY,
  status_page_id BIGINT NOT NULL REFERENCES status_pages(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('investigating','identified','monitoring','resolved')),
  impact TEXT NOT NULL DEFAULT 'minor' CHECK (impact IN ('minor','major','critical','maintenance')),
  started_at TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_incidents_page_started ON incidents(status_page_id, started_at DESC);

CREATE TABLE IF NOT EXISTS incident_components (
  incident_id BIGINT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  component_id BIGINT NOT NULL REFERENCES components(id) ON DELETE CASCADE,
  PRIMARY KEY (incident_id, component_id)
);

CREATE TABLE IF NOT EXISTS incident_updates (
  id BIGSERIAL PRIMARY KEY,
  incident_id BIGINT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('investigating','identified','monitoring','resolved')),
  body TEXT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_incident_updates_incident_published ON incident_updates(incident_id, published_at DESC);

CREATE TABLE IF NOT EXISTS maintenances (
  id BIGSERIAL PRIMARY KEY,
  status_page_id BIGINT NOT NULL REFERENCES status_pages(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','in_progress','verifying','completed')),
  impact TEXT NOT NULL DEFAULT 'maintenance' CHECK (impact IN ('minor','major','critical','maintenance')),
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_maintenances_page_window ON maintenances(status_page_id, scheduled_start DESC);

CREATE TABLE IF NOT EXISTS maintenance_components (
  maintenance_id BIGINT NOT NULL REFERENCES maintenances(id) ON DELETE CASCADE,
  component_id BIGINT NOT NULL REFERENCES components(id) ON DELETE CASCADE,
  PRIMARY KEY (maintenance_id, component_id)
);

CREATE TABLE IF NOT EXISTS maintenance_updates (
  id BIGSERIAL PRIMARY KEY,
  maintenance_id BIGINT NOT NULL REFERENCES maintenances(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('scheduled','in_progress','verifying','completed')),
  body TEXT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscribers (
  id BIGSERIAL PRIMARY KEY,
  status_page_id BIGINT NOT NULL REFERENCES status_pages(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email','sms','slack','webhook')),
  destination TEXT NOT NULL,
  verified_at TIMESTAMPTZ,
  verification_token TEXT NOT NULL UNIQUE,
  manage_token TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(status_page_id, channel, destination)
);

CREATE TABLE IF NOT EXISTS subscriber_components (
  subscriber_id BIGINT NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  component_id BIGINT NOT NULL REFERENCES components(id) ON DELETE CASCADE,
  PRIMARY KEY (subscriber_id, component_id)
);

CREATE TABLE IF NOT EXISTS notification_deliveries (
  id BIGSERIAL PRIMARY KEY,
  subscriber_id BIGINT NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  incident_id BIGINT REFERENCES incidents(id) ON DELETE CASCADE,
  maintenance_id BIGINT REFERENCES maintenances(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sent','failed')),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
