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
