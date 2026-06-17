-- Descuentos Perú — bespoke app schema (run after the spine's 001/002/003).

CREATE TABLE IF NOT EXISTS programs (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  category TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_memberships (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  program_id BIGINT REFERENCES programs(id)
);

CREATE TABLE IF NOT EXISTS merchants (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS branches (
  id BIGSERIAL PRIMARY KEY,
  merchant_id BIGINT REFERENCES merchants(id),
  address TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL
);

CREATE TABLE IF NOT EXISTS offers (
  id BIGSERIAL PRIMARY KEY,
  merchant_id BIGINT REFERENCES merchants(id),
  title TEXT NOT NULL,
  discount_label TEXT NOT NULL,
  program_id BIGINT REFERENCES programs(id)
);


-- user location store (Puglit geo capability)
CREATE TABLE IF NOT EXISTS user_locations (
  user_id BIGINT PRIMARY KEY REFERENCES users(id),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
