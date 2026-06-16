-- Puglit Spine — auth schema (users + short-lived tokens). Run in Supabase SQL
-- editor in prod. Mirrors ensureAuthSchema() in spine/lib/users.ts. Idempotent.

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(120),
  password_hash TEXT,
  plan VARCHAR(40) NOT NULL DEFAULT 'free',
  subscription_end TIMESTAMP WITH TIME ZONE,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  oauth_provider VARCHAR(20),
  profile JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(LOWER(email));

-- verify / reset / magic — opaque, single-use, expiring.
CREATE TABLE IF NOT EXISTS auth_tokens (
  id SERIAL PRIMARY KEY,
  kind VARCHAR(10) NOT NULL,
  token VARCHAR(120) UNIQUE NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_token ON auth_tokens(token);
