-- Descuentos Perú — bespoke app schema (run after the spine's 001/002/003).

CREATE TABLE IF NOT EXISTS loyalty_programs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  membership_id TEXT,
  expiration_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS discounts (
  id BIGSERIAL PRIMARY KEY,
  description TEXT NOT NULL,
  amount FLOAT NOT NULL,
  valid_until DATE NOT NULL,
  location TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_locations (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
