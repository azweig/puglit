-- Descuentos Perú — bespoke app schema (run after the spine's 001/002/003).

CREATE TABLE IF NOT EXISTS programs (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  provider TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_memberships (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  program_id BIGINT REFERENCES programs(id),
  membership_number TEXT,
  expiration_date DATE
);

CREATE TABLE IF NOT EXISTS merchants (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT
);

CREATE TABLE IF NOT EXISTS branches (
  id BIGSERIAL PRIMARY KEY,
  merchant_id BIGINT REFERENCES merchants(id),
  address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION
);

CREATE TABLE IF NOT EXISTS offers (
  id BIGSERIAL PRIMARY KEY,
  merchant_id BIGINT REFERENCES merchants(id),
  title TEXT,
  discount_label TEXT,
  program_id BIGINT REFERENCES programs(id)
);
