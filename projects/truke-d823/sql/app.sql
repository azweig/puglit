-- Truke — bespoke app schema (run after the spine's 001/002/003).

CREATE TABLE IF NOT EXISTS items (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  owner_id BIGINT REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS swipes (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  item_id BIGINT REFERENCES items(id),
  liked BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS matches (
  id BIGSERIAL PRIMARY KEY,
  item_a_id BIGINT REFERENCES items(id),
  item_b_id BIGINT REFERENCES items(id),
  user_a_id BIGINT REFERENCES users(id),
  user_b_id BIGINT REFERENCES users(id),
  matched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  match_id BIGINT REFERENCES matches(id),
  sender_id BIGINT REFERENCES users(id),
  body TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);
