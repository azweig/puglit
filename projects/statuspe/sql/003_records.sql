-- Puglit Spine — generic dashboard records (powers /app). Run in Supabase.
-- Mirrors ensureRecordsSchema() in spine/lib/records.ts. Idempotent.

CREATE TABLE IF NOT EXISTS records (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  entity VARCHAR(80) NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_records_user_entity ON records(user_id, entity);
