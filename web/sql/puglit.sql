-- Puglit web — run this in the Supabase SQL editor (the app role can't DDL).
-- Stores every generated project (raw interview answers + generated config)
-- and the waitlist. Idempotent.

CREATE TABLE IF NOT EXISTS puglit_projects (
  id BIGSERIAL PRIMARY KEY,
  slug VARCHAR(80) UNIQUE NOT NULL,
  email VARCHAR(255),
  name VARCHAR(120) NOT NULL,
  answers JSONB NOT NULL,            -- the raw interview answers
  config JSONB NOT NULL,             -- the generated domain.config
  featured BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_puglit_projects_created ON puglit_projects(created_at DESC);

CREATE TABLE IF NOT EXISTS puglit_waitlist (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generation jobs (live multi-agent build state). Created by ensureSchema in dev; run this in prod.
CREATE TABLE IF NOT EXISTS puglit_jobs (
  id VARCHAR(32) PRIMARY KEY,
  slug VARCHAR(120) NOT NULL,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'queued',
  answers JSONB NOT NULL,
  branding JSONB,
  config JSONB,
  steps JSONB NOT NULL,
  artifacts JSONB,
  completion INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  lease_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_puglit_jobs_status ON puglit_jobs(status, updated_at DESC);
