-- StatusPe — bespoke app schema (run after the spine's 001/002/003).

CREATE TABLE IF NOT EXISTS status_pages (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  main_site_url TEXT,
  custom_domain TEXT,
  timezone TEXT NOT NULL DEFAULT 'America/Lima',
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  subscribe_email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  subscribe_webhook_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  subscribe_rss_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  footer_text TEXT NOT NULL DEFAULT 'Powered by StatusPe',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS status_pages_custom_domain_unique ON status_pages (lower(custom_domain)) WHERE custom_domain IS NOT NULL;

CREATE TABLE IF NOT EXISTS analytics_events (
  id BIGSERIAL PRIMARY KEY,
  event_name TEXT NOT NULL,
  status_page_id BIGINT REFERENCES status_pages(id) ON DELETE SET NULL,
  subscriber_id BIGINT,
  slug TEXT,
  anonymous_id TEXT,
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_created ON analytics_events(event_name, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_page_created ON analytics_events(status_page_id, created_at);

CREATE TABLE IF NOT EXISTS component_groups (
  id BIGSERIAL PRIMARY KEY,
  status_page_id BIGINT NOT NULL REFERENCES status_pages(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  is_collapsed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT component_groups_status_page_id_id_unique UNIQUE (status_page_id, id)
);

CREATE TABLE IF NOT EXISTS components (
  id BIGSERIAL PRIMARY KEY,
  status_page_id BIGINT NOT NULL REFERENCES status_pages(id) ON DELETE CASCADE,
  group_id BIGINT,
  name TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  current_status TEXT NOT NULL DEFAULT 'operational' CHECK (current_status IN ('operational','degraded','outage','paused','maintenance')),
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT components_status_page_id_id_unique UNIQUE (status_page_id, id),
  CONSTRAINT components_status_page_group_fk FOREIGN KEY (status_page_id, group_id) REFERENCES component_groups(status_page_id, id) ON DELETE SET NULL (group_id)
);

CREATE TABLE IF NOT EXISTS endpoints (
  id BIGSERIAL PRIMARY KEY,
  status_page_id BIGINT NOT NULL REFERENCES status_pages(id) ON DELETE CASCADE,
  component_id BIGINT NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL CHECK (url ~ '^https://'),
  method TEXT NOT NULL DEFAULT 'GET' CHECK (method IN ('GET','HEAD','POST')),
  expected_status_min INTEGER NOT NULL DEFAULT 200,
  expected_status_max INTEGER NOT NULL DEFAULT 299,
  check_interval_minutes INTEGER NOT NULL DEFAULT 5 CHECK (check_interval_minutes BETWEEN 1 AND 1440),
  timeout_ms INTEGER NOT NULL DEFAULT 10000 CHECK (timeout_ms BETWEEN 1000 AND 60000),
  region TEXT NOT NULL DEFAULT 'global',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  current_status TEXT NOT NULL DEFAULT 'operational' CHECK (current_status IN ('operational','degraded','outage','paused')),
  last_checked_at TIMESTAMPTZ,
  last_response_time_ms INTEGER,
  last_status_code INTEGER,
  consecutive_failures INTEGER NOT NULL DEFAULT 0,
  consecutive_successes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT endpoints_status_page_id_id_unique UNIQUE (status_page_id, id),
  CONSTRAINT endpoints_status_page_component_fk FOREIGN KEY (status_page_id, component_id) REFERENCES components(status_page_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS status_checks (
  id BIGSERIAL PRIMARY KEY,
  endpoint_id BIGINT NOT NULL REFERENCES endpoints(id) ON DELETE CASCADE,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('operational','degraded','outage','paused')),
  response_time_ms INTEGER,
  status_code INTEGER,
  error_message TEXT,
  region TEXT NOT NULL DEFAULT 'global'
);
CREATE INDEX IF NOT EXISTS idx_status_checks_endpoint_checked ON status_checks(endpoint_id, checked_at DESC);

CREATE TABLE IF NOT EXISTS uptime_daily (
  id BIGSERIAL PRIMARY KEY,
  endpoint_id BIGINT NOT NULL REFERENCES endpoints(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  uptime_percentage NUMERIC(5,2),
  total_checks INTEGER NOT NULL DEFAULT 0,
  operational_checks INTEGER NOT NULL DEFAULT 0,
  degraded_checks INTEGER NOT NULL DEFAULT 0,
  outage_checks INTEGER NOT NULL DEFAULT 0,
  worst_status TEXT NOT NULL DEFAULT 'operational' CHECK (worst_status IN ('operational','degraded','outage','paused','maintenance')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(endpoint_id, day)
);

CREATE TABLE IF NOT EXISTS incidents (
  id BIGSERIAL PRIMARY KEY,
  status_page_id BIGINT NOT NULL REFERENCES status_pages(id) ON DELETE CASCADE,
  endpoint_id BIGINT,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('investigating','identified','monitoring','resolved')),
  impact TEXT NOT NULL DEFAULT 'minor' CHECK (impact IN ('none','minor','major','critical')),
  started_at TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT incidents_status_page_id_id_unique UNIQUE (status_page_id, id),
  CONSTRAINT incidents_status_page_endpoint_fk FOREIGN KEY (status_page_id, endpoint_id) REFERENCES endpoints(status_page_id, id) ON DELETE SET NULL (endpoint_id)
);
CREATE INDEX IF NOT EXISTS idx_incidents_page_started ON incidents(status_page_id, started_at DESC);

CREATE TABLE IF NOT EXISTS incident_updates (
  id BIGSERIAL PRIMARY KEY,
  incident_id BIGINT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('investigating','identified','monitoring','resolved')),
  message TEXT NOT NULL,
  author_label TEXT NOT NULL DEFAULT 'StatusPe',
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_incident_updates_incident_published ON incident_updates(incident_id, published_at DESC);

CREATE TABLE IF NOT EXISTS incident_components (
  status_page_id BIGINT NOT NULL REFERENCES status_pages(id) ON DELETE CASCADE,
  incident_id BIGINT NOT NULL,
  component_id BIGINT NOT NULL,
  affected_status TEXT NOT NULL CHECK (affected_status IN ('operational','degraded','outage','maintenance')),
  PRIMARY KEY (incident_id, component_id),
  CONSTRAINT incident_components_status_page_incident_fk FOREIGN KEY (status_page_id, incident_id) REFERENCES incidents(status_page_id, id) ON DELETE CASCADE,
  CONSTRAINT incident_components_status_page_component_fk FOREIGN KEY (status_page_id, component_id) REFERENCES components(status_page_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS scheduled_maintenances (
  id BIGSERIAL PRIMARY KEY,
  status_page_id BIGINT NOT NULL REFERENCES status_pages(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('scheduled','in_progress','verifying','completed','cancelled')),
  impact TEXT NOT NULL DEFAULT 'none' CHECK (impact IN ('none','minor','major','critical')),
  scheduled_start_at TIMESTAMPTZ NOT NULL,
  scheduled_end_at TIMESTAMPTZ NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT scheduled_maintenances_status_page_id_id_unique UNIQUE (status_page_id, id)
);
CREATE INDEX IF NOT EXISTS idx_maint_page_window ON scheduled_maintenances(status_page_id, scheduled_start_at DESC);

CREATE TABLE IF NOT EXISTS maintenance_updates (
  id BIGSERIAL PRIMARY KEY,
  maintenance_id BIGINT NOT NULL REFERENCES scheduled_maintenances(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('scheduled','in_progress','verifying','completed','cancelled')),
  message TEXT NOT NULL,
  author_label TEXT NOT NULL DEFAULT 'StatusPe',
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_maintenance_updates_maintenance_published ON maintenance_updates(maintenance_id, published_at DESC);

CREATE TABLE IF NOT EXISTS maintenance_components (
  status_page_id BIGINT NOT NULL REFERENCES status_pages(id) ON DELETE CASCADE,
  maintenance_id BIGINT NOT NULL,
  component_id BIGINT NOT NULL,
  expected_status TEXT NOT NULL CHECK (expected_status IN ('operational','degraded','outage','maintenance')),
  PRIMARY KEY (maintenance_id, component_id),
  CONSTRAINT maintenance_components_status_page_maintenance_fk FOREIGN KEY (status_page_id, maintenance_id) REFERENCES scheduled_maintenances(status_page_id, id) ON DELETE CASCADE,
  CONSTRAINT maintenance_components_status_page_component_fk FOREIGN KEY (status_page_id, component_id) REFERENCES components(status_page_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS subscribers (
  id BIGSERIAL PRIMARY KEY,
  status_page_id BIGINT NOT NULL REFERENCES status_pages(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email','webhook')),
  email TEXT,
  webhook_url TEXT,
  phone TEXT,
  wants_all_components BOOLEAN NOT NULL DEFAULT TRUE,
  verification_token TEXT NOT NULL UNIQUE,
  manage_token TEXT NOT NULL UNIQUE,
  verified_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ((channel = 'email' AND email IS NOT NULL) OR (channel = 'webhook' AND webhook_url IS NOT NULL)),
  CONSTRAINT subscribers_status_page_id_id_unique UNIQUE (status_page_id, id)
);
CREATE INDEX IF NOT EXISTS idx_subscribers_page_channel ON subscribers(status_page_id, channel);

CREATE TABLE IF NOT EXISTS subscriber_components (
  status_page_id BIGINT NOT NULL REFERENCES status_pages(id) ON DELETE CASCADE,
  subscriber_id BIGINT NOT NULL,
  component_id BIGINT NOT NULL,
  PRIMARY KEY (subscriber_id, component_id),
  CONSTRAINT subscriber_components_status_page_subscriber_fk FOREIGN KEY (status_page_id, subscriber_id) REFERENCES subscribers(status_page_id, id) ON DELETE CASCADE,
  CONSTRAINT subscriber_components_status_page_component_fk FOREIGN KEY (status_page_id, component_id) REFERENCES components(status_page_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notification_deliveries (
  id BIGSERIAL PRIMARY KEY,
  subscriber_id BIGINT NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  incident_id BIGINT REFERENCES incidents(id) ON DELETE CASCADE,
  maintenance_id BIGINT REFERENCES scheduled_maintenances(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email','webhook')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed')),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (incident_id IS NOT NULL OR maintenance_id IS NOT NULL)
);
