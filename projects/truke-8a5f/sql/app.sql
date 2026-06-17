-- Truke — bespoke app schema (run after the spine's 001/002/003).

CREATE TABLE IF NOT EXISTS items (
  id BIGSERIAL PRIMARY KEY,
  owner_id BIGINT REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  city TEXT,
  status TEXT DEFAULT 'available',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS swipes (
  user_id BIGINT REFERENCES users(id),
  item_id BIGINT REFERENCES items(id),
  liked BOOLEAN,
  PRIMARY KEY (user_id, item_id)
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
  body TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);
