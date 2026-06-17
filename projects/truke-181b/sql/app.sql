-- Truke — bespoke app schema (run after the spine's 001/002/003).

CREATE TABLE IF NOT EXISTS items (
  id BIGSERIAL PRIMARY KEY,
  owner_id BIGINT REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  condition TEXT CHECK (condition IN ('new', 'like_new', 'used', 'for_parts')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS swipes (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  item_id BIGINT REFERENCES items(id),
  liked BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS matches (
  id BIGSERIAL PRIMARY KEY,
  user_a BIGINT REFERENCES users(id),
  user_b BIGINT REFERENCES users(id),
  item_a BIGINT REFERENCES items(id),
  item_b BIGINT REFERENCES items(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  match_id BIGINT REFERENCES matches(id),
  sender_id BIGINT REFERENCES users(id),
  body TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
