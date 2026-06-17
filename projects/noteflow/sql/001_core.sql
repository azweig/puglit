-- Puglit Spine — core schema (analytics). Run in Supabase SQL editor in prod
-- (the app DB role is not the owner; ensureSchema() is skipped in production).
-- Idempotent.

CREATE TABLE IF NOT EXISTS page_visits (
  id SERIAL PRIMARY KEY,
  page VARCHAR(255) NOT NULL,
  referrer VARCHAR(500),
  user_agent TEXT,
  ip_address VARCHAR(45),
  session_id VARCHAR(255),
  user_id INTEGER,
  device_type VARCHAR(20) DEFAULT 'desktop',
  country VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_page_visits_created ON page_visits(created_at);
CREATE INDEX IF NOT EXISTS idx_page_visits_page ON page_visits(page);

CREATE TABLE IF NOT EXISTS analytics_events (
  id SERIAL PRIMARY KEY,
  event VARCHAR(64) NOT NULL,
  page VARCHAR(255),
  session_id VARCHAR(255),
  user_id INTEGER,
  device_type VARCHAR(20) DEFAULT 'desktop',
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event ON analytics_events(event);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at);
