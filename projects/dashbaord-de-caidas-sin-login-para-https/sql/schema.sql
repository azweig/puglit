CREATE TABLE IF NOT EXISTS monitoredendpoints (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  check_interval_minutes INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS healthchecks (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  checked_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL,
  http_status_code INTEGER,
  response_time_ms INTEGER,
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alertevents (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  triggered_at TIMESTAMPTZ NOT NULL,
  email_recipient VARCHAR(255) NOT NULL,
  email_sent BOOLEAN NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);